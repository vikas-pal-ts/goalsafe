from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.request import (
    FinancialRequest, RequestCreate, RequestUpdate, 
    RequestResponse, PaginatedRequestResponse, RequestStatus, DecisionRecord
)
from app.models.decisions import AnalyzeRequest, AnalyzeResponse
from app.services.dataset_engine import HackerRankFinancialDecisionEngine
from app.services.dataset_provider import get_current_user_id, resolve_and_validate_user_id

router = APIRouter()
_engine = HackerRankFinancialDecisionEngine()

@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(request: RequestCreate, db: Session = Depends(get_db)):
    if request.deadline and request.deadline < request.desired_date:
        raise HTTPException(
            status_code=422,
            detail="Deadline cannot be earlier than desired date."
        )
    
    uid = resolve_and_validate_user_id(request.user_id)
    db_request = FinancialRequest(**request.model_dump(exclude={"user_id"}), user_id=uid)
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return _build_request_response(db_request)

def _build_request_response(db_request: FinancialRequest) -> RequestResponse:
    data = db_request.__dict__.copy()
    if db_request.decision and db_request.decision.decision_data:
        data["decision_data"] = db_request.decision.decision_data
    return RequestResponse(**data)

@router.get("/{request_id}", response_model=RequestResponse)
def get_request(request_id: str, db: Session = Depends(get_db)):
    db_request = db.query(FinancialRequest).filter(FinancialRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    return _build_request_response(db_request)

@router.patch("/{request_id}", response_model=RequestResponse)
def update_request(request_id: str, request: RequestUpdate, db: Session = Depends(get_db)):
    db_request = db.query(FinancialRequest).filter(FinancialRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_data = request.model_dump(exclude_unset=True)
    if 'deadline' in update_data and update_data['deadline']:
        desired = update_data.get('desired_date') or db_request.desired_date
        if update_data['deadline'] < desired:
            raise HTTPException(
                status_code=422,
                detail="Deadline cannot be earlier than desired date."
            )
            
    for key, value in update_data.items():
        setattr(db_request, key, value)
        
    db.commit()
    db.refresh(db_request)
    return _build_request_response(db_request)

@router.get("/", response_model=PaginatedRequestResponse)
def list_requests(limit: int = 20, offset: int = 0, status: str = None, user_id: str = None, db: Session = Depends(get_db)):
    query = db.query(FinancialRequest)
    
    uid = resolve_and_validate_user_id(user_id)
    query = query.filter(FinancialRequest.user_id == uid)

    if status:
        query = query.filter(FinancialRequest.status == status)
        
    total = query.count()
    items = query.order_by(FinancialRequest.created_at.desc()).offset(offset).limit(limit).all()
    
    return PaginatedRequestResponse(
        items=[_build_request_response(item) for item in items],
        total=total,
        limit=limit,
        offset=offset
    )

@router.post("/{request_id}/analyze", response_model=AnalyzeResponse)
async def analyze_request(request_id: str, db: Session = Depends(get_db)):
    db_request = db.query(FinancialRequest).filter(FinancialRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    # Mark as submitted if it's not already analyzed or submitted
    if db_request.status == RequestStatus.draft or db_request.status == RequestStatus.ready_for_review:
        db_request.status = RequestStatus.submitted
        db_request.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(db_request)
        
    # Construct query for the demo engine
    query = db_request.description
    if db_request.amount:
        query += f" Amount: {db_request.amount}."
    if db_request.desired_date:
        query += f" By: {db_request.desired_date}."
        
    analyze_req = AnalyzeRequest(
        request_id=request_id,
        user_id=db_request.user_id,
        user_query=query,
        amount=float(db_request.amount),
        desired_date=db_request.desired_date.isoformat(),
        payment_preference=db_request.payment_preference
    )
    decision = await _engine.analyze(analyze_req)
    
    db_request.status = RequestStatus.analyzed
    
    # Save or update decision
    if db_request.decision:
        db_request.decision.decision_data = decision.model_dump()
    else:
        decision_record = DecisionRecord(
            request_id=request_id,
            decision_data=decision.model_dump()
        )
        db.add(decision_record)
        
    db.commit()
    
    return decision
