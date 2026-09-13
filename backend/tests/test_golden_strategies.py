import pytest
import os
import pathlib
import sys
from decimal import Decimal
from datetime import date

from app.services.affordability_agent.data.repository import DataRepository
from app.services.affordability_agent.solver import AffordabilitySolver
from app.services.affordability_agent.simulator import DailyCashflowSimulator
from app.services.affordability_agent.normalization.currency import CurrencyConverter
import pandas as pd

@pytest.fixture(scope="session")
def repo():
    dataset_root = (pathlib.Path(__file__).parent.parent.parent.parent / "hackerrank-orchestrate-september26-main" / "dataset").resolve()
    return DataRepository(dataset_root=dataset_root)

@pytest.fixture(scope="session")
def solver(repo):
    dataset_root = (pathlib.Path(__file__).parent.parent.parent.parent / "hackerrank-orchestrate-september26-main" / "dataset").resolve()
    rates_df = pd.read_csv(dataset_root / "exchange_rates.csv", dtype=str)
    fx = CurrencyConverter(rates_df)
    simulator = DailyCashflowSimulator(fx)
    return AffordabilitySolver(repo, simulator)

def test_request_01(solver):
    res = solver.evaluate_request("request_01", is_sample=True)
    assert res.affordability_status == "affordable_now"
    assert res.recommended_payment_method == "full_payment"
    assert len(res.payment_plan) == 1
    assert not res.spending_changes_needed

def test_request_02(solver):
    res = solver.evaluate_request("request_02", is_sample=True)
    assert res.affordability_status == "affordable_with_plan"
    assert res.recommended_payment_method == "installments"
    assert len(res.payment_plan) == 3
    assert not res.spending_changes_needed

def test_request_03(solver):
    res = solver.evaluate_request("request_03", is_sample=True)
    assert res.affordability_status == "affordable_later"
    assert res.recommended_payment_method == "wait"
    assert len(res.payment_plan) == 1
    assert not res.spending_changes_needed

def test_request_06(solver):
    res = solver.evaluate_request("request_06", is_sample=True)
    assert res.affordability_status == "affordable_with_plan"
    assert res.recommended_payment_method == "full_payment"
    assert len(res.spending_changes_needed) == 1
    assert res.spending_changes_needed[0].action == "stop"
    assert res.spending_changes_needed[0].event_id == "event_476"
    assert res.amount_safe_to_pay == Decimal("603.30")

def test_request_19(solver):
    # Just ensure it doesn't crash and returns partial payment if available
    res = solver.evaluate_request("request_19", is_sample=True)
    pass
