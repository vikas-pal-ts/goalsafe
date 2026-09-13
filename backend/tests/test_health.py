"""Backend tests — pytest."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "goalsafe-backend"


@pytest.mark.asyncio
async def test_analyze_house():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/analyze",
            json={
                "request_id": "req_demo123",
                "user_id": "user_26",
                "user_query": "I have ₹25 lakh in savings and want to buy a house.",
                "amount": 2500000.0,
                "desired_date": "2025-12-01",
                "payment_preference": "No preference"
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert "decision" in data
    assert data["decision"]["status"] in [
        "affordable_now", "affordable_with_plan", "affordable_later", "not_affordable"
    ]
    assert "financial_snapshot" in data
    assert "scenarios" in data
    assert "explanation" in data
