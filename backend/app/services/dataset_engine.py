import math
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.models.decisions import (
    AnalyzeRequest as APIAnalyzeRequest,
    AnalyzeResponse,
    Decision,
    PaymentStep,
    FinancialSnapshot,
    UpcomingObligation,
    Scenario,
    SpendingChange as APISpendingChange,
)
from app.services.engine import FinancialDecisionEngine
from app.services.dataset_provider import get_repository

from app.services.affordability_agent.simulator import DailyCashflowSimulator
from app.services.affordability_agent.normalization.currency import CurrencyConverter
from app.services.affordability_agent.solver import AffordabilitySolver
from app.services.affordability_agent.models.request import AffordabilityRequest
from app.services.affordability_agent.models.forecast import ForecastConfig
from app.services.affordability_agent.data.classification import is_essential_outflow, is_flexible_outflow, is_ignored_for_forecast

class HackerRankFinancialDecisionEngine(FinancialDecisionEngine):
    async def analyze(self, request: APIAnalyzeRequest) -> AnalyzeResponse:
        repo = get_repository()
        simulator = DailyCashflowSimulator(CurrencyConverter(repo.rates_df))
        solver = AffordabilitySolver(repo, simulator)
        
        req_date = date.fromisoformat(request.desired_date) if request.desired_date else date.today()
        
        # 1. Prepare solver input request
        aff_request = AffordabilityRequest(
            request_id=request.request_id,
            user_id=request.user_id,
            request_date=req_date,
            request_type="Purchase", # Assume from query or default
            requested_amount=Decimal(str(request.amount)),
            desired_completion_date=req_date,
            allows_partial_payment=True,
            request_text=request.user_query
        )
        
        # 2. Evaluate using the affordability agent
        decision_result = solver.evaluate_request_object(aff_request)
        
        # 3. Generate Snapshot
        twin = solver.twin_factory.build(request.user_id, req_date)
        profile = twin.profile
        
        config = ForecastConfig(
            start_date=req_date,
            horizon_days=90,
            minimum_balance=profile.minimum_balance_to_keep
        )
        baseline_forecast = simulator.simulate(twin, simulator.baseline_scenario(), config)
        
        min_bal = Decimal('infinity')
        min_date = req_date
        for day in baseline_forecast.days:
            if day.closing_balance < min_bal:
                min_bal = day.closing_balance
                min_date = day.date
                
        # Calculate obligations (next 30 days)
        obligations = []
        confirmed_income = Decimal(0)
        
        events = twin.ledger.events_for_user(request.user_id)
        for ev in events:
            if is_ignored_for_forecast(ev):
                continue
            eff_date = ev.settlement_date or ev.event_date
            if req_date <= eff_date <= req_date + timedelta(days=30):
                if ev.direction == "debit":
                    is_protected = is_essential_outflow(ev, profile)
                    obligations.append(UpcomingObligation(
                        name=getattr(ev, "description", ev.category) or ev.category,
                        amount=float(ev.amount or 0),
                        currency=ev.currency or profile.home_currency,
                        due_date=eff_date.isoformat(),
                        category=ev.category,
                        is_protected=is_protected
                    ))
                elif ev.direction == "credit":
                    confirmed_income += (ev.amount or 0)
                    
        snapshot = FinancialSnapshot(
            available_balance=float(profile.current_available_balance),
            currency=profile.home_currency,
            minimum_balance=float(profile.minimum_balance_to_keep),
            liquidity_horizon_days=90,
            projected_lowest_balance=float(min_bal) if min_bal != Decimal('infinity') else float(profile.current_available_balance),
            lowest_balance_date=min_date.isoformat(),
            confirmed_income_next_30_days=float(confirmed_income),
            upcoming_obligations=obligations
        )
        
        # 4. Map Decision Result
        payment_plan = []
        for p in decision_result.payment_plan:
            payment_plan.append(PaymentStep(
                payment_date=p.payment_date.isoformat(),
                amount=float(p.amount),
                currency=profile.home_currency,
                label="Payment"
            ))
            
        spending_changes = []
        for c in decision_result.spending_changes_needed:
            ev = twin.ledger.get_event(c.event_id)
            if ev:
                spending_changes.append(APISpendingChange(
                    action=c.action,
                    category=ev.category,
                    event_id=c.event_id,
                    current_amount=float(ev.amount or 0),
                    new_amount=float(c.new_amount) if c.new_amount else 0.0,
                    currency=ev.currency or profile.home_currency
                ))
                
        api_decision = Decision(
            status=decision_result.affordability_status,
            recommended_action=decision_result.decision_explanation or "Recommended based on data.",
            amount_safe_to_pay=float(decision_result.amount_safe_to_pay),
            currency=profile.home_currency,
            earliest_safe_date=decision_result.earliest_date_for_full_payment.isoformat() if decision_result.earliest_date_for_full_payment else None,
            recommended_payment_method=decision_result.recommended_payment_method,
            payment_plan=payment_plan,
            spending_changes=spending_changes
        )
        
        # 5. Provide standard scenarios based on analysis
        scenarios = []
        # Main recommended scenario
        scenarios.append(Scenario(
            id="scenario_recommended",
            label="Recommended",
            description="The AI-recommended optimal path.",
            payment_summary=f"₹{request.amount:,.2f} via {decision_result.recommended_payment_method.replace('_', ' ')}",
            is_safe=decision_result.affordability_status in ["affordable_now", "affordable_with_plan", "affordable_later"],
            safety_icon="✅" if decision_result.affordability_status in ["affordable_now", "affordable_with_plan", "affordable_later"] else "⚠️",
            remaining_buffer=float(min_bal - profile.minimum_balance_to_keep) if min_bal != Decimal('infinity') else 0,
            buffer_currency=profile.home_currency,
            liquidity_days=90,
            goal_impact="No delay",
            is_recommended=True
        ))
        
        return AnalyzeResponse(
            request_id=request.request_id,
            user_query=request.user_query,
            decision=api_decision,
            financial_snapshot=snapshot,
            scenarios=scenarios,
            explanation=decision_result.decision_explanation,
            educational_resources=[]
        )
