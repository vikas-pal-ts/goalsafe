import enum
import uuid
from decimal import Decimal
from datetime import datetime, date
from typing import Optional, Any
from sqlalchemy import Column, String, Numeric, Date, Text, Enum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pydantic import BaseModel, ConfigDict, Field

from app.db.database import Base

class RequestStatus(str, enum.Enum):
    draft = "draft"
    ready_for_review = "ready_for_review"
    submitted = "submitted"
    analyzed = "analyzed"

class FinancialRequest(Base):
    __tablename__ = "financial_requests"

    id = Column(String, primary_key=True, index=True, default=lambda: f"req_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    request_type = Column(String, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    desired_date = Column(Date, nullable=False)
    deadline = Column(Date, nullable=True)
    payment_preference = Column(String, nullable=False)
    additional_context = Column(Text, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.draft, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    decision = relationship("DecisionRecord", uselist=False, back_populates="request", cascade="all, delete-orphan")


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id = Column(String, primary_key=True, default=lambda: f"dec_{uuid.uuid4().hex[:12]}")
    request_id = Column(String, ForeignKey("financial_requests.id"), unique=True, nullable=False)
    decision_data = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    request = relationship("FinancialRequest", back_populates="decision")


# Pydantic models for API
class RequestCreate(BaseModel):
    user_id: Optional[str] = None
    description: str = Field(..., max_length=500)
    request_type: str
    amount: Decimal = Field(..., gt=0)
    desired_date: date
    deadline: Optional[date] = None
    payment_preference: str
    additional_context: Optional[str] = Field(None, max_length=2000)

class RequestUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=500)
    request_type: Optional[str] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    desired_date: Optional[date] = None
    deadline: Optional[date] = None
    payment_preference: Optional[str] = None
    additional_context: Optional[str] = Field(None, max_length=2000)

class RequestResponse(BaseModel):
    id: str
    user_id: str
    description: str
    request_type: str
    amount: Decimal
    desired_date: date
    deadline: Optional[date]
    payment_preference: str
    additional_context: Optional[str]
    status: RequestStatus
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    decision_data: Optional[dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedRequestResponse(BaseModel):
    items: list[RequestResponse]
    total: int
    limit: int
    offset: int
