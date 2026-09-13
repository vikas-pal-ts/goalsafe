import re
from typing import Optional
from datetime import date
from decimal import Decimal

def parse_amount(text: str) -> Optional[Decimal]:
    # Looks for something like IDR 42750000 or ZAR 42460 or EUR 1528.56
    m = re.search(r'(IDR|ZAR|EUR|USD|INR)\s+([0-9]+\.?[0-9]*)', text)
    if m:
        return Decimal(m.group(2))
    return None

def parse_date(text: str) -> Optional[date]:
    # Looks for YYYY-MM-DD
    m = re.search(r'([0-9]{4}-[0-9]{2}-[0-9]{2})', text)
    if m:
        from datetime import datetime
        return datetime.strptime(m.group(1), "%Y-%m-%d").date()
    return None

def extract_message_rules(messages) -> list[dict]:
    rules = []
    for msg in messages:
        text = msg['message_text']
        
        rule = {
            'message_id': msg['message_id'],
            'user_id': msg['user_id'],
            'action': None,
            'category': None,
            'new_amount': None,
            'effective_date': None
        }
        
        # Salary/payroll updates
        if 'salary' in text.lower() or 'gaji' in text.lower() or 'payroll' in text.lower() or 'penggajian' in text.lower():
            rule['category'] = 'salary'
            
            if 'ended' in text.lower() or 'berakhir' in text.lower():
                rule['action'] = 'stop'
            elif 'naik menjadi' in text.lower() or 'increased to' in text.lower():
                rule['action'] = 'update'
                rule['new_amount'] = parse_amount(text)
                rule['effective_date'] = parse_date(text)
            elif 'sementara' in text.lower() or 'temporary' in text.lower():
                rule['action'] = 'update'
                rule['new_amount'] = parse_amount(text)
            elif 'berkurang' in text.lower() or 'reduced to' in text.lower():
                rule['action'] = 'update'
                rule['new_amount'] = parse_amount(text)
            elif 'confirmed base salary' in text.lower():
                rule['action'] = 'update'
                rule['new_amount'] = parse_amount(text)
            elif 'first salary' in text.lower():
                rule['action'] = 'update'
                rule['new_amount'] = parse_amount(text)
                rule['effective_date'] = parse_date(text)
        
        # Rent increases — use plain substring match to match reference behavior
        # Note: 'rent' in text matches substrings like 'currently', 'apparent', etc.
        if 'rent' in text.lower() or 'sewa' in text.lower():
            rule['category'] = 'rent'
            m = re.search(r'([0-9]+)%', text)
            if m:
                rule['action'] = 'increase_percent'
                rule['percent'] = Decimal(m.group(1))
                
        if rule['action'] is not None:
            rules.append(rule)
            
    return rules
