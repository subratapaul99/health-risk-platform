"""
Enhanced Training pipeline for the diabetes risk platform.

Models compared:
- Logistic Regression (Interpretable clinical baseline)
- Random Forest (Ensemble bagging)
- XGBoost (Extreme gradient boosted trees)
- HistGradientBoosting (LightGBM histogram-binning architecture)
- Calibrated Winner (Isotonic probability calibration)

Evaluation Metrics:
- AUROC, AUPRC, F1-Score, Brier Loss, Accuracy, Precision, Recall, Specificity.
- Stratified 5-Fold Cross Validation.
- SHAP Tree / Kernel explainability & background reference distribution.
"""

import json
import os
import warnings
from pathlib import Path

# Silence joblib physical core lookup on Windows
os.environ["LOKY_MAX_CPU_COUNT"] = "4"

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
import shap
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from features import build_feature_frame

warnings.filterwarnings("ignore")

ROOT = Path(__file__).parent
MULTICENTER_DATA_PATH = ROOT / "data" / "diabetes_multicenter_cohort.csv"
DATA_PATH = MULTICENTER_DATA_PATH if MULTICENTER_DATA_PATH.exists() else ROOT / "data" / "diabetes_raw.csv"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
MODELS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

RANDOM_STATE = 42
TARGET = "outcome"


def get_preprocessor(numeric_cols):
    """Median-impute + scale numeric columns. Dummy columns pass through."""
    return ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline(
                    steps=[
                        ("impute", SimpleImputer(strategy="median")),
                        ("scale", StandardScaler()),
                    ]
                ),
                numeric_cols,
            )
        ],
        remainder="passthrough",
    )


def evaluate(model, X_test, y_test, cv_results=None):
    proba = model.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    
    # Calculate confusion matrix for clinical specificity
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0

    metrics = {
        "test_auroc": float(roc_auc_score(y_test, proba)),
        "test_auprc": float(average_precision_score(y_test, proba)),
        "test_f1": float(f1_score(y_test, pred)),
        "test_brier": float(brier_score_loss(y_test, proba)),
        "test_accuracy": float(accuracy_score(y_test, pred)),
        "test_precision": float(precision_score(y_test, pred, zero_division=0)),
        "test_recall": float(recall_score(y_test, pred, zero_division=0)),
        "test_specificity": specificity,
    }
    if cv_results is not None:
        metrics["cv_auroc_mean"] = float(np.mean(cv_results["test_auroc"]))
        metrics["cv_auroc_std"] = float(np.std(cv_results["test_auroc"]))
        metrics["cv_auprc_mean"] = float(np.mean(cv_results["test_auprc"]))
        metrics["cv_auprc_std"] = float(np.std(cv_results["test_auprc"]))
    return metrics, proba


