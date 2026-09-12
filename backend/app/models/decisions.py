"""Pydantic v2 request and response models for the /api/analyze endpoint."""

from __future__ import annotations

from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    user_query: str = Field(..., description="Natural language financial question from the user")


# ---------------------------------------------------------------------------
# Decision
# ---------------------------------------------------------------------------

class Decision(BaseModel):
    status: Literal[
        "affordable_now",
        "affordable_with_plan",
        "affordable_later",
        "not_affordable",
    ]
    recommended_action: str
    amount_safe_to_pay: float
    currency: str
    earliest_safe_date: Optional[str] = None
    recommended_payment_method: Literal[
        "full_payment",
        "partial_payment",
        "installments",
        "wait",
        "not_recommended",
    ]
    payment_plan: list[PaymentStep] = Field(default_factory=list)
    spending_changes: list[SpendingChange] = Field(default_factory=list)


class PaymentStep(BaseModel):
    payment_date: str
    amount: float
    currency: str
    label: str


class SpendingChange(BaseModel):
    action: Literal["stop", "reduce_to"]
    category: str
    event_id: str
    current_amount: float
    new_amount: Optional[float] = None
    currency: str


# ---------------------------------------------------------------------------
# Financial snapshot
# ---------------------------------------------------------------------------

class UpcomingObligation(BaseModel):
    name: str
    amount: float
    currency: str
    due_date: str
    category: str
    is_protected: bool


class FinancialSnapshot(BaseModel):
    available_balance: float
    currency: str
    minimum_balance: float
    liquidity_horizon_days: int
    projected_lowest_balance: float
    lowest_balance_date: str
    confirmed_income_next_30_days: float
    upcoming_obligations: list[UpcomingObligation]


# ---------------------------------------------------------------------------
# Scenarios
# ---------------------------------------------------------------------------

class Scenario(BaseModel):
    id: str
    label: str
    description: str
    payment_summary: str
    is_safe: bool
    safety_icon: str  # "✅" | "⚠️" | "❌"
    remaining_buffer: float
    buffer_currency: str
    liquidity_days: int
    goal_impact: str  # e.g. "+3 months"
    is_recommended: bool


# ---------------------------------------------------------------------------
# Educational resources
# ---------------------------------------------------------------------------

class EducationalResource(BaseModel):
    id: str
    title: str
    creator: str
    duration: str
    url: str
    reason: str
    topic: str


# ---------------------------------------------------------------------------
# Full response
# ---------------------------------------------------------------------------

class AnalyzeResponse(BaseModel):
    request_id: str
    user_query: str
    decision: Decision
    financial_snapshot: FinancialSnapshot
    scenarios: list[Scenario]
    explanation: str
    educational_resources: list[EducationalResource]
