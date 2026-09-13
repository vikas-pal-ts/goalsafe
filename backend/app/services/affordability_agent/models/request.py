from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class AffordabilityRequest(BaseModel):
    request_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    request_date: date
    request_type: str = Field(..., min_length=1)
    requested_amount: Decimal = Field(..., gt=0)
    desired_completion_date: date
    allows_partial_payment: bool
    request_text: str = Field(..., min_length=1)
