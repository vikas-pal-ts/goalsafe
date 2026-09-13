from decimal import Decimal

import pandas as pd


class CurrencyConverter:
    def __init__(self, exchange_rates_df: pd.DataFrame):
        self.rates = exchange_rates_df

    def convert_to_home_currency(self, amount: Decimal, from_currency: str, home_currency: str, rate_date: str) -> Decimal:
        if from_currency == home_currency:
            return amount
        subset = self.rates[(self.rates['from_currency'] == from_currency) &
                              (self.rates['to_currency'] == home_currency)]
        rate_row = subset[subset['rate_date'] <= rate_date]
        if rate_row.empty:
            rate_row = subset
            
        if rate_row.empty:
            raise ValueError(f"Missing exchange rate: {from_currency} to {home_currency} on {rate_date}")
            
        rate_row = rate_row.sort_values('rate_date').iloc[-1]
        rate = Decimal(str(rate_row['rate']))
        return amount * rate
