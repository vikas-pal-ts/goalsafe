from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class FinancialEvent(BaseModel):
    event_id: str
    user_id: str
    event_type: str
    description: str
    category: str
    direction: str
    amount: Decimal | None = None
    currency: str | None = None
    event_date: date
    settlement_date: date | None = None
    status: str
    linked_event_id: str | None = None
    flexibility: str
    minimum_allowed_amount: Decimal | None = None
