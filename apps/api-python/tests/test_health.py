from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "api-python"


def test_internal_key_required():
    response = client.post("/roadmap/generate", json={"user_id": "test"})
    assert response.status_code == 403
