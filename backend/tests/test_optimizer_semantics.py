import pytest
from decimal import Decimal
from datetime import date, timedelta
from typing import List, Optional

# We will test the Candidate class and ranking logic here.
# Since we haven't rewritten optimizer.py yet, we'll write the tests we expect to pass.

def test_candidate_ranking():
    from app.services.affordability_agent.optimizer import Candidate
    
    # 1. No spending changes preferred
    c_no_change = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="z", valid=True)
    c_change = Candidate(method="full_payment", payment_plan=[], spending_changes=[1], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="z", valid=True)
    assert c_no_change.sort_key() < c_change.sort_key()
    
    # 2. Method priority: installments beats partial_payment (same changes)
    c_install = Candidate(method="installments", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("150"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=3, option_id="z", valid=True)
    c_partial = Candidate(method="partial_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,5), completion_date=date(2020,1,5), num_payments=2, option_id="a", valid=True)
    assert c_install.sort_key() < c_partial.sort_key()
    
    # 3. Start earlier (same method)
    c_early = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,5), completion_date=date(2020,1,5), num_payments=1, option_id="z", valid=True)
    c_late = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="z", valid=True)
    assert c_early.sort_key() < c_late.sort_key()
    
    # 4. Fewer payments (same method, same start/end)
    c_few = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="z", valid=True)
    c_many = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=3, option_id="z", valid=True)
    assert c_few.sort_key() < c_many.sort_key()
    
    # 5. Lowest option id (same method, same start/end/payments)
    c_opt_a = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="a", valid=True)
    c_opt_b = Candidate(method="full_payment", payment_plan=[], spending_changes=[], total_amount_paid=Decimal("100"), start_date=date(2020,1,10), completion_date=date(2020,1,10), num_payments=1, option_id="b", valid=True)
    assert c_opt_a.sort_key() < c_opt_b.sort_key()

