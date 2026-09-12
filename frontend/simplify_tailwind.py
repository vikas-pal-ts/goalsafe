import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # regex to match tailwind arbitrary values using our new tokens
    # e.g. text-[var(--mm-text-muted)] -> text-mm-text-muted
    new_content = re.sub(r'([a-z]+)-\[var\(--mm-([a-zA-Z0-9-]+)\)\]', r'\1-mm-\2', content)
    
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
