"""
ForecastConfig, ForecastScenario, SpendingAdjustment, PaymentScheduleEntry.

These models represent the inputs to the cashflow simulator.
No mutations to the canonical ledger occur here.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator, model_validator


class PaymentScheduleEntry(BaseModel):
    """A single payment in a proposed schedule."""

    payment_date: date
    amount: Decimal
    currency: str

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError(f"Payment amount must be > 0, got {v}")
        return v


class SpendingAdjustment(BaseModel):
    """
    An overlay adjustment to one flexible financial event.

    action:
        'stop'   → treat the event as if it has amount 0
        'reduce' → cap the event amount at new_amount
    """

    event_id: str
    action: str  # 'stop' | 'reduce'
    new_amount: Decimal | None = None  # required when action == 'reduce'

    @model_validator(mode="after")
    def validate_reduce(self) -> SpendingAdjustment:
        if self.action == "reduce" and self.new_amount is None:
            raise ValueError("new_amount is required when action is 'reduce'")
        if self.action == "stop" and self.new_amount is not None:
            raise ValueError("new_amount must not be set when action is 'stop'")
        if self.action not in {"stop", "reduce"}:
            raise ValueError(f"Unknown action: {self.action!r}")
        return self


class ForecastConfig(BaseModel):
    """Controls the time window of a simulation."""

    start_date: date
    base_horizon_days: int = 90

    @property
    def default_end_date(self) -> date:
        from datetime import timedelta
        return self.start_date + timedelta(days=self.base_horizon_days - 1)

    def effective_end_date(self, payment_schedule: list[PaymentScheduleEntry]) -> date:
        """
        Extend the horizon beyond 90 days when a payment plan requires it.
        The simulation must cover every payment in the plan.
        """
        end = self.default_end_date
        for entry in payment_schedule:
            end = max(end, entry.payment_date)
        return end


class ForecastScenario(BaseModel):
    """
    A proposed financial action overlaid on top of the canonical ledger.

    The ledger is never mutated. The scenario is an overlay.
    """

    scenario_name: str
    request_payment_schedule: list[PaymentScheduleEntry] = []
    spending_adjustments: list[SpendingAdjustment] = []

    @model_validator(mode="after")
    def schedule_is_chronological(self) -> ForecastScenario:
        dates = [e.payment_date for e in self.request_payment_schedule]
        if dates != sorted(dates):
            raise ValueError("request_payment_schedule must be in chronological order")
        return self

    def adjustment_for(self, event_id: str) -> SpendingAdjustment | None:
        for adj in self.spending_adjustments:
            if adj.event_id == event_id:
                return adj
        return None
