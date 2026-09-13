from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class ResolvedFinancialEvent(BaseModel):
    event_id: str
    user_id: str
    event_type: str
    description: str | None = None
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

    evidence_ids: list[str] = []
    amount_source: str
    resolution_status: str
    resolution_notes: str | None = None
