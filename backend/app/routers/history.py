import csv
import io
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import HealthSubmission, Prediction
from app.models.schemas import HistoryPoint, HistoryResponse

router = APIRouter(prefix="", tags=["Patient History & Export"])


@router.get("/history/{user_id}", response_model=HistoryResponse, summary="Get Risk Trajectory History")
def get_history(user_id: str, db: Session = Depends(get_db)):
    rows = (
        db.execute(
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.asc())
        )
        .scalars()
        .all()
    )

    return HistoryResponse(
        user_id=user_id,
        history=[
            HistoryPoint(
                submission_id=r.submission_id,
                risk_score=r.risk_score,
                risk_band=r.risk_band,
                created_at=r.created_at,
            )
            for r in rows
        ],
    )


@router.get("/history/{user_id}/export/csv", summary="Export Clinical History as CSV")
def export_history_csv(user_id: str, db: Session = Depends(get_db)):
    predictions = (
        db.execute(
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
        )
        .scalars()
        .all()
    )

    if not predictions:
        raise HTTPException(status_code=404, detail="No history records found for this user.")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Submission ID",
        "Timestamp",
        "Risk Score (%)",
        "Risk Band",
        "Model Version",
        "Glucose",
        "BMI",
        "Blood Pressure",
        "Insulin",
        "Age",
    ])

    for p in predictions:
        sub = p.submission
        writer.writerow([
            p.submission_id,
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "",
            f"{p.risk_score * 100:.1f}%",
            p.risk_band.capitalize(),
            p.model_version,
            sub.glucose if sub else "",
            sub.bmi if sub else "",
            sub.blood_pressure if sub else "",
            sub.insulin if sub else "",
            sub.age if sub else "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=patient_{user_id}_risk_history.csv"},
    )
