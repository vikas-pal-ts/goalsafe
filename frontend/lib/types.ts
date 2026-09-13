/**
 * TypeScript types for GoalSafe API — mirrors Pydantic models in backend.
 * Do not use `any`.
 */

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface AnalyzeRequest {
  user_query: string;
}

// ---------------------------------------------------------------------------
// Decision
// ---------------------------------------------------------------------------

export type AffordabilityStatus =
  | "affordable_now"
  | "affordable_with_plan"
  | "affordable_later"
  | "not_affordable";

export type PaymentMethod =
  | "full_payment"
  | "partial_payment"
  | "installments"
  | "wait"
  | "not_recommended";

export interface PaymentStep {
  payment_date: string;
  amount: number;
  currency: string;
  label: string;
}

export interface SpendingChange {
  action: "stop" | "reduce_to";
  category: string;
  event_id: string;
  current_amount: number;
  new_amount: number | null;
  currency: string;
}

export interface Decision {
  status: AffordabilityStatus;
  recommended_action: string;
  amount_safe_to_pay: number;
  currency: string;
  earliest_safe_date: string | null;
  recommended_payment_method: PaymentMethod;
  payment_plan: PaymentStep[];
  spending_changes: SpendingChange[];
}

// ---------------------------------------------------------------------------
// Financial snapshot
// ---------------------------------------------------------------------------

export interface UpcomingObligation {
  name: string;
  amount: number;
  currency: string;
  due_date: string;
  category: string;
  is_protected: boolean;
}

export interface FinancialSnapshot {
  available_balance: number;
  currency: string;
  minimum_balance: number;
  liquidity_horizon_days: number;
  projected_lowest_balance: number;
  lowest_balance_date: string;
  confirmed_income_next_30_days: number;
  upcoming_obligations: UpcomingObligation[];
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface Scenario {
  id: string;
  label: string;
  description: string;
  payment_summary: string;
  is_safe: boolean;
  safety_icon: string;
  remaining_buffer: number;
  buffer_currency: string;
  liquidity_days: number;
  goal_impact: string;
  is_recommended: boolean;
}

// ---------------------------------------------------------------------------
// Educational resources
// ---------------------------------------------------------------------------

export interface EducationalResource {
  id: string;
  title: string;
  creator: string;
  duration: string;
  url: string;
  reason: string;
  topic: string;
}

// ---------------------------------------------------------------------------
// Full response
// ---------------------------------------------------------------------------

export interface AnalyzeResponse {
  request_id: string;
  user_query: string;
  decision: Decision;
  financial_snapshot: FinancialSnapshot;
  scenarios: Scenario[];
  explanation: string;
  educational_resources: EducationalResource[];
}

// ---------------------------------------------------------------------------
// Request Management
// ---------------------------------------------------------------------------

export type RequestStatus = "draft" | "ready_for_review" | "submitted" | "analyzed";

export interface RequestDraft {
  description: string;
  request_type: string;
  amount: string;
  desired_date: string;
  deadline?: string | null;
  payment_preference: string;
  additional_context?: string | null;
  user_id?: string;
}

export interface RequestResponse {
  id: string;
  description: string;
  request_type: string;
  amount: string;
  desired_date: string;
  deadline: string | null;
  payment_preference: string;
  additional_context: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  decision_data?: AnalyzeResponse | null;
}

export interface PaginatedRequestResponse {
  items: RequestResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  currency: string;
  frequency: string;
  next_date: string;
  flexibility: string;
  is_protected: boolean;
}

export interface ExpenseSummary {
  total_relevant: number;
  protected_total: number;
  flexible_total: number;
}

export interface ExpensesResponse {
  items: ExpenseItem[];
  summary: ExpenseSummary;
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export interface GoalDraft {
  name: string;
  target_amount: string;
  current_amount?: string;
  target_date: string;
  priority?: "high" | "medium" | "low";
  status?: "active" | "completed" | "paused";
  user_id?: string;
}

export interface GoalResponse {
  id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  target_date: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GoalListResponse {
  items: GoalResponse[];
}
