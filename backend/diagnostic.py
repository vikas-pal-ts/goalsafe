import os
import sys
import csv
from collections import Counter
from decimal import Decimal
from datetime import timedelta, date

from app.services.dataset_provider import get_repository, CANONICAL_USER_ID
from app.services.affordability_agent.data.twin_factory import FinancialTwinFactory
from app.services.affordability_agent.recurring import RecurringPatternDetector
from app.api.routes.expenses import list_expenses

def run_diagnostic():
    repo = get_repository()
    
    events_raw = repo.events_df.to_dict("records")
    print(f"1. Total rows in financial_events.csv: {len(events_raw)}")
    
    user_ids = set(e["user_id"] for e in events_raw)
    print(f"2. Number of distinct user_ids: {len(user_ids)}")
    print(f"3. Selected canonical user_id: {CANONICAL_USER_ID}")
    
    user_events = repo.get_events(CANONICAL_USER_ID)
    print(f"4. Number of events for canonical user: {len(user_events)}")
    
    debit_events = [e for e in user_events if e.direction == "debit"]
    print(f"5. Number of expense/debit events for canonical user: {len(debit_events)}")
    
    print(f"6. Number of settled expense events: {len([e for e in debit_events if e.status == 'settled'])}")
    print(f"7. Number of scheduled expense events: {len([e for e in debit_events if e.status == 'scheduled'])}")
    print(f"8. Number of pending expense events: {len([e for e in debit_events if e.status == 'pending'])}")
    print(f"9. Number of cancelled/failed expense events: {len([e for e in debit_events if e.status in ('cancelled', 'failed')])}")
    
    print(f"10. Number of fixed expenses: {len([e for e in debit_events if e.flexibility == 'fixed'])}")
    print(f"11. Number of reducible expenses: {len([e for e in debit_events if e.flexibility == 'reducible'])}")
    print(f"12. Number of stoppable expenses: {len([e for e in debit_events if e.flexibility == 'stoppable'])}")
    print(f"13. Number of reducible_or_stoppable expenses: {len([e for e in debit_events if e.flexibility == 'reducible_or_stoppable'])}")
    
    # Calculate recurring candidates (categories that get projected)
    detector = RecurringPatternDetector()
    if user_events:
        today = max(e.settlement_date or e.event_date for e in user_events)
    else:
        today = date.today()
        
    past_events = [e for e in user_events if e.event_date < today]
    projected = detector.detect_and_project(past_events, today, today + timedelta(days=90))
    recurring_cats = set(e.category for e in projected)
    
    recurring_candidates = [e for e in debit_events if e.category in recurring_cats]
    one_time_candidates = [e for e in debit_events if e.category not in recurring_cats]
    
    print(f"14. Number of recurring candidates (historical events in recurring categories): {len(recurring_candidates)}")
    print(f"15. Number of one-time candidates: {len(one_time_candidates)}")
    
    res = list_expenses()
    print(f"16. Number of records finally returned by /api/expenses: {len(res.items)}")
    
if __name__ == "__main__":
    run_diagnostic()
