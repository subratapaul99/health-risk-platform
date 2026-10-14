import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_health_risk.db")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
client.__enter__()

VALID_PAYLOAD = {
    "user_id": "test_user_42",
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
    assert resp.json()["status"] == "ok"


def test_predict_returns_valid_risk_score_and_recommendations():
    resp = client.post("/predict", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    body = resp.json()

    assert 0.0 <= body["risk_score"] <= 1.0
    assert body["risk_band"] in {"low", "moderate", "high"}
    assert body["model_version"]
    assert len(body["shap_contributions"]) > 0
    assert "recommendations" in body
    assert len(body["recommendations"]) > 0


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


def test_what_if_simulation():
    sim_payload = {
        "baseline": VALID_PAYLOAD,
        "modified_glucose": 95,
        "modified_bmi": 23.5,
    }
    resp = client.post("/predict/simulate", json=sim_payload)
    assert resp.status_code == 200
    body = resp.json()

    assert "baseline_risk" in body
    assert "simulated_risk" in body
    assert body["simulated_risk"] <= body["baseline_risk"]
    assert "risk_delta" in body
    assert "relative_change_pct" in body


def test_clinical_recommendations_endpoint():
    resp = client.post("/predict/recommendations", json=VALID_PAYLOAD)
    assert resp.status_code == 200
    recs = resp.json()
    assert isinstance(recs, list)
    assert len(recs) > 0
    assert "category" in recs[0]
    assert "action" in recs[0]


def test_auth_registration_and_login():
    reg_data = {
        "username": "clinician_tester",
        "email": "clinician@hospital.org",
        "password": "StrongPassword99",
        "full_name": "Dr. Tester",
    }
    # Register or login if exists
    resp = client.post("/auth/register", json=reg_data)
    if resp.status_code == 400:
        resp = client.post(
            "/auth/login",
            json={"username": reg_data["username"], "password": reg_data["password"]},
        )

    assert resp.status_code == 200
    token_body = resp.json()
    assert "access_token" in token_body
    assert token_body["username"] == "clinician_tester"

    # Test me endpoint with bearer
    token = token_body["access_token"]
    me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "clinician_tester"


def test_admin_model_registry_and_stats():
    resp = client.get("/admin/models")
    assert resp.status_code == 200
    data = resp.json()
    assert "active_winner" in data
    assert "all_models" in data
    assert len(data["all_models"]) >= 4

    stats_resp = client.get("/admin/system-stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert "total_predictions" in stats
    assert "risk_distribution" in stats


def test_history_csv_export():
    client.post("/predict", json=VALID_PAYLOAD)
    resp = client.get(f"/history/{VALID_PAYLOAD['user_id']}/export/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Risk Score" in resp.text
