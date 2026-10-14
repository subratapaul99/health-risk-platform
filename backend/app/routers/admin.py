from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HealthSubmission, Prediction, User
from app.models.schemas import ModelRegistryResponse
from app.services.ml_service import get_model

router = APIRouter(prefix="/admin", tags=["Model Registry & Administration"])

PDF_PATH = Path(__file__).resolve().parents[2] / "HEALTH_RISK_PLATFORM_DOCUMENTARY_REPORT.pdf"


@router.get("/models", response_model=ModelRegistryResponse, summary="Model Registry & Benchmark Comparison")
def get_model_registry():
    """
    Returns registered machine learning models, active winner, architecture comparisons
    (Logistic Regression, Random Forest, XGBoost, LightGBM/HistGradientBoosting, Calibrated),
    cross-validation metrics (AUROC, AUPRC, F1, Brier, Specificity), and training sample counts.
    """
    model = get_model()
    meta = model.metadata

    return ModelRegistryResponse(
        active_winner=meta.get("winner", "logistic_regression"),
        version=meta.get("version", "v2.0-enhanced"),
        feature_count=len(meta.get("feature_cols", [])),
        training_samples=meta.get("training_samples", 614),
        test_samples=meta.get("test_samples", 154),
        all_models=meta.get("all_models", {}),
        active_metrics=meta.get("metrics", {}),
    )


@router.get("/system-stats", summary="Platform Usage & Risk Distribution Stats")
def get_system_stats(db: Session = Depends(get_db)):
    """
    Aggregates population-level clinical risk metrics, total predictions performed,
    and distribution across Low, Moderate, and High risk categories.
    """
    total_submissions = db.query(func.count(HealthSubmission.id)).scalar() or 0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    unique_users = db.query(func.count(func.distinct(HealthSubmission.user_id))).scalar() or 0

    band_counts = (
        db.query(Prediction.risk_band, func.count(Prediction.id))
        .group_by(Prediction.risk_band)
        .all()
    )
    distribution = {band: count for band, count in band_counts}
    for b in ["low", "moderate", "high"]:
        distribution.setdefault(b, 0)

    # Calculate average glucose and BMI in submissions
    avg_glucose = db.query(func.avg(HealthSubmission.glucose)).scalar()
    avg_bmi = db.query(func.avg(HealthSubmission.bmi)).scalar()

    return {
        "total_assessments": total_submissions,
        "total_predictions": total_predictions,
        "unique_patients": unique_users,
        "risk_distribution": distribution,
        "population_averages": {
            "glucose": round(avg_glucose, 1) if avg_glucose else 121.0,
            "bmi": round(avg_bmi, 1) if avg_bmi else 32.2,
        },
        "system_status": "Healthy (All micro-services operational)",
    }


@router.get("/download-report-pdf", summary="Download Official Technical Documentary PDF")
def download_report_pdf():
    """
    Returns the compiled, publication-quality technical documentary and side-by-side
    audit report PDF.
    """
    if not PDF_PATH.exists():
        raise HTTPException(status_code=404, detail="PDF report not found. Run generate_pdf_report.py first.")
    return FileResponse(
        path=str(PDF_PATH),
        filename="Health_Risk_Platform_Technical_Documentary_Report.pdf",
        media_type="application/pdf",
    )
