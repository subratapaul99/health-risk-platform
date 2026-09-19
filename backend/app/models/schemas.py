import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class HealthInput(BaseModel):
    user_id: str = Field(..., examples=["user_123"])
    pregnancies: float = Field(..., ge=0, le=20)
    glucose: float = Field(..., ge=0, le=300)
    blood_pressure: float = Field(..., ge=0, le=200)
    skin_thickness: float = Field(..., ge=0, le=100)
    insulin: float = Field(..., ge=0, le=900)
    bmi: float = Field(..., ge=0, le=80)
    diabetes_pedigree: float = Field(..., ge=0, le=3)
    age: float = Field(..., ge=1, le=120)


class ShapContribution(BaseModel):
    feature: str
    value: float


class PredictionResponse(BaseModel):
    submission_id: int
    risk_score: float
    risk_band: str
    model_version: str
    base_value: float
    percentile: float
    shap_contributions: List[ShapContribution]
    created_at: datetime.datetime


class HistoryPoint(BaseModel):
    submission_id: int
    risk_score: float
    risk_band: str
    created_at: datetime.datetime


class HistoryResponse(BaseModel):
    user_id: str
    history: List[HistoryPoint]
