"""
Training pipeline for the diabetes risk model.

What this script actually does, end to end:
1. Load + engineer features (see features.py)
2. Split train/test with stratification (outcome is imbalanced ~65/35)
3. Build a preprocessing pipeline (median imputation + scaling) fit ONLY
   on train, to avoid leakage into the test set
4. Train four candidate models:
     - Logistic Regression (interpretable baseline)
     - Random Forest
     - XGBoost
     - Calibrated XGBoost (isotonic calibration on top of the best raw model)
5. Evaluate all four with 5-fold stratified CV on train, AND a held-out
   test set, reporting AUROC, AUPRC, F1, Brier score
6. Log every run (params + metrics + model artifact) to MLflow
7. Pick the winner by AUPRC (imbalanced classification -> PR curve matters
   more than ROC), generate a comparison table + calibration plot
8. Fit a SHAP explainer on the winning model and save:
     - a global summary (beeswarm) plot
     - a background dataset + explainer object the backend can reuse to
       generate a per-prediction waterfall plot at inference time
"""

import json
import warnings
from pathlib import Path

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
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from features import build_feature_frame

warnings.filterwarnings("ignore")

ROOT = Path(__file__).parent
DATA_PATH = ROOT / "data" / "diabetes_raw.csv"
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
    metrics = {
        "test_auroc": roc_auc_score(y_test, proba),
        "test_auprc": average_precision_score(y_test, proba),
        "test_f1": f1_score(y_test, pred),
        "test_brier": brier_score_loss(y_test, proba),
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
            scale_pos_weight=(y_train == 0).sum() / (y_train == 1).sum(),
            eval_metric="logloss",
            random_state=RANDOM_STATE,
        ),
    }

    mlflow.set_tracking_uri("sqlite:///" + str(ROOT / "mlflow.db"))
    mlflow.set_experiment("diabetes-risk-prediction")

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
            print(f"{name}: {metrics}")

    # Calibrated version of the best raw model (XGBoost), isotonic on CV folds
    best_raw_name = max(results, key=lambda k: results[k]["test_auprc"])
    best_raw_pipe = fitted_pipelines[best_raw_name]

    with mlflow.start_run(run_name=f"{best_raw_name}_calibrated"):
        calibrated = CalibratedClassifierCV(
            fitted_pipelines[best_raw_name].named_steps["clf"].__class__(
                **fitted_pipelines[best_raw_name].named_steps["clf"].get_params()
            ),
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
        print(f"{best_raw_name}_calibrated: {cal_metrics}")

    # ---- Pick final winner by test AUPRC, save comparison table ----
    comparison_df = pd.DataFrame(results).T
    comparison_df.index.name = "model"
    comparison_df.to_csv(REPORTS_DIR / "model_comparison.csv")
    print("\n=== Model comparison ===")
    print(comparison_df.round(4))

    winner_name = max(results, key=lambda k: results[k]["test_auprc"])
    winner_pipe = fitted_pipelines[winner_name]
    print(f"\nWinner: {winner_name}")

    joblib.dump(winner_pipe, MODELS_DIR / "diabetes_risk_model.joblib")

    # Save the winning model's full test-set score distribution so the
    # backend can compute a population percentile for any new prediction
    # ("higher than X% of assessed profiles") without needing live access
    # to the training data at inference time.
    winner_test_scores = sorted(winner_pipe.predict_proba(X_test)[:, 1].tolist())

    with open(MODELS_DIR / "model_metadata.json", "w") as f:
        json.dump(
            {
                "winner": winner_name,
                "feature_cols": feature_cols,
                "numeric_cols": numeric_cols,
                "metrics": results[winner_name],
                "version": "v1",
                "score_distribution": winner_test_scores,
            },
            f,
            indent=2,
        )

    # ---- Calibration plot for all models ----
    plt.figure(figsize=(6, 6))
    for name, pipe in fitted_pipelines.items():
        proba = pipe.predict_proba(X_test)[:, 1]
        frac_pos, mean_pred = calibration_curve(y_test, proba, n_bins=10)
        plt.plot(mean_pred, frac_pos, marker="o", label=name, linewidth=1)
    plt.plot([0, 1], [0, 1], linestyle="--", color="gray", label="perfectly calibrated")
    plt.xlabel("Mean predicted probability")
    plt.ylabel("Fraction of positives")
    plt.title("Calibration curves")
    plt.legend(fontsize=8)
    plt.tight_layout()
    plt.savefig(REPORTS_DIR / "calibration_curves.png", dpi=150)
    plt.close()

    # ---- SHAP explainability on the winning model ----
    # Transform test data through the preprocessor so SHAP sees model-space features
    prep = winner_pipe.named_steps["prep"]
    clf = winner_pipe.named_steps["clf"]

    X_test_transformed = prep.transform(X_test)
    transformed_cols = numeric_cols + [c for c in X_test.columns if c not in numeric_cols]

    X_test_df = pd.DataFrame(X_test_transformed, columns=transformed_cols)

    # Unwrap calibrated classifier to the underlying tree/linear model if needed
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

    # Save explainer + background sample for the backend to reuse at inference time
    joblib.dump(
        {
            "explainer_type": "tree" if isinstance(explainer, shap.TreeExplainer) else "generic",
            "background": X_test_df.iloc[:100],
        },
        MODELS_DIR / "shap_background.joblib",
    )

    print("\nSaved model, metadata, comparison table, calibration plot, SHAP summary.")


if __name__ == "__main__":
    main()
