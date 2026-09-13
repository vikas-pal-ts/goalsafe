from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, validator, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.goals import Goal
from app.services.dataset_provider import get_current_user_id, resolve_and_validate_user_id

router = APIRouter()

# ------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------

class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1)
    target_amount: Decimal = Field(..., gt=0)
    current_amount: Decimal = Field(default=Decimal(0), ge=0)
    target_date: date
    priority: str = Field(default="medium")
    status: str = Field(default="active")

    @validator("current_amount")
    def check_current_amount(cls, v, values):
        if "target_amount" in values and v > values["target_amount"]:
            raise ValueError("current_amount cannot be greater than target_amount")
        return v
        
    @validator("priority")
    def check_priority(cls, v):
        allowed = ["high", "medium", "low"]
        if v not in allowed:
            raise ValueError(f"priority must be one of {allowed}")
        return v
        
    @validator("status")
    def check_status(cls, v):
        allowed = ["active", "completed", "paused"]
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v

class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    target_amount: Optional[Decimal] = Field(None, gt=0)
    current_amount: Optional[Decimal] = Field(None, ge=0)
    target_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    target_date: date
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True

class GoalListResponse(BaseModel):
    items: List[GoalResponse]

# ------------------------------------------------------------------
# API Routes
# ------------------------------------------------------------------

@router.get("", response_model=GoalListResponse)
def list_goals(user_id: str = None, db: Session = Depends(get_db)):
    uid = resolve_and_validate_user_id(user_id)
    goals = db.query(Goal).filter(Goal.user_id == uid).order_by(Goal.created_at.desc()).all()
    return {"items": goals}

@router.post("", response_model=GoalResponse)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db)):
    db_goal = Goal(
        name=goal_in.name,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount,
        target_date=goal_in.target_date,
        priority=goal_in.priority,
        status=goal_in.status,
        user_id=resolve_and_validate_user_id()
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: str, goal_in: GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    update_data = goal_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
        
    if goal.current_amount > goal.target_amount:
        raise HTTPException(status_code=400, detail="current_amount cannot exceed target_amount")
        
    db.commit()
    db.refresh(goal)
    return goal
