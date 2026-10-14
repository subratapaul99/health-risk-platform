from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, SessionLocal, engine
from app.routers import admin, auth, batch, history, predict
from app.services.auth_service import init_default_users
from app.services.ml_service import load_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Seed default user and admin credentials
    db = SessionLocal()
    try:
        init_default_users(db)
    finally:
        db.close()
        
    # Load ML pipeline and SHAP background once at startup
    load_model()
    yield


app = FastAPI(
    title="Health Risk Intelligence Platform API",
    description="""
### Clinical-grade Diabetes Risk Prediction, Counterfactual Simulation & Explainability Platform

This production service provides:
* **Predictive Risk Assessment (`/predict`)**: Calibrated probability, population percentile, and SHAP local feature attributions.
* **Counterfactual What-If Simulation (`/predict/simulate`)**: Live biomarker modification to evaluate achievable risk reduction.
* **Clinical Guidelines (`/predict/recommendations`)**: Evidence-based nutrition and lifestyle guidance tailored to patient risk drivers.
* **User Authentication (`/auth/login`, `/auth/register`)**: JWT-based authentication with role-based access control.
* **Risk Trajectory & Export (`/history/{user_id}`, `/history/{user_id}/export/csv`)**: Longitudinal tracking and CSV downloads.
* **Model Registry & Admin Analytics (`/admin/models`, `/admin/system-stats`)**: Multi-model comparison benchmarks (Logistic Regression, Random Forest, XGBoost, LightGBM/HistGradientBoosting, Calibrated).
    """,
    version="2.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Prediction & Clinical Intelligence", "description": "Risk inference, counterfactual simulation, and ADA guidance"},
        {"name": "User Authentication & Security", "description": "JWT authentication, login, registration, and user profiles"},
        {"name": "Patient History & Export", "description": "Longitudinal risk trajectory tracking and CSV exports"},
        {"name": "Batch Screening", "description": "High-throughput batch risk assessment for population health"},
        {"name": "Model Registry & Administration", "description": "Model comparison benchmarks, metrics, and system analytics"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Routers mounted at root
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(batch.router)
app.include_router(auth.router)
app.include_router(admin.router)

# Mount versioned API prefix (/api/v1) for modern production API design
app.include_router(predict.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")
app.include_router(batch.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "ok",
        "service": "Health Risk Intelligence Platform",
        "version": "2.0.0",
        "active_model": "Calibrated Machine Learning Pipeline (v2.0-enhanced)",
    }
