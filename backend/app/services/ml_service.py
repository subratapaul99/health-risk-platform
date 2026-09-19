"""
Inference service.

This is intentionally the ONLY place in the backend that knows about
scikit-learn / SHAP internals. The API routers just call `predict_risk`
and get back plain numbers -- so swapping the model (new version, a
completely different algorithm, a remote MLflow model server) never
touches the routing or DB layer.

In production this would pull the model from the MLflow model registry
by stage ("Production") instead of reading a local joblib file, and
would be a thing you restart independently of the API pods so a model
rollout doesn't need an API redeploy. That's the line I'd draw in an
interview between "student project" and "production ML service".
"""

import json
import os
from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
import shap

# ml/ and backend/ are siblings in this repo when run locally; MODEL_DIR
# can be overridden (e.g. in Docker, where artifacts are copied to a fixed
# path). In a real deployment this would instead fetch from the MLflow
# model registry / S3 rather than reading a baked-in local path.
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
        self.version = self.metadata["version"]
        self.score_distribution = self.metadata.get("score_distribution", [])

    def _build_feature_row(self, payload: dict) -> pd.DataFrame:
        """
        Re-derive the exact same engineered features used at training time,
        for a single raw input row. This mirrors ml/features.py -- kept as a
        separate, deliberately simple implementation here so the backend can
        be deployed without a dependency on the training codebase.
        """
        row = {
            "pregnancies": payload["pregnancies"],
            "glucose": payload["glucose"] or np.nan,
            "blood_pressure": payload["blood_pressure"] or np.nan,
            "skin_thickness": payload["skin_thickness"] or np.nan,
            "insulin": payload["insulin"] or np.nan,
            "bmi": payload["bmi"] or np.nan,
            "diabetes_pedigree": payload["diabetes_pedigree"],
            "age": payload["age"],
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

        # Align to the exact training-time column set / order, filling any
        # dummy column that didn't appear for this single row with 0.
        for col in self.feature_cols:
            if col not in df.columns:
                df[col] = 0
        df = df[self.feature_cols]
        return df

    def _percentile(self, score: float) -> float:
        """
        Where this score falls relative to the model's own test-set score
        distribution, as a 0-100 percentile. Computed against a fixed,
        pre-recorded reference distribution rather than any live user data,
        so it's stable and doesn't leak information between users.
        """
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


# Singleton, loaded once when the app starts (see app/main.py lifespan)
risk_model: RiskModel | None = None


def load_model():
    global risk_model
    risk_model = RiskModel()
    return risk_model


def get_model() -> RiskModel:
    if risk_model is None:
        raise RuntimeError("Model not loaded yet")
    return risk_model
