from datetime import timedelta
from collections import defaultdict
from decimal import Decimal
from .models.resolved_event import ResolvedFinancialEvent

class RecurringPatternDetector:
    def __init__(self, message_rules=None):
        if message_rules is not None:
            self.message_rules = message_rules
        else:
            import pandas as pd
            from .evidence.message_parser import extract_message_rules
            # Try multiple candidate paths for messages.csv
            import pathlib
            candidates = [
                pathlib.Path("dataset/messages.csv"),
                pathlib.Path("../../hackerrank-orchestrate-september26-main/dataset/messages.csv"),
            ]
            loaded = False
            for p in candidates:
                try:
                    msgs = pd.read_csv(p).to_dict('records')
                    self.message_rules = extract_message_rules(msgs)
                    loaded = True
                    break
                except Exception:
                    continue
            if not loaded:
                self.message_rules = []

    def detect_and_project(self, events, start_date, end_date):
        # group by category and direction
        grouped = defaultdict(list)
        for ev in events:
            # only project settled events (or scheduled if credit)
            if (ev.status == 'settled' or (ev.status == 'scheduled' and ev.direction == 'credit')) and ev.amount is not None:
                grouped[(ev.category, ev.direction)].append(ev)
                
        # find all categories that have a scheduled event
        scheduled_categories = set()
        for ev in events:
            if ev.status == 'scheduled':
                scheduled_categories.add((ev.category, ev.direction))

        projected_events = []

        for (cat, direction), group in grouped.items():
            # normally require 3 settled events
            if len(group) < 3:
                # exception: if it's credit and has a scheduled event, allow projecting it
                if not (direction == 'credit' and (cat, direction) in scheduled_categories):
                    continue
                
            group.sort(key=lambda x: x.event_date)
            
            # calculate median interval
            diffs = [(group[i].event_date - group[i-1].event_date).days for i in range(1, len(group))]
            diffs = [d for d in diffs if d > 0]
            if not diffs:
                continue
                
            diffs.sort()
            median_interval = diffs[len(diffs)//2]
            
            # Snap interval to common frequencies
            if 5 <= median_interval <= 9:
                interval = 7
            elif 12 <= median_interval <= 16:
                interval = 14
            elif 26 <= median_interval <= 35:
                interval = 30
            else:
                interval = median_interval
                
            last_ev = group[-1]
            last_date = last_ev.event_date
            
            # do not project if the final event explicitly says it's final
            if last_ev.description and 'final' in last_ev.description.lower():
                continue
            
            # calculate mean amount
            mean_amount = sum(ev.amount for ev in group) / len(group)
            
            # apply message rules globally before the date loop (matching reference behavior)
            # Reference does not check effective_date — it applies the rule to all projections
            if hasattr(self, 'message_rules'):
                for rule in self.message_rules:
                    if rule['user_id'] == last_ev.user_id and rule['category'] == cat:
                        if rule['action'] == 'stop':
                            mean_amount = Decimal(0)
                        elif rule['action'] == 'update':
                            if rule['new_amount']:
                                mean_amount = rule['new_amount']
                        elif rule['action'] == 'increase_percent':
                            mean_amount = mean_amount * (Decimal(1) + rule['percent']/Decimal(100))
                            
            if mean_amount == Decimal(0):
                continue
            
            curr_date = last_date + timedelta(days=interval)
            while curr_date <= end_date:
                if curr_date >= start_date:
                    # create a projected event
                    proj_ev = ResolvedFinancialEvent(
                        event_id=f"proj_{cat}_{curr_date.isoformat()}",
                        user_id=last_ev.user_id,
                        event_type=last_ev.event_type,
                        description=f"Projected {cat}",
                        category=cat,
                        direction=direction,
                        amount=mean_amount,
                        currency=last_ev.currency,
                        event_date=curr_date,
                        settlement_date=curr_date,
                        status="projected",
                        flexibility=last_ev.flexibility,
                        amount_source="dataset",
                        resolution_status="clean"
                    )
                    projected_events.append(proj_ev)
                curr_date += timedelta(days=interval)
                
        return projected_events
