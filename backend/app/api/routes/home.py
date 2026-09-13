from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal

from app.db.database import get_db
from app.models.request import FinancialRequest
from app.api.routes.requests import _build_request_response
from app.services.dataset_provider import get_repository, resolve_and_validate_user_id
from app.services.affordability_agent.data.classification import is_ignored_for_forecast
from app.services.affordability_agent.data.twin_factory import FinancialTwinFactory

router = APIRouter()

@router.get("")
def get_home_data(user_id: str = None, db: Session = Depends(get_db)):
    uid = resolve_and_validate_user_id(user_id)
    repo = get_repository()
    
    # 1. User
    users = repo.get_all_users()
    user_info = next((u for u in users if u["user_id"] == uid), None)
    if not user_info:
        user_info = {"user_id": uid, "label": f"Person {uid[-2:]}"}

    # 2. Financial Snapshot
    profile = repo.get_profile(uid)
    
    monthly_expenses = Decimal(0)
    next_salary = Decimal(0)
    
    req_date = date.today()
    twin = FinancialTwinFactory(repo).build(uid, req_date)
    
    for ev in twin.ledger.events_for_user(uid):
        if is_ignored_for_forecast(ev):
            continue
        eff_date = ev.settlement_date or ev.event_date
        if req_date <= eff_date <= req_date + timedelta(days=30):
            if ev.direction == "debit":
                monthly_expenses += ev.amount or Decimal(0)
            elif ev.direction == "credit" and next_salary == 0:
                next_salary = ev.amount or Decimal(0)
                
    financial_snapshot = {
        "available_balance": float(profile.current_available_balance),
        "monthly_expenses": float(monthly_expenses),
        "savings": float(profile.minimum_balance_to_keep),
        "next_salary": float(next_salary)
    }

    # 3. Latest Decision (latest analyzed request)
    latest_req = db.query(FinancialRequest).filter(
        FinancialRequest.user_id == uid,
        FinancialRequest.status == "analyzed"
    ).order_by(FinancialRequest.created_at.desc()).first()
    
    latest_decision = None
    if latest_req and latest_req.decision and latest_req.decision.decision_data:
        latest_decision = latest_req.decision.decision_data

    # 4. Recent Requests
    recent_db = db.query(FinancialRequest).filter(
        FinancialRequest.user_id == uid
    ).order_by(FinancialRequest.created_at.desc()).limit(3).all()
    
    recent_requests = [_build_request_response(r).model_dump() for r in recent_db]

    return {
        "user": {
            "user_id": user_info["user_id"],
            "display_name": user_info.get("label", f"Person {uid[-2:]}")
        },
        "financial_snapshot": financial_snapshot,
        "latest_decision": latest_decision,
        "recent_requests": recent_requests
    }
