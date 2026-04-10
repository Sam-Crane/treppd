from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "api-python"


def test_internal_key_required():
    """Any non-health endpoint without X-Internal-Key returns 403."""
    response = client.get("/rules/offices/DE-BY")
    assert response.status_code == 403
