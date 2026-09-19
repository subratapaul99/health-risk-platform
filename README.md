# Health risk prediction platform

A diabetes risk prediction system built to demonstrate the full ML product
stack, not just a model: model comparison and calibration, explainable
predictions, a persisted risk-trend history, and a deployable service — not
a notebook with an accuracy score.

Full writeup in [`docs/`](docs): [architecture](docs/ARCHITECTURE.md),
[methodology](docs/METHODOLOGY.md), [experiments & model comparison](docs/EXPERIMENTS.md),
[model card](docs/MODEL_CARD.md).

## What's here

```
ml/          training pipeline: feature engineering, model comparison,
             calibration, MLflow logging, SHAP explainability
backend/     FastAPI service: /predict, /history, SQLAlchemy models
frontend/    React dashboard: assessment form, risk score, SHAP
             breakdown, risk-over-time trend chart
docs/        architecture, methodology, experiments, model card
```

## Headline result

Compared logistic regression, random forest, and XGBoost with stratified
cross-validation, class-imbalance handling, and calibration. **Logistic
regression won** on test AUPRC (0.718) — a real, explainable result, not
the "obviously pick XGBoost" default. See [`docs/EXPERIMENTS.md`](docs/EXPERIMENTS.md)
for the full comparison table and why.

## Running it locally

### Option A — Docker Compose (backend + Postgres + frontend)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend docs: http://localhost:8000/docs

### Option B — run each piece directly

**Retrain the model** (optional — a trained model is already committed
under `ml/models/`):

```bash
cd ml
pip install -r requirements.txt
python train.py
```

**Backend:**

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173, fill in an assessment, and submit — the
dashboard will show the risk score, the SHAP-based explanation for why, and
(after a second submission) a risk-over-time trend chart.

## Running tests

```bash
cd backend
pytest
```

## Notes

- This is a portfolio/demo project. See the limitations and intended-use
  sections in [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md) — the training
  data is small, narrow in population, and not clinically validated.
- Local dev uses SQLite by default; set `DATABASE_URL` to point at Postgres
  (Docker Compose does this automatically).
