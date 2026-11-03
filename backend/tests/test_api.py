import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.entities import Incident

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_auth_login_default_operator():
    response = client.post("/api/auth/login", json={
        "email": "operator@railresq.gov.in",
        "password": "operator123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "operator"


def test_incident_submission_and_triage():
    # Submit emergency report
    payload = {
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "coach_number": "B2",
        "seat_number": "34",
        "description": "Passenger has severe chest pain and collapsed on floor, unconscious",
        "category": "Medical emergency",
        "reported_language": "en"
    }
    response = client.post("/api/incidents", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["incident_id"] > 0
    assert data["suggested_priority"] == "CRITICAL"
    assert "handover_recommendation" in data
    assert data["handover_recommendation"]["recommended_station_code"] != ""


def test_duplicate_detection():
    # Submit first report
    client.post("/api/incidents", json={
        "train_number": "12004",
        "coach_number": "C3",
        "description": "Heavy smoke visible near electrical box in coach C3",
        "category": "Fire or smoke",
        "reported_language": "en"
    })

    # Submit second report on same train and coach
    response2 = client.post("/api/incidents", json={
        "train_number": "12004",
        "coach_number": "C3",
        "description": "Fire hazard! Thick smoke and burning odor inside coach C3",
        "category": "Fire or smoke",
        "reported_language": "en"
    })
    assert response2.status_code == 200
    data2 = response2.json()
    # Duplicate detector should find previous incident
    assert data2["potential_duplicates_count"] >= 1


def test_simulator_scenarios():
    scenarios_resp = client.get("/api/simulator/scenarios")
    assert scenarios_resp.status_code == 200
    scenarios = scenarios_resp.json()
    assert len(scenarios) >= 5

    # Run medical emergency scenario
    run_resp = client.post("/api/simulator/run", json={"scenario_id": "medical_emergency"})
    assert run_resp.status_code == 200
    res = run_resp.json()
    assert res["scenario_id"] == "medical_emergency"
    assert len(res["stages"]) >= 5
    assert res["final_outcome"]["requires_operator_approval"] is True
