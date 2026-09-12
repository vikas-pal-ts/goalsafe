"""
DEMO ONLY — DemoFinancialDecisionEngine

This module returns deterministic, realistic mock responses.
It does NOT perform real financial arithmetic.
It exists to validate the API contract and UI before the real solver is wired in.

Replace with HackerRankFinancialDecisionEngine for real analysis.
"""

from __future__ import annotations

import uuid
from datetime import date, timedelta

from app.models.decisions import (
    AnalyzeRequest,
    AnalyzeResponse,
    Decision,
    PaymentStep,
    FinancialSnapshot,
    UpcomingObligation,
    Scenario,
    SpendingChange,
    EducationalResource,
)
from app.services.engine import FinancialDecisionEngine


# ---------------------------------------------------------------------------
# Demo data — deterministic, representative, but NOT real analysis
# ---------------------------------------------------------------------------

_DEMO_SNAPSHOT = FinancialSnapshot(
    available_balance=2_500_000.0,
    currency="INR",
    minimum_balance=500_000.0,
    liquidity_horizon_days=74,
    projected_lowest_balance=312_000.0,
    lowest_balance_date=(date.today() + timedelta(days=41)).isoformat(),
    confirmed_income_next_30_days=150_000.0,
    upcoming_obligations=[
        UpcomingObligation(
            name="Rent",
            amount=35_000.0,
            currency="INR",
            due_date=(date.today() + timedelta(days=5)).isoformat(),
            category="housing",
            is_protected=True,
        ),
        UpcomingObligation(
            name="Home Loan EMI",
            amount=22_000.0,
            currency="INR",
            due_date=(date.today() + timedelta(days=12)).isoformat(),
            category="debt_repayment",
            is_protected=True,
        ),
        UpcomingObligation(
            name="Utilities",
            amount=4_200.0,
            currency="INR",
            due_date=(date.today() + timedelta(days=20)).isoformat(),
            category="utilities",
            is_protected=True,
        ),
        UpcomingObligation(
            name="Grocery budget",
            amount=12_000.0,
            currency="INR",
            due_date=(date.today() + timedelta(days=30)).isoformat(),
            category="groceries",
            is_protected=True,
        ),
    ],
)

_DEMO_EDUCATIONAL_RESOURCES: list[EducationalResource] = [
    EducationalResource(
        id="edu_01",
        title="How to Know When You Can Actually Afford a Big Purchase",
        creator="Ankur Warikoo",
        duration="12 min",
        url="https://www.youtube.com/watch?v=example1",
        reason="Directly addresses your question about affording a large purchase from savings.",
        topic="big_purchase",
    ),
    EducationalResource(
        id="edu_02",
        title="Emergency Fund: Why You Need It Before Any Big Goal",
        creator="Labour Law Advisor",
        duration="9 min",
        url="https://www.youtube.com/watch?v=example2",
        reason="Explains why a minimum balance matters before committing to large expenses.",
        topic="emergency_fund",
    ),
    EducationalResource(
        id="edu_03",
        title="EMI vs Lump Sum: Which Is Smarter?",
        creator="CA Rachana Phadke Ranade",
        duration="15 min",
        url="https://www.youtube.com/watch?v=example3",
        reason="Helps you evaluate installment vs full-payment for your scenario.",
        topic="payment_strategy",
    ),
]

_DEMO_SCENARIOS: list[Scenario] = [
    Scenario(
        id="scenario_buy_today",
        label="Buy today",
        description="Pay the full amount immediately from savings.",
        payment_summary="₹20,00,000 today",
        is_safe=False,
        safety_icon="⚠️",
        remaining_buffer=210_000.0,
        buffer_currency="INR",
        liquidity_days=21,
        goal_impact="+3 months",
        is_recommended=False,
    ),
    Scenario(
        id="scenario_wait_30",
        label="Wait 30 days",
        description="Pay the full amount after 30 days once the next salary credit arrives.",
        payment_summary="₹20,00,000 on " + (date.today() + timedelta(days=30)).strftime("%b %d"),
        is_safe=True,
        safety_icon="✅",
        remaining_buffer=640_000.0,
        buffer_currency="INR",
        liquidity_days=82,
        goal_impact="+1 month",
        is_recommended=True,
    ),
    Scenario(
        id="scenario_installment",
        label="Installments",
        description="Split into three equal monthly payments.",
        payment_summary="₹5,00,000 / month × 3",
        is_safe=True,
        safety_icon="✅",
        remaining_buffer=580_000.0,
        buffer_currency="INR",
        liquidity_days=74,
        goal_impact="No delay",
        is_recommended=False,
    ),
]


