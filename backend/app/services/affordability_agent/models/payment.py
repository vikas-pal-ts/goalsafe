from decimal import Decimal

from pydantic import BaseModel


class PaymentOption(BaseModel):
    payment_option_id: str
    request_id: str
    payment_method: str
    number_of_installments: int | None = None
    days_between_payments: int | None = None
    first_payment_days_from_now: int
    financing_fee: Decimal
    total_payable_amount: Decimal
