"""
CashflowForecast: the result object returned by the simulator.

Contains:
- All daily projections
- Deterministic summary metrics
- Liquidity horizon
- Audit utilities

No affordability status here — that is Milestone 4.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

from .projection import DailyBalanceProjection


@dataclass
class CashflowForecast:
    """
    The complete output of DailyCashflowSimulator.simulate().
    All monetary values are in the user's home currency.
    """

    start_date: date
    end_date: date
    currency: str
    days: list[DailyBalanceProjection] = field(default_factory=list)

    # ------------------------------------------------------------------
    # Summary metrics (computed on demand)
    # ------------------------------------------------------------------

    @property
    def lowest_balance(self) -> Decimal:
        if not self.days:
            return Decimal(0)
        return min(d.closing_balance for d in self.days)

    @property
    def lowest_balance_date(self) -> date | None:
        if not self.days:
            return None
        day = min(self.days, key=lambda d: d.closing_balance)
        return day.date

    @property
    def minimum_balance_breached(self) -> bool:
        return any(d.minimum_balance_breached for d in self.days)

    @property
    def minimum_balance_shortfall(self) -> Decimal:
        """Maximum shortfall across all days."""
        if not self.days:
            return Decimal(0)
        return max(d.minimum_balance_shortfall for d in self.days)

    @property
    def liquidity_horizon(self) -> int:
        """
        Number of consecutive days from start_date for which
        the projected balance stays >= minimum_balance.
        If the first day violates, returns 0.
        """
        count = 0
        for day in self.days:
            if day.minimum_balance_breached:
                break
            count += 1
        return count

    @property
    def total_inflows(self) -> Decimal:
        return sum((d.confirmed_inflows for d in self.days), Decimal(0))

    @property
    def total_essential_outflows(self) -> Decimal:
        return sum((d.essential_outflows for d in self.days), Decimal(0))

    @property
    def total_debt_outflows(self) -> Decimal:
        return sum((d.mandatory_debt_outflows for d in self.days), Decimal(0))

    @property
    def total_flexible_outflows(self) -> Decimal:
        return sum((d.flexible_outflows for d in self.days), Decimal(0))

    @property
    def total_request_payments(self) -> Decimal:
        return sum((d.request_payment for d in self.days), Decimal(0))

    def day_projection(self, on_date: date) -> DailyBalanceProjection | None:
        for d in self.days:
            if d.date == on_date:
                return d
        return None

    def is_scenario_safe(self) -> bool:
        """No single day violates the minimum balance constraint."""
        return not self.minimum_balance_breached