# ---------------------------------------------------------------------------
# Engine implementation
# ---------------------------------------------------------------------------

class DemoFinancialDecisionEngine(FinancialDecisionEngine):
    """
    DEMO ONLY — returns realistic deterministic mock responses.
    Does not perform real financial arithmetic.
    """

    async def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        query_lower = request.user_query.lower()

        # Very simple keyword-based routing for demo variety
        if any(w in query_lower for w in ["house", "home", "property", "flat", "apartment"]):
            decision = Decision(
                status="affordable_later",
                recommended_action="Wait 30 days until your next salary credit increases your safe balance.",
                amount_safe_to_pay=500_000.0,
                currency="INR",
                earliest_safe_date=(date.today() + timedelta(days=30)).isoformat(),
                recommended_payment_method="wait",
                payment_plan=[
                    PaymentStep(
                        payment_date=(date.today() + timedelta(days=30)).isoformat(),
                        amount=2_000_000.0,
                        currency="INR",
                        label="Full payment after next salary",
                    )
                ],
                spending_changes=[],
            )
            explanation = (
                "Buying today would reduce your balance to ₹3,12,000 — well below your ₹5,00,000 safety buffer. "
                "After your next salary credit of ₹1,50,000 on "
                + (date.today() + timedelta(days=30)).strftime("%B %d")
                + ", your projected balance is ₹6,40,000, which safely clears your buffer. "
                "Waiting 30 days is the safest option."
            )
        elif any(w in query_lower for w in ["laptop", "phone", "gadget", "computer", "device"]):
            decision = Decision(
                status="affordable_now",
                recommended_action="Safe to pay the full amount today.",
                amount_safe_to_pay=80_000.0,
                currency="INR",
                earliest_safe_date=date.today().isoformat(),
                recommended_payment_method="full_payment",
                payment_plan=[
                    PaymentStep(
                        payment_date=date.today().isoformat(),
                        amount=80_000.0,
                        currency="INR",
                        label="Full payment today",
                    )
                ],
                spending_changes=[],
            )
            explanation = (
                "Your current balance of ₹25,00,000 comfortably covers ₹80,000 while keeping ₹24,20,000 available. "
                "After all projected 90-day obligations, your balance remains ₹5,60,000 — above your ₹5,00,000 safety buffer. "
                "It is safe to pay today."
            )
        elif any(w in query_lower for w in ["car", "vehicle", "bike", "scooter"]):
            decision = Decision(
                status="affordable_with_plan",
                recommended_action="Use installments: ₹1,50,000/month for 5 months.",
                amount_safe_to_pay=350_000.0,
                currency="INR",
                earliest_safe_date=(date.today() + timedelta(days=90)).isoformat(),
                recommended_payment_method="installments",
                payment_plan=[
                    PaymentStep(
                        payment_date=(date.today() + timedelta(days=i * 30)).isoformat(),
                        amount=150_000.0,
                        currency="INR",
                        label=f"Installment {i}",
                    )
                    for i in range(1, 6)
                ],
                spending_changes=[],
            )
            explanation = (
                "Paying the full vehicle cost today would breach your safety buffer. "
                "A 5-month installment plan of ₹1,50,000/month fits safely within your income and obligations, "
                "maintaining a projected minimum balance of ₹5,20,000 throughout."
            )
        else:
            decision = Decision(
                status="affordable_now",
                recommended_action="Safe to pay the full amount today.",
                amount_safe_to_pay=200_000.0,
                currency="INR",
                earliest_safe_date=date.today().isoformat(),
                recommended_payment_method="full_payment",
                payment_plan=[
                    PaymentStep(
                        payment_date=date.today().isoformat(),
                        amount=200_000.0,
                        currency="INR",
                        label="Full payment today",
                    )
                ],
                spending_changes=[],
            )
            explanation = (
                "Based on your financial snapshot, this expense is within your safe capacity today. "
                "Your projected balance remains above your ₹5,00,000 minimum buffer throughout the 90-day forecast."
            )

        return AnalyzeResponse(
            request_id=str(uuid.uuid4()),
            user_query=request.user_query,
            decision=decision,
            financial_snapshot=_DEMO_SNAPSHOT,
            scenarios=_DEMO_SCENARIOS,
            explanation=explanation,
            educational_resources=_DEMO_EDUCATIONAL_RESOURCES,
        )
