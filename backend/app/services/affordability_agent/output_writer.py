import csv
from pathlib import Path
from .models.decision import DecisionResult

class OutputWriter:
    def __init__(self, output_path: str):
        self.output_path = Path(output_path)
        
    def write_results(self, results: list[DecisionResult]):
        with open(self.output_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                "request_id",
                "amount_safe_to_pay",
                "affordability_status",
                "recommended_payment_method",
                "payment_plan",
                "earliest_date_for_full_payment",
                "spending_changes_needed",
                "decision_explanation"
            ])
            for r in results:
                # Format amount_safe_to_pay
                amt_safe_str = f"{r.amount_safe_to_pay:.2f}"
                if amt_safe_str.endswith(".00"):
                    amt_safe_str = amt_safe_str[:-3]
                    
                earliest_date_str = r.earliest_date_for_full_payment.isoformat() if r.earliest_date_for_full_payment else ""
                
                writer.writerow([
                    r.request_id,
                    amt_safe_str,
                    r.affordability_status,
                    r.recommended_payment_method,
                    r.payment_plan_str,
                    earliest_date_str,
                    r.spending_changes_str,
                    r.decision_explanation
                ])
