# Architecture

## Overview

The system is split into three layers that can be developed, tested, and
deployed independently:

1. **Offline ML pipeline** (`ml/`) — trains, evaluates, and compares models;
   produces a versioned model artifact plus its SHAP explainer background.
2. **Backend API** (`backend/`) — a FastAPI service that loads the trained
   artifact once at startup, serves predictions with per-request SHAP
   explanations, and persists every submission and prediction to Postgres.
3. **Frontend dashboard** (`frontend/`) — a React app for submitting an
   assessment and viewing the risk score, its explanation, and the trend
   across past assessments.

This separation is the main architectural decision worth defending in an
interview: the ML pipeline never touches a live request, and the API never
touches training data. The only contract between them is a model artifact
plus a metadata file describing its feature schema and version.

```
React dashboard
      |
      v
FastAPI gateway  --------->  Inference service (model + SHAP explainer)
      |                              |
      v                              v
PostgreSQL <----------------  Model registry (MLflow)
      ^
      |
Offline training pipeline (data ingest -> feature engineering ->
train/compare models -> log to MLflow -> promote best model)
```

## Why these specific choices

**FastAPI over Flask.** Native async support, automatic OpenAPI docs at
`/docs`, and Pydantic request validation for free — the `HealthInput` schema
in `backend/app/models/schemas.py` rejects out-of-range vitals before they
ever reach the model.

**SQLAlchemy over a raw driver.** The entire codebase is unaware of which
database it's talking to. Local dev uses SQLite (zero setup); Docker Compose
and any real deployment use Postgres — swapped with a single `DATABASE_URL`
environment variable, no code changes.

**Two tables, not one.** `health_submissions` stores the raw inputs exactly
as submitted; `predictions` stores the model's output, tagged with the
model version that produced it. Splitting these means a model upgrade never
invalidates historical predictions — old rows still point at the version
that actually generated them — and it's what makes the risk-trend chart
possible without any extra bookkeeping.

**Model loaded once, not per-request.** Constructing a SHAP explainer isn't
free. `app/main.py` loads the model and builds the explainer during FastAPI's
`lifespan` startup hook, so it happens once per process rather than once
per request.

**Inference logic isolated in one module.** `ml_service.py` is the only file
that imports scikit-learn/XGBoost/SHAP directly. Routers call `model.predict()`
and get back plain numbers. This means the model can be swapped for a
completely different algorithm, or moved to a remote model server, without
touching the API or database layers.

## Deployment topology

- `docker-compose.yml` runs three services: Postgres, the FastAPI backend
  (built from the repo root so it can bundle the trained model artifact),
  and the frontend (built as a static bundle served by nginx).
- In a cloud deployment, the same three containers map onto: a managed
  Postgres instance (RDS / Cloud SQL), a container service running the
  backend image (ECS / Cloud Run / Render), and a static host or CDN for
  the frontend build.
- The model artifact is baked into the backend image in this project for
  simplicity. The natural next step is pulling it from the MLflow model
  registry by stage ("Production") at container startup, so a model
  rollout doesn't require rebuilding or redeploying the API image.
