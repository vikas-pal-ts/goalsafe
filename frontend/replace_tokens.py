import os
import glob

replacements = {
    "gs-bg": "mm-bg",
    "gs-surface": "mm-surface",
    "gs-surface-2": "mm-surface-2",
    "gs-border": "mm-border",
    "gs-border-hover": "mm-border-hover",
    "gs-green": "mm-success",
    "gs-amber": "mm-warning",
    "gs-red": "mm-danger",
    "gs-blue": "mm-info",
    "gs-text-primary": "mm-text",
    "gs-text-secondary": "mm-text-secondary",
    "gs-text-muted": "mm-text-muted",
    "gs-card": "mm-card",
    "gs-mesh": "mm-mesh",
    "gs-gradient-text": "mm-gradient-text",
    "GoalSafe": "MoneyMind"
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('/Users/vikaspal/Desktop/Hackerrank/buy_or_wait/goalsafe/frontend/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.css'):
            process_file(os.path.join(root, file))

for root, _, files in os.walk('/Users/vikaspal/Desktop/Hackerrank/buy_or_wait/goalsafe/frontend/components'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.css'):
            process_file(os.path.join(root, file))
