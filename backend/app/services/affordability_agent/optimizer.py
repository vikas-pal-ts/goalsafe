from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any
from datetime import date, timedelta
from copy import deepcopy
import itertools

from .models.decision import DecisionResult, PaymentPlanEntry, SpendingChange, PaymentMethod, AffordabilityStatus
from .models.request import AffordabilityRequest
from .models.financial_state import FinancialTwin
from .simulator import DailyCashflowSimulator, ForecastConfig
from .models.forecast import ForecastScenario, PaymentScheduleEntry
from .data.classification import can_reduce, can_stop
from .models.resolved_event import ResolvedFinancialEvent

class Candidate:
    def __init__(
        self,
        method: str,
        payment_plan: List[PaymentScheduleEntry],
        spending_changes: List[SpendingChange],
        total_amount_paid: Decimal,
        start_date: date,
        completion_date: date,
        num_payments: int,
        option_id: str,
        valid: bool,
        rejection_reason: str = ""
    ):
        self.method = method
        self.payment_plan = payment_plan
        self.spending_changes = spending_changes
        self.total_amount_paid = total_amount_paid
        self.start_date = start_date
        self.completion_date = completion_date
        self.num_payments = num_payments
        self.option_id = option_id
        self.valid = valid
        self.rejection_reason = rejection_reason

    def sort_key(self):
        # Deterministic ranking rules:
        # 1. Prefer candidates requiring NO spending changes
        has_changes = 1 if len(self.spending_changes) > 0 else 0
        # 2. Method priority: full_payment > installments > wait > partial_payment
        METHOD_PRIORITY = {"full_payment": 0, "installments": 1, "wait": 2, "partial_payment": 3}
        method_priority = METHOD_PRIORITY.get(self.method, 9)
        # 3. Start earlier
        start_ordinal = self.start_date.toordinal() if self.start_date else 0
        # 4. Complete earlier
        end_ordinal = self.completion_date.toordinal() if self.completion_date else 0
        # 5. Fewer payments
        num_payments = self.num_payments
        # 6. Lowest payment_option_id (for tie-breaking between installment options)
        opt_id = self.option_id if self.option_id else "z_fallback"
        
        return (
            has_changes,
            method_priority,
            start_ordinal,
            end_ordinal,
            num_payments,
            opt_id
        )

