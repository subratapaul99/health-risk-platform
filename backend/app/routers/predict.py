from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HealthSubmission, Prediction
from app.models.schemas import HealthInput, PredictionResponse, ShapContribution
from app.services.ml_service import get_model

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: HealthInput, db: Session = Depends(get_db)):
    model = get_model()

    submission = HealthSubmission(
        user_id=payload.user_id,
        pregnancies=payload.pregnancies,
        glucose=payload.glucose,
        blood_pressure=payload.blood_pressure,
        skin_thickness=payload.skin_thickness,
        insulin=payload.insulin,
        bmi=payload.bmi,
        diabetes_pedigree=payload.diabetes_pedigree,
        age=payload.age,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    proba, band, contributions, base_value, percentile = model.predict(payload.model_dump())

    prediction = Prediction(
        submission_id=submission.id,
        user_id=payload.user_id,
        risk_score=proba,
        risk_band=band,
        model_version=model.version,
        shap_values=contributions,
        base_value=base_value,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # Sort contributions by absolute impact, most influential first
    sorted_contribs = sorted(
        contributions.items(), key=lambda kv: abs(kv[1]), reverse=True
    )

    return PredictionResponse(
        submission_id=submission.id,
        risk_score=proba,
        risk_band=band,
        model_version=model.version,
        base_value=base_value,
        percentile=percentile,
        shap_contributions=[
            ShapContribution(feature=f, value=v) for f, v in sorted_contribs
        ],
        created_at=prediction.created_at,
    )
