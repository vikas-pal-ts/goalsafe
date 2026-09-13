import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_e2e_pipeline():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create request
        req_data = {
            "user_id": "user_16",
            "description": "car", "request_type": "Purchase", "user_query": "I want to buy a car for 122500 by 2023-10-11",
            "amount": 122500,
            "desired_date": "2023-08-12",
            "payment_preference": "full_payment"
        }
        res = await client.post("/api/requests/", json=req_data)
        assert res.status_code in [200, 201], f"Failed to create: {res.text}"
        data = res.json()
        req_id = data["id"]
        
        # 2. Analyze request
        analyze_res = await client.post(f"/api/requests/{req_id}/analyze")
        assert analyze_res.status_code == 200, f"Failed to analyze: {analyze_res.text}"
        analyze_data = analyze_res.json()
        
        # Verify layer semantics
        assert analyze_data["request_id"] == req_id
        decision = analyze_data["decision"]
        assert decision["status"] in ["affordable_now", "not_affordable", "affordable_with_plan", "affordable_later"]
        
        # 3. Get history
        hist_res = await client.get("/api/requests/?user_id=user_16")
        assert hist_res.status_code == 200
        hist = hist_res.json()
        found = False
        for r in hist["items"]:
            if r["id"] == req_id:
                found = True
                assert r["user_id"] == "user_16"
                break
        assert found, "Request not found in history"

@pytest.mark.asyncio
async def test_current_expenses():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/expenses?user_id=user_16")
        assert res.status_code == 200
        data = res.json()
        assert "items" in data


@pytest.mark.asyncio
async def test_users_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/users")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "user_id" in data[0]
        assert "label" in data[0]
        assert "currency" in data[0]