def main():
    df = build_feature_frame(str(DATA_PATH))
    feature_cols = [c for c in df.columns if c != TARGET]
    numeric_cols = [
        "pregnancies",
        "glucose",
        "blood_pressure",
        "skin_thickness",
        "insulin",
        "bmi",
        "diabetes_pedigree",
        "age",
        "glucose_bmi_interaction",
    ]

    X = df[feature_cols]
    y = df[TARGET].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    print(f"Train: {X_train.shape}, Test: {X_test.shape}")
    print(f"Train outcome balance: {y_train.mean():.3f} positive")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    scoring = {"auroc": "roc_auc", "auprc": "average_precision"}

    scale_pos = float((y_train == 0).sum() / (y_train == 1).sum())

    candidates = {
        "logistic_regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=RANDOM_STATE
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            max_depth=6,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "xgboost": XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
        ),
        "lightgbm_hist_gradient_boosting": HistGradientBoostingClassifier(
            max_iter=200,
            max_depth=4,
            learning_rate=0.05,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
    }

    mlflow.set_tracking_uri("sqlite:///" + str(ROOT / "mlflow.db"))
    mlflow.set_experiment("diabetes-risk-prediction-enhanced")

    results = {}
    fitted_pipelines = {}

    for name, clf in candidates.items():
        preprocessor = get_preprocessor(numeric_cols)
        pipe = Pipeline(steps=[("prep", preprocessor), ("clf", clf)])

        with mlflow.start_run(run_name=name):
            cv_results = cross_validate(
                pipe,
                X_train,
                y_train,
                cv=cv,
                scoring=scoring,
                return_train_score=False,
            )
            cv_results = {"test_auroc": cv_results["test_auroc"], "test_auprc": cv_results["test_auprc"]}

            pipe.fit(X_train, y_train)
            metrics, proba = evaluate(pipe, X_test, y_test, cv_results)

            mlflow.log_params({"model": name})
            mlflow.log_metrics(metrics)
            mlflow.sklearn.log_model(
                pipe, artifact_path="model", serialization_format="cloudpickle"
            )

            results[name] = metrics
            fitted_pipelines[name] = pipe
            print(f"[{name}] AUPRC: {metrics['test_auprc']:.4f} | AUROC: {metrics['test_auroc']:.4f} | Brier: {metrics['test_brier']:.4f}")

    # Calibrated version of the best raw model
    best_raw_name = max(results, key=lambda k: results[k]["test_auprc"])
    best_clf = fitted_pipelines[best_raw_name].named_steps["clf"]

    with mlflow.start_run(run_name=f"{best_raw_name}_calibrated"):
        calibrated = CalibratedClassifierCV(
            best_clf.__class__(**best_clf.get_params()),
            method="isotonic",
            cv=5,
        )
        preprocessor = get_preprocessor(numeric_cols)
        calibrated_pipe = Pipeline(steps=[("prep", preprocessor), ("clf", calibrated)])
        calibrated_pipe.fit(X_train, y_train)
        cal_metrics, cal_proba = evaluate(calibrated_pipe, X_test, y_test)
        mlflow.log_params({"model": f"{best_raw_name}_calibrated"})
        mlflow.log_metrics(cal_metrics)
        mlflow.sklearn.log_model(
            calibrated_pipe, artifact_path="model", serialization_format="cloudpickle"
        )

        results[f"{best_raw_name}_calibrated"] = cal_metrics
        fitted_pipelines[f"{best_raw_name}_calibrated"] = calibrated_pipe
        print(f"[{best_raw_name}_calibrated] AUPRC: {cal_metrics['test_auprc']:.4f} | Brier: {cal_metrics['test_brier']:.4f}")

    # ---- Pick final winner by test AUPRC, save comparison table ----
    comparison_df = pd.DataFrame(results).T
    comparison_df.index.name = "model"
    comparison_df.to_csv(REPORTS_DIR / "model_comparison.csv")
    print("\n=== Model Comparison Summary ===")
    print(comparison_df.round(4))

    winner_name = max(results, key=lambda k: results[k]["test_auprc"])
    winner_pipe = fitted_pipelines[winner_name]
    print(f"\nFinal Selected Winner: {winner_name}")

    joblib.dump(winner_pipe, MODELS_DIR / "diabetes_risk_model.joblib")

    # Winner test score distribution for percentile reference
    winner_test_scores = sorted(winner_pipe.predict_proba(X_test)[:, 1].tolist())

    # Full benchmark data for the UI Admin & Documentary dashboards
    model_benchmarks = {}
    for mod_name, met in results.items():
        model_benchmarks[mod_name] = {k: round(v, 4) for k, v in met.items()}

    with open(MODELS_DIR / "model_metadata.json", "w") as f:
        json.dump(
            {
                "winner": winner_name,
                "feature_cols": feature_cols,
                "numeric_cols": numeric_cols,
                "metrics": results[winner_name],
                "all_models": model_benchmarks,
                "version": "v3.0-multicenter-cohort",
                "dataset_name": "Multi-Center Harmonized Clinical Cohort (Pima + Frankfurt + NHANES)",
                "total_cohort_records": len(df),
                "cohort_breakdown": {
                    "pima_native_american": 768,
                    "frankfurt_hospital_european": 2000,
                    "nhanes_epidemiological_screening": 5000,
                    "total": len(df),
                },
                "training_samples": len(X_train),
                "test_samples": len(X_test),
                "score_distribution": winner_test_scores,
            },
            f,
            indent=2,
        )

    # ---- Calibration plot for all models ----
    plt.figure(figsize=(7, 6))
    for name, pipe in fitted_pipelines.items():
        proba = pipe.predict_proba(X_test)[:, 1]
        frac_pos, mean_pred = calibration_curve(y_test, proba, n_bins=10)
        plt.plot(mean_pred, frac_pos, marker="o", label=name, linewidth=1.5)
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Perfect Calibration")
    plt.xlabel("Mean Predicted Probability")
    plt.ylabel("Fraction of Positives")
    plt.title("Reliability Calibration Curves (All Models)")
    plt.legend(fontsize=8)
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(REPORTS_DIR / "calibration_curves.png", dpi=150)
    plt.close()

    # ---- SHAP explainability on the winning model ----
    prep = winner_pipe.named_steps["prep"]
    clf = winner_pipe.named_steps["clf"]

    X_test_transformed = prep.transform(X_test)
    transformed_cols = numeric_cols + [c for c in X_test.columns if c not in numeric_cols]
    X_test_df = pd.DataFrame(X_test_transformed, columns=transformed_cols)

    underlying = clf
    if hasattr(clf, "calibrated_classifiers_"):
        underlying = clf.calibrated_classifiers_[0].estimator

    try:
        explainer = shap.TreeExplainer(underlying)
        shap_values = explainer.shap_values(X_test_df)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
    except Exception:
        explainer = shap.Explainer(underlying, X_test_df)
        shap_values = explainer(X_test_df).values

    plt.figure()
    shap.summary_plot(shap_values, X_test_df, show=False)
    plt.tight_layout()
    plt.savefig(REPORTS_DIR / "shap_summary.png", dpi=150)
    plt.close()

    # Save explainer background sample
    joblib.dump(
        {
            "explainer_type": "tree" if isinstance(explainer, shap.TreeExplainer) else "generic",
            "background": X_test_df.iloc[:100],
        },
        MODELS_DIR / "shap_background.joblib",
    )

    print("\n[OK] Model trained successfully! Saved model, metadata, benchmark table, calibration curve & SHAP artifacts.")


if __name__ == "__main__":
    main()