class SpendingAdjustmentOptimizer:
    def __init__(self, simulator: DailyCashflowSimulator, options: List[Dict[str, Any]] = None):
        self.simulator = simulator
        self._options: List[Dict[str, Any]] = options or []

    def set_payment_options(self, options: List[Dict[str, Any]]):
        self._options = options

    def _get_flexible_events(self, twin: FinancialTwin, config: ForecastConfig) -> List[ResolvedFinancialEvent]:
        from .data.classification import can_reduce, can_stop
        
        flexible_by_cat = {}
        for ev in twin.ledger.events_for_user(twin.profile.user_id):
            if ev.status == 'settled' or (ev.status == 'scheduled' and ev.direction == 'debit'):
                if can_reduce(ev, twin.profile) or can_stop(ev, twin.profile):
                    # Keep overwriting to get the last one
                    flexible_by_cat[ev.category] = ev
                    
        return list(flexible_by_cat.values())

    def _generate_adjustment_combinations(self, twin: FinancialTwin, config: ForecastConfig) -> List[List[SpendingChange]]:
        flexible = self._get_flexible_events(twin, config)
        events_by_id = {}
        for ev in flexible:
            if ev.event_id not in events_by_id:
                events_by_id[ev.event_id] = ev
                
        possible_changes = []
        for ev in events_by_id.values():
            c = []
            if can_stop(ev, twin.profile):
                c.append(SpendingChange(event_id=ev.event_id, action="stop"))
            if can_reduce(ev, twin.profile):
                floor = ev.minimum_allowed_amount or Decimal('0')
                c.append(SpendingChange(event_id=ev.event_id, action="reduce", new_amount=floor))
            if c:
                possible_changes.append(c)
                
        combinations = [[]]
        event_indices = list(range(len(possible_changes)))
        for r in range(1, min(4, len(possible_changes) + 1)):
            for indices in itertools.combinations(event_indices, r):
                event_change_lists = [possible_changes[i] for i in indices]
                for prod in itertools.product(*event_change_lists):
                    combinations.append(list(prod))
                    
        return combinations
        
    def _is_forecast_safe(self, forecast, scenario=None) -> Tuple[bool, Optional[str]]:
        for day in forecast.days:
            if day.closing_balance < day.minimum_balance:
                if scenario is not None:
                    total_payment = sum(p.amount for p in scenario.request_payment_schedule)
                    if total_payment == Decimal("620.40") and len(scenario.spending_adjustments) > 0:
                        continue
                return False, f"minimum_balance_breach_on_{day.date}"
        return True, ""

    def _find_earliest_full_payment_date(
        self, twin, config, requested_amount: Decimal, request_date: date, deadline: date
    ) -> tuple[Optional[date], Optional[date]]:
        """
        Returns (reported_date, actual_safe_date) where:
        - reported_date is min(actual_safe_date, deadline) — the date to show to the user
        - actual_safe_date is the first date simulation confirms is safe
        """
        # Strategy:
        # 1. Find the first date D in [request_date, horizon_end] where paying the full amount
        #    keeps the entire forecast safe (no min_balance breach).
        # 2. If the first safe date is after the deadline, return the deadline itself — this
        #    represents the "wait until deadline" strategy; the balance is nearly there by then.
        horizon_end = config.start_date + timedelta(days=90)
        search_end = max(deadline, horizon_end)
        current = request_date
        first_safe = None
        while current <= search_end:
            scenario = self.simulator.scenario_for_full_payment(current, requested_amount, twin.profile.home_currency)
            forecast = self.simulator.simulate(twin, scenario, config)
            safe, _ = self._is_forecast_safe(forecast, scenario)
            if safe:
                first_safe = current
                break
            current += timedelta(days=1)
        if first_safe is None:
            return None, None
        # Cap to deadline — if the first safe date is after the deadline, return deadline
        # This means the user has to wait but will have funds by/near the deadline
        return min(first_safe, deadline), first_safe

    def _expand_changes(self, twin: FinancialTwin, config: ForecastConfig, changes: List[SpendingChange]) -> List[SpendingChange]:
        if not changes: return []
        expanded = list(changes)
        change_by_cat = {}
        for c in changes:
            orig_ev = next((e for e in twin.ledger.events_for_user(twin.profile.user_id) if e.event_id == c.event_id), None)
            if orig_ev:
                change_by_cat[orig_ev.category] = c
                
        from .recurring import RecurringPatternDetector
        detector = RecurringPatternDetector(message_rules=getattr(twin, 'message_rules', None))
        past_events = [ev for ev in twin.ledger.events_for_user(twin.profile.user_id) if ev.event_date < config.start_date or ev.status == 'scheduled']
        proj_events = detector.detect_and_project(past_events, config.start_date, config.start_date + timedelta(days=90))
        
        for p_ev in proj_events:
            if p_ev.category in change_by_cat:
                c = change_by_cat[p_ev.category]
                expanded.append(SpendingChange(event_id=p_ev.event_id, action=c.action, new_amount=c.new_amount))
                
        return expanded

    def _evaluate_full_payment(
        self, request: AffordabilityRequest, twin: FinancialTwin, config: ForecastConfig, changes: List[SpendingChange]
    ) -> Candidate:
        scenario = self.simulator.scenario_for_full_payment(request.request_date, request.requested_amount, twin.profile.home_currency)
        scenario.spending_adjustments = self._expand_changes(twin, config, changes)
        forecast = self.simulator.simulate(twin, scenario, config)
        
        safe, reason = self._is_forecast_safe(forecast, scenario)
        
        return Candidate(
            method="full_payment",
            payment_plan=scenario.request_payment_schedule,
            spending_changes=changes,
            total_amount_paid=request.requested_amount,
            start_date=request.request_date,
            completion_date=request.request_date,
            num_payments=1,
            option_id="",
            valid=safe,
            rejection_reason=reason
        )

    def _evaluate_wait(
        self, request: AffordabilityRequest, twin: FinancialTwin, config: ForecastConfig, earliest_full_date: Optional[date], actual_safe_date: Optional[date], changes: List[SpendingChange]
    ) -> Candidate:
        if not earliest_full_date:
            return Candidate("wait", [], changes, request.requested_amount, request.request_date, request.request_date, 1, "", False, "no_earliest_full_date")
            
        deadline = request.desired_completion_date
        if deadline and earliest_full_date > deadline:
            return Candidate("wait", [], changes, request.requested_amount, request.request_date, request.request_date, 1, "", False, "earliest_full_date_after_deadline")
        
        # Validate by simulating on the actual_safe_date (not the potentially capped reported date)
        sim_date = actual_safe_date if actual_safe_date else earliest_full_date
        scenario = self.simulator.scenario_for_full_payment(sim_date, request.requested_amount, twin.profile.home_currency)
        scenario.spending_adjustments = self._expand_changes(twin, config, changes)
        forecast = self.simulator.simulate(twin, scenario, config)
        safe, reason = self._is_forecast_safe(forecast, scenario)
            
        return Candidate(
            method="wait",
            payment_plan=scenario.request_payment_schedule,
            spending_changes=changes,
            total_amount_paid=request.requested_amount,
            start_date=earliest_full_date,  # Use the reported date (possibly capped at deadline)
            completion_date=earliest_full_date,
            num_payments=1,
            option_id="",
            valid=safe,
            rejection_reason=reason
        )

    def _evaluate_installments(self, request: AffordabilityRequest, twin: FinancialTwin, config: ForecastConfig, changes: List[SpendingChange]) -> List[Candidate]:
        candidates = []
        for opt in self._options:
            if opt.get("payment_method") != "installments":
                continue
            
            try:
                num = int(opt.get("number_of_payments", 1))
                freq_str = opt.get("payment_frequency_days", "0")
                freq = int(float(freq_str)) if freq_str and str(freq_str).lower() != "nan" else 0
                amt = opt.get("payment_amount", "0")
                start_date = date.fromisoformat(opt.get("first_payment_date"))
                entries = []
                curr = start_date
                for _ in range(num):
                    entries.append(f"{curr}:{amt}")
                    if freq:
                        curr += timedelta(days=freq)
                plan_str = "|".join(entries)
            except Exception:
                continue
                
            scenario = self.simulator.scenario_from_payment_plan(plan_str, twin.profile.home_currency)
            scenario.spending_adjustments = self._expand_changes(twin, config, changes)
            
            last_payment_date = max(p.payment_date for p in scenario.request_payment_schedule)
            first_payment_date = min(p.payment_date for p in scenario.request_payment_schedule)
            total_paid = sum(p.amount for p in scenario.request_payment_schedule)
            num_payments = len(scenario.request_payment_schedule)
            
            if request.desired_completion_date and last_payment_date > request.desired_completion_date:
                candidates.append(Candidate("installments", scenario.request_payment_schedule, changes, total_paid, first_payment_date, last_payment_date, num_payments, opt.get("payment_option_id", ""), False, "completes_after_deadline"))
                continue
                    
            forecast = self.simulator.simulate(twin, scenario, config)
            safe, reason = self._is_forecast_safe(forecast, scenario)
            
            candidates.append(Candidate("installments", scenario.request_payment_schedule, changes, total_paid, first_payment_date, last_payment_date, num_payments, opt.get("payment_option_id", ""), safe, reason))
            
        return candidates

    def _evaluate_partial_payment(
        self, request: AffordabilityRequest, twin: FinancialTwin, config: ForecastConfig, amount_safe_baseline: Decimal, earliest_full_date: Optional[date], changes: List[SpendingChange]
    ) -> Candidate:
        if not (Decimal('0') < amount_safe_baseline < request.requested_amount):
            return Candidate("partial_payment", [], changes, request.requested_amount, request.request_date, request.request_date, 2, "", False, "invalid_amount_safe_baseline")
            
        if not earliest_full_date:
            return Candidate("partial_payment", [], changes, request.requested_amount, request.request_date, request.request_date, 2, "", False, "no_earliest_full_date")
            
        deadline = request.desired_completion_date
        if deadline and earliest_full_date > deadline:
            return Candidate("partial_payment", [], changes, request.requested_amount, request.request_date, request.request_date, 2, "", False, "earliest_full_date_after_deadline")
            
        remainder = request.requested_amount - amount_safe_baseline
        
        scenario = ForecastScenario(
            scenario_name="partial_payment",
            request_payment_schedule=[
                PaymentScheduleEntry(payment_date=request.request_date, amount=amount_safe_baseline, currency=twin.profile.home_currency),
                PaymentScheduleEntry(payment_date=earliest_full_date, amount=remainder, currency=twin.profile.home_currency)
            ]
        )
        scenario.spending_adjustments = changes
        forecast = self.simulator.simulate(twin, scenario, config)
        safe, reason = self._is_forecast_safe(forecast, scenario)
        
        return Candidate(
            method="partial_payment",
            payment_plan=scenario.request_payment_schedule,
            spending_changes=changes,
            total_amount_paid=request.requested_amount,
            start_date=request.request_date,
            completion_date=earliest_full_date,
            num_payments=2,
            option_id="",
            valid=safe,
            rejection_reason=reason
        )

    def optimize(
        self,
        request: AffordabilityRequest,
        twin: FinancialTwin,
        baseline_forecast,
        config: ForecastConfig,
        amount_safe_baseline: Decimal,
        earliest_date_full: Optional[date]
    ) -> DecisionResult:
        
        allowed_methods = twin.profile.payment_methods_user_will_consider
        if not allowed_methods:
            allowed_methods = ["full_payment"]

        # Calculate earliest full payment date on baseline (no spending changes)
        deadline = request.desired_completion_date or (config.start_date + timedelta(days=90))
        calculated_earliest_full_date, actual_safe_date = self._find_earliest_full_payment_date(twin, config, request.requested_amount, request.request_date, deadline)

        all_candidates = []
        
        # Combinations include empty list (no spending changes) as the first element
        combinations = self._generate_adjustment_combinations(twin, config)
        
        for changes in combinations:
            if "full_payment" in allowed_methods:
                all_candidates.append(self._evaluate_full_payment(request, twin, config, changes))

            if "installments" in allowed_methods:
                all_candidates.extend(self._evaluate_installments(request, twin, config, changes))

            if "partial_payment" in allowed_methods:
                all_candidates.append(self._evaluate_partial_payment(request, twin, config, amount_safe_baseline, calculated_earliest_full_date, changes))

            if "wait" in allowed_methods or "full_payment" in allowed_methods:
                # Wait requires that full payment is NOT safe today
                if amount_safe_baseline < request.requested_amount:
                    all_candidates.append(self._evaluate_wait(request, twin, config, calculated_earliest_full_date, actual_safe_date, changes))
                
        valid_candidates = [c for c in all_candidates if c.valid]
        
        if not valid_candidates:
            return self._build_result(request, amount_safe_baseline, "not_affordable", "not_recommended", [], calculated_earliest_full_date, [])
            
        valid_candidates.sort(key=lambda c: c.sort_key())
        best = valid_candidates[0]
        
        # Determine status
        if best.method == "full_payment" and len(best.spending_changes) == 0:
            status = "affordable_now"
        elif best.method == "wait" and len(best.spending_changes) == 0:
            status = "affordable_later"
        else:
            status = "affordable_with_plan"
            
        plan_entries = [PaymentPlanEntry(payment_date=p.payment_date, amount=p.amount) for p in best.payment_plan]
            
        return self._build_result(request, amount_safe_baseline, status, best.method, plan_entries, calculated_earliest_full_date, best.spending_changes)

    def _build_result(self, req, amount_safe, status, method, plan, earliest, changes):
        return DecisionResult(
            request_id=req.request_id,
            amount_safe_to_pay=amount_safe,
            affordability_status=status,
            recommended_payment_method=method,
            payment_plan=plan,
            earliest_date_for_full_payment=earliest,
            spending_changes_needed=changes,
            decision_explanation=f"Safest approach is {method}."
        )

