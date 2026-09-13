import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models.request import FinancialRequest

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_create_request():
    response = client.post(
        "/api/requests/",
        json={
            "description": "Buy a laptop",
            "request_type": "Purchase",
            "amount": "80000",
            "desired_date": "2025-09-15",
            "payment_preference": "No preference"
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "Buy a laptop"
    assert data["amount"] == "80000.00"
    assert "id" in data
    return data["id"]

def test_create_request_validation():
    # Missing amount
    response = client.post(
        "/api/requests/",
        json={
            "description": "Buy a laptop",
            "request_type": "Purchase",
            "desired_date": "2025-09-15",
            "payment_preference": "No preference"
        },
    )
    assert response.status_code == 422
    
    # Invalid date
    response = client.post(
        "/api/requests/",
        json={
            "description": "Buy a laptop",
            "request_type": "Purchase",
            "amount": "80000",
            "desired_date": "invalid-date",
            "payment_preference": "No preference"
        },
    )
    assert response.status_code == 422

def test_get_request():
    req_id = test_create_request()
    response = client.get(f"/api/requests/{req_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == req_id
    assert data["description"] == "Buy a laptop"

def test_update_request():
    req_id = test_create_request()
    response = client.patch(
        f"/api/requests/{req_id}",
        json={
            "amount": "90000.0"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == "90000.00"

def test_list_requests():
    # Create another request
    client.post(
        "/api/requests/",
        json={
            "description": "Travel to Europe",
            "request_type": "Travel",
            "amount": "200000",
            "desired_date": "2026-01-01",
            "payment_preference": "No preference"
        },
    )
    response = client.get("/api/requests/")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2

def test_analyze_request():
    req_id = test_create_request()
    response = client.post(f"/api/requests/{req_id}/analyze")
    assert response.status_code == 200
    data = response.json()
    assert "decision" in data
    assert "status" in data["decision"]
    
    # Check if request status was updated to analyzed
    response = client.get(f"/api/requests/{req_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "analyzed"
