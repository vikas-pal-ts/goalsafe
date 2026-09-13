from decimal import Decimal

from pydantic import BaseModel, field_validator


class FinancialProfile(BaseModel):
    user_id: str
    home_currency: str
    current_available_balance: Decimal
    minimum_balance_to_keep: Decimal
    financial_priorities: list[str]
    # CSV columns:
    # expense_categories_to_protect
    # expense_categories_user_is_willing_to_reduce
    # expense_categories_user_is_willing_to_stop
    protected_categories: list[str]
    reducible_categories: list[str]
    stoppable_categories: list[str]
    payment_methods_user_will_consider: list[str]
    max_installment_months: int | None = None

    @field_validator(
        "financial_priorities",
        "protected_categories",
        "reducible_categories",
        "stoppable_categories",
        "payment_methods_user_will_consider",
        mode="before",
    )
    @classmethod
    def split_pipe_delimited(cls, v: object) -> list[str]:
        if isinstance(v, str):
            if v.strip() == "":
                return []
            return [x.strip() for x in v.split("|")]
        if v is None:
            return []
        return v  # type: ignore[return-value]

    @property
    def adjustable_categories(self) -> list[str]:
        """All categories the user is willing to reduce or stop."""
        return list(dict.fromkeys(self.reducible_categories + self.stoppable_categories))
