from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Prediction
from app.models.schemas import HistoryPoint, HistoryResponse

router = APIRouter(tags=["history"])


@router.get("/history/{user_id}", response_model=HistoryResponse)
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
