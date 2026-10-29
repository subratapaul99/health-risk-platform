from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HealthSubmission, Prediction
from app.models.schemas import (
    ClinicalRecommendation,
    HealthInput,
    PredictionResponse,
    ShapContribution,
    SimulationInput,
    SimulationResponse,
)
from app.services.ml_service import get_model
from app.services.biomarkers import calculate_clinical_biomarkers

router = APIRouter(prefix="", tags=["Prediction & Clinical Intelligence"])


@router.post("/predict", response_model=PredictionResponse, summary="Predict Diabetes Risk & Drivers")
def predict(payload: HealthInput, db: Session = Depends(get_db)):
    """
    Evaluates patient metabolic parameters, returns calibrated diabetes probability,
    risk categorization (low/moderate/high), population percentile, local SHAP feature
    attributions, and customized clinical recommendations.
    """
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

    # Generate clinical recommendations
    raw_recs = model.generate_recommendations(payload.model_dump(), band, contributions)
    recs = [ClinicalRecommendation(**r) for r in raw_recs]

    biomarkers = calculate_clinical_biomarkers(payload.model_dump())

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
        recommendations=recs,
        homa_ir=biomarkers['homa_ir'],
        homa_ir_status=biomarkers['homa_ir_status'],
        map_pressure=biomarkers['map_pressure'],
        ascvd_10yr_risk=biomarkers['ascvd_10yr_risk'],
        ascvd_band=biomarkers['ascvd_band'],
        created_at=prediction.created_at,
    )


@router.post("/predict/simulate", response_model=SimulationResponse, summary="Counterfactual What-If Risk Simulation")
def simulate(payload: SimulationInput):
    """
    Runs counterfactual risk modeling. Compares baseline risk against modified lifestyle
    or clinical targets (e.g., target glucose 95 mg/dL, target BMI 24.5 kg/m^2) to compute
    achievable risk reduction and identify the highest-leverage interventions.
    """
    model = get_model()
    baseline_dict = payload.baseline.model_dump()

    modifications = {}
    if payload.modified_glucose is not None:
        modifications["glucose"] = payload.modified_glucose
    if payload.modified_bmi is not None:
        modifications["bmi"] = payload.modified_bmi
    if payload.modified_blood_pressure is not None:
        modifications["blood_pressure"] = payload.modified_blood_pressure
    if payload.modified_insulin is not None:
        modifications["insulin"] = payload.modified_insulin

    sim_res = model.simulate(baseline_dict, modifications)
    sim_res["interventions_applied"] = modifications

    return SimulationResponse(**sim_res)


@router.post("/predict/recommendations", response_model=List[ClinicalRecommendation], summary="Generate Clinical Guidance")
def get_recommendations(payload: HealthInput):
    """
    Produces actionable clinical and lifestyle interventions according to ADA guidelines.
    """
    model = get_model()
    proba, band, contributions, _, _ = model.predict(payload.model_dump())
    raw_recs = model.generate_recommendations(payload.model_dump(), band, contributions)
    return [ClinicalRecommendation(**r) for r in raw_recs]
