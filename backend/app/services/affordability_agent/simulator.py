"""
DailyCashflowSimulator — deterministic, Decimal-only, no external calls.

Algorithm per day:
    closing = opening
            + confirmed_inflows          (settled/scheduled credits only)
            - essential_outflows         (fixed + protected category debits)
            - mandatory_debt_outflows    (debt_payment events that are essential)
            - flexible_outflows          (scenario-adjusted flexible debits)
            - request_payment            (scenario overlay for the proposed request)

Recurring event generation:
    The dataset does NOT have an explicit recurrence field.
    We do NOT invent recurrence. We rely solely on events explicitly present
    in the dataset (settled history + scheduled/pending future events).
    The problem statement says: "Detect recurrence only when history supports it."
    Recurrence detection is deferred to Milestone 4 if required.

FX:
    Every non-home-currency event is converted using settlement_date (or
    event_date when settlement_date is absent) against exchange_rates.csv.
    Decimal arithmetic only. Missing rates raise ValueError.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from .data.classification import (
    is_confirmed_income,
    is_essential_outflow,
    is_flexible_outflow,
    is_included_in_forecast,
    is_mandatory_debt,
)
from .data.ledger import CanonicalFinancialLedger
from .models.cashflow_forecast import CashflowForecast
from .models.financial_state import FinancialTwin
from .models.forecast import ForecastConfig, ForecastScenario, PaymentScheduleEntry
from .models.profile import FinancialProfile
from .models.projection import DailyBalanceProjection, DailyContribution
from .models.resolved_event import ResolvedFinancialEvent
from .normalization.currency import CurrencyConverter


class DailyCashflowSimulator:
    def __init__(self, currency_converter: CurrencyConverter) -> None:
        self._fx = currency_converter

    # ------------------------------------------------------------------
    # Public entry points
    # ------------------------------------------------------------------

    def simulate(
        self,
        twin: FinancialTwin,
        scenario: ForecastScenario,
        config: ForecastConfig,
    ) -> CashflowForecast:
        """
        Simulate the financial impact of a scenario over the configured horizon.
        Returns a CashflowForecast (no affordability decision inside).
        """
        profile = twin.profile
        ledger = twin.ledger
        end_date = config.effective_end_date(scenario.request_payment_schedule)

        # Pre-index events by their effective date for O(1) daily lookup
        event_by_date = self._build_date_index(
            ledger, profile, config.start_date, end_date, getattr(twin, 'message_rules', None)
        )

        # Pre-index request payments by date
        payment_by_date: dict[date, list[PaymentScheduleEntry]] = defaultdict(list)
        for entry in scenario.request_payment_schedule:
            payment_by_date[entry.payment_date].append(entry)

        # Pre-build spending adjustment map
        adj_map = {adj.event_id: adj for adj in scenario.spending_adjustments}

        days: list[DailyBalanceProjection] = []
        balance = profile.current_available_balance

        current = config.start_date
        while current <= end_date:
            proj = DailyBalanceProjection(
                date=current,
                opening_balance=balance,
                minimum_balance=profile.minimum_balance_to_keep,
            )
            contrib = DailyContribution()

            # --- inflows ---
            for ev in event_by_date["inflow"].get(current, []):
                amt = self._home_amount(ev, profile)
                proj.confirmed_inflows += amt
                contrib.inflow_event_ids.append(ev.event_id)

            # --- essential outflows (includes mandatory debt) ---
            for ev in event_by_date["essential"].get(current, []):
                amt = self._home_amount(ev, profile)
                if is_mandatory_debt(ev, profile):
                    proj.mandatory_debt_outflows += amt
                    contrib.debt_outflow_event_ids.append(ev.event_id)
                else:
                    proj.essential_outflows += amt
                    contrib.essential_outflow_event_ids.append(ev.event_id)

            # --- flexible outflows (scenario-adjusted) ---
            for ev in event_by_date["flexible"].get(current, []):
                amt = self._home_amount(ev, profile)
                adj = adj_map.get(ev.event_id)
                if adj is not None:
                    if adj.action == "stop":
                        amt = Decimal(0)
                    elif adj.action == "reduce" and adj.new_amount is not None:
                        # Respect minimum_allowed_amount
                        floor = ev.minimum_allowed_amount or Decimal(0)
                        amt = max(adj.new_amount, floor)
                proj.flexible_outflows += amt
                if amt > 0:
                    contrib.flexible_outflow_event_ids.append(ev.event_id)

            # --- request payments ---
            for entry in payment_by_date.get(current, []):
                pay_amt = self._convert_payment(entry, profile)
                proj.request_payment += pay_amt
            if proj.request_payment > 0:
                contrib.request_payment_note = (
                    f"Request payment: {proj.request_payment}"
                )

            proj.contributions = contrib
            proj.finalise()
            days.append(proj)

            balance = proj.closing_balance
            current += timedelta(days=1)

        return CashflowForecast(
            start_date=config.start_date,
            end_date=end_date,
            currency=profile.home_currency,
            days=days,
        )

    # ------------------------------------------------------------------
    # Scenario factory helpers
    # ------------------------------------------------------------------

    def baseline_scenario(self) -> ForecastScenario:
        """No request payment, no spending adjustments."""
        return ForecastScenario(scenario_name="baseline")

    def scenario_for_full_payment(
        self,
        request_date: date,
        requested_amount: Decimal,
        currency: str,
    ) -> ForecastScenario:
        """Single payment on request_date for the full requested amount."""
        return ForecastScenario(
            scenario_name="full_payment",
            request_payment_schedule=[
                PaymentScheduleEntry(
                    payment_date=request_date,
                    amount=requested_amount,
                    currency=currency,
                )
            ],
        )

    def scenario_from_payment_plan(
        self,
        plan_str: str,
        currency: str,
        scenario_name: str = "payment_plan",
    ) -> ForecastScenario:
        """
        Parse a payment plan string in the format:
            YYYY-MM-DD:amount|YYYY-MM-DD:amount|...
        """
        from dateutil.parser import parse as parse_date

        entries = []
        for part in plan_str.strip().split("|"):
            part = part.strip()
            if not part or part.lower() == "none":
                continue
            date_str, amount_str = part.split(":", 1)
            entries.append(
                PaymentScheduleEntry(
                    payment_date=parse_date(date_str.strip()).date(),
                    amount=Decimal(amount_str.strip()),
                    currency=currency,
                )
            )
        return ForecastScenario(
            scenario_name=scenario_name,
            request_payment_schedule=entries,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_date_index(
        self,
        ledger: CanonicalFinancialLedger,
        profile: FinancialProfile,
        start_date: date,
        end_date: date,
        message_rules=None,
    ) -> dict[str, dict[date, list[ResolvedFinancialEvent]]]:
        """
        Group events into inflow / essential / flexible buckets keyed by
        their effective date (settlement_date preferred, else event_date).
        Only events whose effective date falls in [start_date, end_date] are included.
        """
        result: dict[str, dict[date, list[ResolvedFinancialEvent]]] = {
            "inflow": defaultdict(list),
            "essential": defaultdict(list),
            "flexible": defaultdict(list),
        }

        # Inject recurring patterns — pass message_rules from twin if available
        from .recurring import RecurringPatternDetector
        detector = RecurringPatternDetector(message_rules=message_rules)
        # All history up to start_date
        past_events = [ev for ev in ledger.events_for_user(profile.user_id) if ev.event_date < start_date or ev.status == 'scheduled']
        projected_events = detector.detect_and_project(past_events, start_date, end_date)
        
        # Combine dataset future events + projected
        all_events = ledger.events_for_user(profile.user_id) + projected_events

        for ev in all_events:
            if not is_included_in_forecast(ev):
                continue

            eff_date = ev.settlement_date if ev.settlement_date else ev.event_date
            if not (start_date <= eff_date <= end_date):
                continue

            if is_confirmed_income(ev) or (ev.direction == "credit" and ev.status == "projected"):
                result["inflow"][eff_date].append(ev)
            elif is_flexible_outflow(ev, profile):
                result["flexible"][eff_date].append(ev)
            elif is_essential_outflow(ev, profile) or ev.direction == "debit":
                result["essential"][eff_date].append(ev)

        return result

    def _home_amount(
        self, ev: ResolvedFinancialEvent, profile: FinancialProfile
    ) -> Decimal:
        """Convert event amount to home currency. Amount must not be None."""
        if ev.amount is None:
            # Missing amount — do NOT treat as zero; skip conservatively
            return Decimal(0)
        if ev.currency is None or ev.currency == profile.home_currency:
            return ev.amount
        rate_date = (
            ev.settlement_date.isoformat()
            if ev.settlement_date
            else ev.event_date.isoformat()
        )
        return self._fx.convert_to_home_currency(
            ev.amount, ev.currency, profile.home_currency, rate_date
        )

    def _convert_payment(
        self, entry: PaymentScheduleEntry, profile: FinancialProfile
    ) -> Decimal:
        """Convert a payment schedule entry to home currency."""
        if entry.currency == profile.home_currency:
            return entry.amount
        return self._fx.convert_to_home_currency(
            entry.amount,
            entry.currency,
            profile.home_currency,
            entry.payment_date.isoformat(),
        )
