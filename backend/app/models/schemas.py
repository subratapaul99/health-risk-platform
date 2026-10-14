import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Authentication Schemas ---
class AuthRegisterInput(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, examples=["dr_smith"])
    email: str = Field(..., examples=["dr_smith@hospital.org"])
    password: str = Field(..., min_length=6, examples=["securePass123"])
    full_name: Optional[str] = Field(None, examples=["Dr. Jane Smith"])


class AuthLoginInput(BaseModel):
    username: str = Field(..., examples=["dr_smith"])
    password: str = Field(..., examples=["securePass123"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    full_name: Optional[str]
    is_admin: bool


class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_admin: bool
    created_at: datetime.datetime


# --- Clinical Prediction & Simulation Schemas ---
class HealthInput(BaseModel):
    user_id: str = Field(..., examples=["user_123"])
    pregnancies: float = Field(0.0, ge=0, le=20)
    glucose: float = Field(..., ge=0, le=300)
    blood_pressure: float = Field(..., ge=0, le=200)
    skin_thickness: float = Field(0.0, ge=0, le=100)
    insulin: float = Field(0.0, ge=0, le=900)
    bmi: float = Field(..., ge=0, le=80)
    diabetes_pedigree: float = Field(0.35, ge=0, le=3)
    age: float = Field(..., ge=1, le=120)


class ShapContribution(BaseModel):
    feature: str
    value: float


class ClinicalRecommendation(BaseModel):
    category: str
    priority: str  # High, Moderate, Low
    title: str
    action: str
    target: str


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    submission_id: int
    risk_score: float
    risk_band: str
    model_version: str
    base_value: float
    percentile: float
    shap_contributions: List[ShapContribution]
    recommendations: List[ClinicalRecommendation] = []
    created_at: datetime.datetime


class SimulationInput(BaseModel):
    baseline: HealthInput
    modified_glucose: Optional[float] = Field(None, ge=50, le=300)
    modified_bmi: Optional[float] = Field(None, ge=15, le=60)
    modified_blood_pressure: Optional[float] = Field(None, ge=50, le=200)
    modified_insulin: Optional[float] = Field(None, ge=0, le=600)


class SimulationResponse(BaseModel):
    baseline_risk: float
    baseline_band: str
    baseline_percentile: float
    simulated_risk: float
    simulated_band: str
    simulated_percentile: float
    risk_delta: float
    relative_change_pct: float
    key_factor_impacts: Dict[str, float]
    interventions_applied: Dict[str, float]


class HistoryPoint(BaseModel):
    submission_id: int
    risk_score: float
    risk_band: str
    created_at: datetime.datetime


class HistoryResponse(BaseModel):
    user_id: str
    history: List[HistoryPoint]


# --- Admin & Model Registry Schemas ---
class ModelMetrics(BaseModel):
    test_auroc: float
    test_auprc: float
    test_f1: float
    test_brier: float
    test_accuracy: float
    test_precision: float
    test_recall: float
    test_specificity: float


class ModelRegistryResponse(BaseModel):
    active_winner: str
    version: str
    feature_count: int
    training_samples: int
    test_samples: int
    all_models: Dict[str, Dict[str, Any]]
    active_metrics: Dict[str, Any]
