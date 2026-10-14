from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class BatchRowResult(BaseModel):
    row: int
    patient_id: Optional[str] = None
    risk_score: Optional[float] = None
    risk_band: Optional[str] = None
    percentile: Optional[float] = None
    top_factors: List[str] = []
    error: Optional[str] = None


class BatchPredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    filename: str
    total_rows: int
    successful: int
    failed: int
    model_version: str
    results: List[BatchRowResult]
