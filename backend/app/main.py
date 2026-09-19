from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.routers import history, predict, batch
from app.services.ml_service import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the model once at startup, not per-request -- SHAP explainer
    # construction is not cheap, and re-loading joblib per request would
    # tank latency under load.
    Base.metadata.create_all(bind=engine)
    load_model()
    yield


app = FastAPI(
    title="Health Risk Prediction API",
    description="Diabetes risk prediction with SHAP-based explainability",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(history.router)
app.include_router(batch.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
