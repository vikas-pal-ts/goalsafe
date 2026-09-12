/**
 * Mock data for GoalSafe demo UI.
 * All numbers are representative; no real financial analysis.
 */
import type {
  FinancialSnapshot,
  Scenario,
  EducationalResource,
  AnalyzeResponse,
} from "./types";

export const DEMO_SNAPSHOT: FinancialSnapshot = {
  available_balance: 2_500_000,
  currency: "INR",
  minimum_balance: 500_000,
  liquidity_horizon_days: 74,
  projected_lowest_balance: 312_000,
  lowest_balance_date: "2026-10-23",
  confirmed_income_next_30_days: 150_000,
  upcoming_obligations: [
    { name: "Rent", amount: 35_000, currency: "INR", due_date: "2026-09-17", category: "housing", is_protected: true },
    { name: "Home Loan EMI", amount: 22_000, currency: "INR", due_date: "2026-09-24", category: "debt_repayment", is_protected: true },
    { name: "Utilities", amount: 4_200, currency: "INR", due_date: "2026-10-02", category: "utilities", is_protected: true },
    { name: "Grocery budget", amount: 12_000, currency: "INR", due_date: "2026-10-12", category: "groceries", is_protected: true },
  ],
};

export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "scenario_buy_today",
    label: "Buy today",
    description: "Pay the full amount immediately from savings.",
    payment_summary: "₹20,00,000 today",
    is_safe: false,
    safety_icon: "⚠️",
    remaining_buffer: 210_000,
    buffer_currency: "INR",
    liquidity_days: 21,
    goal_impact: "+3 months",
    is_recommended: false,
  },
  {
    id: "scenario_wait_30",
    label: "Wait 30 days",
    description: "Pay the full amount after 30 days once the next salary credit arrives.",
    payment_summary: "₹20,00,000 on Oct 12",
    is_safe: true,
    safety_icon: "✅",
    remaining_buffer: 640_000,
    buffer_currency: "INR",
    liquidity_days: 82,
    goal_impact: "+1 month",
    is_recommended: true,
  },
  {
    id: "scenario_installment",
    label: "Installments",
    description: "Split into three equal monthly payments.",
    payment_summary: "₹5,00,000 / month × 3",
    is_safe: true,
    safety_icon: "✅",
    remaining_buffer: 580_000,
    buffer_currency: "INR",
    liquidity_days: 74,
    goal_impact: "No delay",
    is_recommended: false,
  },
];

export const DEMO_EDUCATIONAL_RESOURCES: EducationalResource[] = [
  {
    id: "edu_01",
    title: "How to Know When You Can Actually Afford a Big Purchase",
    creator: "Ankur Warikoo",
    duration: "12 min",
    url: "#",
    reason: "Directly addresses your question about affording a large purchase from savings.",
    topic: "big_purchase",
  },
  {
    id: "edu_02",
    title: "Emergency Fund: Why You Need It Before Any Big Goal",
    creator: "Labour Law Advisor",
    duration: "9 min",
    url: "#",
    reason: "Explains why a minimum balance matters before committing to large expenses.",
    topic: "emergency_fund",
  },
  {
    id: "edu_03",
    title: "EMI vs Lump Sum: Which Is Smarter?",
    creator: "CA Rachana Phadke Ranade",
    duration: "15 min",
    url: "#",
    reason: "Helps you evaluate installment vs full-payment for your scenario.",
    topic: "payment_strategy",
  },
];

export const DEMO_RESPONSE: AnalyzeResponse = {
  request_id: "demo-001",
  user_query: "I have ₹25 lakh in savings and want to buy a house.",
  decision: {
    status: "affordable_later",
    recommended_action: "Wait 30 days until your next salary credit increases your safe balance.",
    amount_safe_to_pay: 500_000,
    currency: "INR",
    earliest_safe_date: "2026-10-12",
    recommended_payment_method: "wait",
    payment_plan: [
      { payment_date: "2026-10-12", amount: 2_000_000, currency: "INR", label: "Full payment after next salary" },
    ],
    spending_changes: [],
  },
  financial_snapshot: DEMO_SNAPSHOT,
  scenarios: DEMO_SCENARIOS,
  explanation:
    "Buying today would reduce your balance to ₹3,12,000 — well below your ₹5,00,000 safety buffer. After your next salary credit of ₹1,50,000 on October 12, your projected balance is ₹6,40,000, which safely clears your buffer. Waiting 30 days is the safest option.",
  educational_resources: DEMO_EDUCATIONAL_RESOURCES,
};

/** Format a number as Indian currency */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const QUICK_SCENARIOS = [
  { label: "Buy a house", icon: "🏠", query: "I have ₹25 lakh in savings and want to buy a house." },
  { label: "Buy a car", icon: "🚗", query: "I want to buy a car worth ₹8 lakh." },
  { label: "Buy a laptop", icon: "💻", query: "I want to buy a laptop for ₹80,000." },
  { label: "Travel abroad", icon: "✈️", query: "I'm planning a Europe trip worth ₹2.5 lakh." },
  { label: "Invest in SIP", icon: "📈", query: "I want to start a monthly SIP of ₹10,000." },
  { label: "Pay off debt", icon: "💳", query: "I want to prepay my personal loan of ₹3 lakh." },
];
