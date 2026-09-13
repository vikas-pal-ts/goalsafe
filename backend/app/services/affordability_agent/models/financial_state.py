"""
FinancialTwin: the user's full financial state as of request_date.

Wraps:
- FinancialProfile (static data)
- CanonicalFinancialLedger (all resolved events)

The twin is the canonical input to DailyCashflowSimulator.
It does NOT make affordability decisions.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from .profile import FinancialProfile


class FinancialTwin(BaseModel):
    user_id: str
    request_date: date
    profile: FinancialProfile
    ledger: object  # CanonicalFinancialLedger — typed via TYPE_CHECKING
    message_rules: List[Dict[str, Any]] = []  # parsed message rules for recurring projection

    model_config = {"arbitrary_types_allowed": True}

    # Convenience passthrough properties
    @property
    def home_currency(self) -> str:
        return self.profile.home_currency

    @property
    def current_balance(self) -> Decimal:
        return self.profile.current_available_balance

    @property
    def minimum_balance(self) -> Decimal:
        return self.profile.minimum_balance_to_keep

    @property
    def available_balance(self) -> Decimal:
        """Balance available above the minimum today."""
        return max(
            self.profile.current_available_balance - self.profile.minimum_balance_to_keep,
            Decimal(0),
        )

    @property
    def minimum_required_balance(self) -> Decimal:
        return self.profile.minimum_balance_to_keep
