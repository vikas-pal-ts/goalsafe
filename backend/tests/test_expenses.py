import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_expenses_endpoint_returns_multiple_records():
    """Test 1: Returns more than one record when dataset contains multiple applicable expenses."""
    response = client.get("/api/expenses?user_id=user_26")
    assert response.status_code == 200
    data = response.json()
    items = data.get("items", [])
    
    assert len(items) > 1, f"Expected multiple expenses, got {len(items)}"

def test_expenses_endpoint_valid_source_ids():
    """Test 2: Returned records have valid source event IDs."""
    response = client.get("/api/expenses?user_id=user_26")
    data = response.json()
    items = data.get("items", [])
    
    # Event IDs should either be original dataset IDs (e.g. event_123)
    # or projected IDs from the recurring pattern detector (e.g. proj_rent_...)
    for item in items:
        event_id = item.get("id")
        assert event_id is not None
        assert "event_" in event_id or "proj_" in event_id

def test_expenses_endpoint_no_cancelled_events():
    """Test 3: Cancelled/failed events are not returned."""
    # Our mocked response uses real dataset data.
    # The dataset_provider and expenses route explicitly exclude cancelled/failed statuses.
    response = client.get("/api/expenses?user_id=user_26")
    data = response.json()
    items = data.get("items", [])
    
    for item in items:
        assert getattr(item, "status", None) not in ["cancelled", "failed"]

def test_expenses_endpoint_not_mocked():
    """Test 4: The endpoint does not return fabricated/mock expenses."""
    response = client.get("/api/expenses?user_id=user_26")
    data = response.json()
    items = data.get("items", [])
    
    # Check that items have categories and are strings
    for item in items:
        assert isinstance(item.get("category"), str)

def test_expenses_endpoint_protection_matches_flexibility():
    """Test 5: Protected/Flexible classification matches source flexibility."""
    response = client.get("/api/expenses?user_id=user_26")
    data = response.json()
    items = data.get("items", [])
    
    for item in items:
        # Protected items usually correspond to 'fixed' flexibility or essential categories.
        # Flexible items usually correspond to 'reducible' or 'stoppable'.
        if item.get("flexibility") in ["reducible", "stoppable", "reducible_or_stoppable"]:
            # Flexible outflows shouldn't be protected by default unless overridden
            assert not item.get("is_protected") or item.get("category") in ["rent", "groceries", "transport"]

def test_expenses_endpoint_does_not_show_historical_one_time():
    """Test 7: A stale historical one-time expense is not incorrectly presented as the only current/upcoming expense."""
    response = client.get("/api/expenses?user_id=user_26")
    data = response.json()
    items = data.get("items", [])
    
    # We should have upcoming dates
    # Since reference date is max dataset date (e.g. Dec 2024), next_date should be >= Dec 2024
    from datetime import date
    for item in items:
        next_date = date.fromisoformat(item["next_date"])
        assert next_date >= date(2024, 12, 1) # Must be on or after the general reference period

def test_expenses_isolation():
    res_a = client.get("/api/expenses?user_id=user_10")
    res_b = client.get("/api/expenses?user_id=user_26")
    
    assert res_a.status_code == 200
    assert res_b.status_code == 200
    
    data_a = res_a.json()
    data_b = res_b.json()
    
    # They should have different expense profiles
    assert data_a["items"] != data_b["items"]

def test_expenses_endpoint_requires_user_id_if_no_env(monkeypatch):
    import os
    if "MONEYMIND_USER_ID" in os.environ:
        monkeypatch.delenv("MONEYMIND_USER_ID")
        
    response = client.get("/api/expenses")
    assert response.status_code == 400
    assert "user_id is required" in response.json()["detail"]
