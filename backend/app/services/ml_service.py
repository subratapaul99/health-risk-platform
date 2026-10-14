"""
Enhanced Inference Service & Clinical Risk Intelligence Engine.

Provides:
- Standard risk prediction with SHAP local explanations and percentile ranking
- Counterfactual "What-If" Lifestyle & Clinical Simulation
- Personalized Evidence-Based Clinical Recommendations
- Model Registry & Benchmark Metadata Access
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import shap

_DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[3] / "ml" / "models"
MODEL_DIR = Path(os.getenv("MODEL_DIR", str(_DEFAULT_MODEL_DIR)))

RISK_BANDS = [(0.0, 0.2, "low"), (0.2, 0.5, "moderate"), (0.5, 1.01, "high")]


def _risk_band(score: float) -> str:
    for lo, hi, label in RISK_BANDS:
        if lo <= score < hi:
            return label
    return "high"


class RiskModel:
    """Loads once at process startup and reused across requests."""

    def __init__(self):
        self.pipeline = joblib.load(MODEL_DIR / "diabetes_risk_model.joblib")
        with open(MODEL_DIR / "model_metadata.json") as f:
            self.metadata = json.load(f)

        shap_bundle = joblib.load(MODEL_DIR / "shap_background.joblib")
        self.background = shap_bundle["background"]

        self.prep = self.pipeline.named_steps["prep"]
        self.clf = self.pipeline.named_steps["clf"]

        underlying = self.clf
        if hasattr(self.clf, "calibrated_classifiers_"):
            underlying = self.clf.calibrated_classifiers_[0].estimator

        try:
            self.explainer = shap.TreeExplainer(underlying, self.background)
            self._explainer_kind = "tree"
        except Exception:
            self.explainer = shap.Explainer(underlying, self.background)
            self._explainer_kind = "generic"

        self.feature_cols = self.metadata["feature_cols"]
        self.numeric_cols = self.metadata["numeric_cols"]
        self.version = self.metadata.get("version", "v2.0-enhanced")
        self.score_distribution = self.metadata.get("score_distribution", [])
        self.all_models = self.metadata.get("all_models", {})

    def _build_feature_row(self, payload: dict) -> pd.DataFrame:
        row = {
            "pregnancies": payload.get("pregnancies", 0),
            "glucose": payload.get("glucose") or np.nan,
            "blood_pressure": payload.get("blood_pressure") or np.nan,
            "skin_thickness": payload.get("skin_thickness") or np.nan,
            "insulin": payload.get("insulin") or np.nan,
            "bmi": payload.get("bmi") or np.nan,
            "diabetes_pedigree": payload.get("diabetes_pedigree", 0.35),
            "age": payload.get("age", 30),
        }
        row["glucose_bmi_interaction"] = (row["glucose"] or 0) * (row["bmi"] or 0) / 100.0

        df = pd.DataFrame([row])

        bmi_cat = pd.cut(
            df["bmi"], bins=[0, 18.5, 25, 30, 100],
            labels=["underweight", "normal", "overweight", "obese"],
        )
        glucose_cat = pd.cut(
            df["glucose"], bins=[0, 100, 125, 300],
            labels=["normal", "prediabetic", "diabetic_range"],
        )
        age_bucket = pd.cut(
            df["age"], bins=[0, 30, 45, 60, 100],
            labels=["young_adult", "adult", "middle_age", "senior"],
        )

        for prefix, series in [
            ("bmi_category", bmi_cat),
            ("glucose_category", glucose_cat),
            ("age_bucket", age_bucket),
        ]:
            dummies = pd.get_dummies(series, prefix=prefix)
            df = pd.concat([df, dummies], axis=1)

        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0
        df = df[self.feature_cols]
        return df

    def _percentile(self, score: float) -> float:
        if not self.score_distribution:
            return 50.0
        import bisect
        idx = bisect.bisect_left(self.score_distribution, score)
        return round(100 * idx / len(self.score_distribution), 1)

    def predict(self, payload: dict) -> Tuple[float, str, Dict[str, float], float, float]:
        X = self._build_feature_row(payload)
        proba = float(self.pipeline.predict_proba(X)[0, 1])
        band = _risk_band(proba)
        percentile = self._percentile(proba)

        X_transformed = self.prep.transform(X)
        transformed_cols = self.numeric_cols + [
            c for c in self.feature_cols if c not in self.numeric_cols
        ]
        X_transformed_df = pd.DataFrame(X_transformed, columns=transformed_cols)

        shap_out = self.explainer(X_transformed_df)
        values = shap_out.values[0]
        base_value = float(np.atleast_1d(shap_out.base_values)[0])

        contributions = {
            col: float(val) for col, val in zip(transformed_cols, values)
        }
        return proba, band, contributions, base_value, percentile

    def simulate(self, baseline: dict, modified: dict) -> Dict[str, Any]:
        """
        Calculates counterfactual risk when patient modifies controllable biomarkers
        (e.g., reduces glucose, lowers BMI, controls blood pressure).
        """
        merged_simulated = baseline.copy()
        merged_simulated.update(modified)

        base_proba, base_band, base_shap, _, base_perc = self.predict(baseline)
        sim_proba, sim_band, sim_shap, _, sim_perc = self.predict(merged_simulated)

        abs_diff = round(sim_proba - base_proba, 4)
        pct_change = round(((sim_proba - base_proba) / max(base_proba, 1e-4)) * 100, 1)

        # Factor contributions to reduction
        factor_deltas = {}
        for k in ["glucose", "bmi", "blood_pressure", "insulin"]:
            if k in modified and baseline.get(k) is not None:
                single_var_payload = baseline.copy()
                single_var_payload[k] = modified[k]
                p, _, _, _, _ = self.predict(single_var_payload)
                delta = round(p - base_proba, 4)
                if delta != 0:
                    factor_deltas[k] = delta

        return {
            "baseline_risk": round(base_proba, 4),
            "baseline_band": base_band,
            "baseline_percentile": base_perc,
            "simulated_risk": round(sim_proba, 4),
            "simulated_band": sim_band,
            "simulated_percentile": sim_perc,
            "risk_delta": abs_diff,
            "relative_change_pct": pct_change,
            "key_factor_impacts": factor_deltas,
        }

    def generate_recommendations(self, payload: dict, risk_band: str, shap_contribs: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Generates actionable, prioritized medical and lifestyle interventions
        based on the patient's individual biomarkers and SHAP risk drivers.
        """
        recs = []
        glucose = payload.get("glucose") or 0
        bmi = payload.get("bmi") or 0
        bp = payload.get("blood_pressure") or 0
        age = payload.get("age") or 0
        pedigree = payload.get("diabetes_pedigree") or 0

        # 1. Glucose / Glycemic Control
        if glucose >= 140:
            recs.append({
                "category": "Critical Biomarker",
                "priority": "High",
                "title": "Immediate Glycemic Evaluation",
                "action": "Fasting blood glucose is in the diabetic threshold (>140 mg/dL). Schedule an HbA1c test and immediate physician consultation.",
                "target": "Target fasting glucose < 100 mg/dL",
            })
        elif glucose >= 100:
            recs.append({
                "category": "Glycemic Control",
                "priority": "Moderate",
                "title": "Prediabetes Management & Dietary Modification",
                "action": "Implement a low-glycemic index dietary plan. Limit refined carbohydrates and eliminate sugary drinks.",
                "target": "Target fasting glucose 70-99 mg/dL",
            })

        # 2. Body Composition / BMI
        if bmi >= 30:
            recs.append({
                "category": "Weight & Metabolic",
                "priority": "High",
                "title": "Targeted Weight Loss (5-10% Body Weight)",
                "action": "A 5-7% weight reduction reduces type 2 diabetes progression risk by over 58% (Diabetes Prevention Program). Adopt a 500 kcal/day deficit.",
                "target": f"Initial target BMI < 28 (Current: {bmi})",
            })
        elif bmi >= 25:
            recs.append({
                "category": "Weight & Metabolic",
                "priority": "Moderate",
                "title": "Physical Activity & Caloric Balancing",
                "action": "Engage in 150 minutes of moderate-intensity aerobic exercise (e.g. brisk walking) and 2 resistance sessions weekly.",
                "target": "Healthy BMI Range: 18.5 - 24.9",
            })

        # 3. Blood Pressure
        if bp >= 90:
            recs.append({
                "category": "Cardiovascular",
                "priority": "High",
                "title": "Hypertension Screening & DASH Protocol",
                "action": "Elevated diastolic pressure increases microvascular risk. Adopt the DASH diet, reduce sodium < 2,300 mg/day, and log weekly BP.",
                "target": "Target BP < 120/80 mmHg",
            })
        elif bp >= 80:
            recs.append({
                "category": "Cardiovascular",
                "priority": "Low",
                "title": "Routine Blood Pressure Monitoring",
                "action": "Maintain optimal sodium intake and hydration. Practice stress management techniques.",
                "target": "Target BP < 120/80 mmHg",
            })

        # 4. Genetic & Age factor
        if pedigree > 0.5:
            recs.append({
                "category": "Genetic Screening",
                "priority": "Moderate",
                "title": "Elevated Familial Risk Surveillance",
                "action": "High diabetes pedigree score indicates familial genetic predisposition. Perform comprehensive metabolic panel biannually.",
                "target": "Biannual screening",
            })

        if not recs:
            recs.append({
                "category": "Maintenance",
                "priority": "Low",
                "title": "Maintain Healthy Baseline Habits",
                "action": "Current biomarkers are well managed. Continue balanced Mediterranean-style nutrition, daily physical activity, and annual wellness checks.",
                "target": "Annual follow-up",
            })

        return recs


# Singleton instance
risk_model: Optional[RiskModel] = None


def load_model():
    global risk_model
    risk_model = RiskModel()
    return risk_model


def get_model() -> RiskModel:
    if risk_model is None:
        raise RuntimeError("Model not loaded yet")
    return risk_model
