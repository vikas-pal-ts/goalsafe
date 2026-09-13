"""
DailyBalanceProjection and DailyContribution.

These are the output units of the cashflow simulator.
All amounts are in the user's home currency.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal


@dataclass
class DailyContribution:
    """Tracks which event IDs contributed to each cashflow bucket."""

    inflow_event_ids: list[str] = field(default_factory=list)
    essential_outflow_event_ids: list[str] = field(default_factory=list)
    debt_outflow_event_ids: list[str] = field(default_factory=list)
    flexible_outflow_event_ids: list[str] = field(default_factory=list)
    request_payment_note: str = ""


@dataclass
class DailyBalanceProjection:
    """
    One simulated day in a cashflow forecast.
    All monetary fields are in the user's home currency.
    """

    date: date
    opening_balance: Decimal
    confirmed_inflows: Decimal = Decimal(0)
    essential_outflows: Decimal = Decimal(0)
    mandatory_debt_outflows: Decimal = Decimal(0)
    flexible_outflows: Decimal = Decimal(0)
    request_payment: Decimal = Decimal(0)
    closing_balance: Decimal = Decimal(0)
    minimum_balance: Decimal = Decimal(0)
    minimum_balance_breached: bool = False
    minimum_balance_shortfall: Decimal = Decimal(0)
    contributions: DailyContribution = field(default_factory=DailyContribution)

    def finalise(self) -> None:
        """Compute closing_balance and breach flags from component fields."""
        self.closing_balance = (
            self.opening_balance
            + self.confirmed_inflows
            - self.essential_outflows
            - self.mandatory_debt_outflows
            - self.flexible_outflows
            - self.request_payment
        )
        shortfall = self.minimum_balance - self.closing_balance
        self.minimum_balance_shortfall = max(shortfall, Decimal(0))
        self.minimum_balance_breached = self.closing_balance < self.minimum_balance

    @property
    def free_liquidity(self) -> Decimal:
        """Balance above the minimum; never negative."""
        return max(self.closing_balance - self.minimum_balance, Decimal(0))
