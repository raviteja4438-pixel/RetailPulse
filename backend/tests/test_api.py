from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_dashboard_shape():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    assert "total_revenue" in response.json()
    assert "low_stock_products" in response.json()

def test_forecast_limit():
    response = client.get("/api/forecast?days=30")
    assert response.status_code == 200
    assert len(response.json()["forecast"]) == 30
