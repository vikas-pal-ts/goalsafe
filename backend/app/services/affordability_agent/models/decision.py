from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Literal

AffordabilityStatus = Literal[
    "affordable_now",
    "affordable_with_plan",
    "affordable_later",
    "not_affordable"
]

PaymentMethod = Literal[
    "full_payment",
    "partial_payment",
    "installments",
    "wait",
    "not_recommended"
]

@dataclass(frozen=True)
class PaymentPlanEntry:
    payment_date: date
    amount: Decimal

@dataclass(frozen=True)
class SpendingChange:
    action: Literal["stop", "reduce_to"]
    event_id: str
    new_amount: Decimal | None = None

    def __str__(self) -> str:
        if self.action == "stop":
            return f"stop:{self.event_id}"
        # Formatting decimal to string precisely
        amt_str = f"{self.new_amount:.2f}"
        if amt_str.endswith(".00"):
            amt_str = amt_str[:-3]
        return f"reduce_to:{self.event_id}:{amt_str}"

@dataclass(frozen=True)
class DecisionResult:
    request_id: str
    amount_safe_to_pay: Decimal
    affordability_status: AffordabilityStatus
    recommended_payment_method: PaymentMethod
    payment_plan: list[PaymentPlanEntry] = field(default_factory=list)
    earliest_date_for_full_payment: date | None = None
    spending_changes_needed: list[SpendingChange] = field(default_factory=list)
    decision_explanation: str = ""
    
    @property
    def payment_plan_str(self) -> str:
        if not self.payment_plan:
            return "none"
        formatted = []
        for p in self.payment_plan:
            amt_str = f"{p.amount:.2f}"
            if amt_str.endswith(".00"):
                amt_str = amt_str[:-3]
            formatted.append(f"{p.payment_date.isoformat()}:{amt_str}")
        return "|".join(formatted)

    @property
    def spending_changes_str(self) -> str:
        if not self.spending_changes_needed:
            return "none"
        return "|".join(str(change) for change in self.spending_changes_needed)
