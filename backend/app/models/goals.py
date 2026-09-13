import uuid
from decimal import Decimal
from datetime import datetime, date

from sqlalchemy import Column, String, Numeric, Date, DateTime, Text
from app.db.database import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=lambda: f"goal_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    target_amount = Column(Numeric(14, 2), nullable=False)
    current_amount = Column(Numeric(14, 2), nullable=False, default=0.0)
    target_date = Column(Date, nullable=False)
    priority = Column(String, nullable=False, default="medium")
    status = Column(String, nullable=False, default="active")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
