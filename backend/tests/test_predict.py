import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_health_risk.db")

from fastapi.testclient import TestClient

from app.main import app

# Used as a context manager so FastAPI's lifespan startup hook runs (that's
# what loads the model + SHAP explainer) -- without it, `get_model()` raises
# because nothing ever called `load_model()`.
client = TestClient(app)
client.__enter__()

VALID_PAYLOAD = {
    "user_id": "test_user",
    "pregnancies": 2,
    "glucose": 140,
    "blood_pressure": 80,
    "skin_thickness": 25,
    "insulin": 100,
    "bmi": 30.0,
    "diabetes_pedigree": 0.5,
    "age": 40,
}


def test_health_check():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_predict_returns_valid_risk_score():
    resp = client.post("/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()

    assert 0.0 <= body["risk_score"] <= 1.0
    assert body["risk_band"] in {"low", "moderate", "high"}
    assert body["model_version"]
    assert len(body["shap_contributions"]) > 0


def test_predict_rejects_out_of_range_input():
    bad_payload = {**VALID_PAYLOAD, "glucose": 999}
    resp = client.post("/predict", json=bad_payload)
    assert resp.status_code == 422


def test_history_reflects_prior_predictions():
    client.post("/predict", json=VALID_PAYLOAD)
    resp = client.get(f"/history/{VALID_PAYLOAD['user_id']}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == VALID_PAYLOAD["user_id"]
    assert len(body["history"]) >= 1
