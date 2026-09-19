"""
Batch prediction endpoint.

Takes a CSV of patient rows and returns a risk assessment for each one --
the "screen 50 patients at once" workflow a real clinic or health camp
would actually want, instead of one form submission at a time.

Deliberately reuses the exact same RiskModel.predict() used by the
single-patient /predict endpoint, so batch and single-row predictions can
never silently drift apart into two different code paths.
"""

import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.batch_schemas import BatchPredictionResponse, BatchRowResult
from app.services.ml_service import get_model

router = APIRouter(tags=["batch"])

REQUIRED_COLUMNS = [
    "pregnancies",
    "glucose",
    "blood_pressure",
    "skin_thickness",
    "insulin",
    "bmi",
    "diabetes_pedigree",
    "age",
]

MAX_ROWS = 500


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a .csv file.")

    raw = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(raw))
    except Exception as exc:
        raise HTTPException(400, f"Couldn't parse CSV: {exc}")

    # Normalise column names: lowercase, spaces/hyphens -> underscores, so
    # "Blood Pressure" or "blood-pressure" both match "blood_pressure".
    df.columns = [
        c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns
    ]

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(
            400,
            "CSV is missing required columns: "
            + ", ".join(missing)
            + ". Expected columns: "
            + ", ".join(REQUIRED_COLUMNS)
            + " (plus an optional 'patient_id' column).",
        )

    if len(df) == 0:
        raise HTTPException(400, "CSV has no data rows.")
    if len(df) > MAX_ROWS:
        raise HTTPException(
            400, f"CSV has {len(df)} rows; batch predictions are capped at {MAX_ROWS}."
        )

    model = get_model()
    results = []
    successful = 0
    failed = 0

    for i, row in df.iterrows():
        patient_id = None
        if "patient_id" in df.columns and pd.notna(row.get("patient_id")):
            patient_id = str(row["patient_id"])

        try:
            payload = {col: float(row[col]) for col in REQUIRED_COLUMNS}
            proba, band, contributions, base_value, percentile = model.predict(payload)

            top_factors = sorted(
                contributions.items(), key=lambda kv: abs(kv[1]), reverse=True
            )[:3]
            top_factor_labels = [f"{k} ({v:+.2f})" for k, v in top_factors]

            results.append(
                BatchRowResult(
                    row=int(i) + 1,
                    patient_id=patient_id,
                    risk_score=round(proba, 4),
                    risk_band=band,
                    percentile=percentile,
                    top_factors=top_factor_labels,
                )
            )
            successful += 1
        except Exception as exc:
            results.append(
                BatchRowResult(row=int(i) + 1, patient_id=patient_id, error=str(exc))
            )
            failed += 1

    return BatchPredictionResponse(
        filename=file.filename,
        total_rows=len(df),
        successful=successful,
        failed=failed,
        model_version=model.version,
        results=results,
    )
