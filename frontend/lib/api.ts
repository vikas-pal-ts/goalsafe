import type { AnalyzeRequest, AnalyzeResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function analyzeFinancialRequest(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<AnalyzeResponse>;
}

export async function checkHealth(): Promise<{ status: string; service: string }> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function createRequest(draft: import("./types").RequestDraft): Promise<import("./types").RequestResponse> {
  const payload = { ...draft };
  if (typeof window !== "undefined" && !("user_id" in payload)) {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) payload["user_id"] = userId;
  }

  const res = await fetch(`${API_BASE}/api/requests/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getRequest(id: string): Promise<import("./types").RequestResponse> {
  const res = await fetch(`${API_BASE}/api/requests/${id}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function updateRequest(id: string, updates: Partial<import("./types").RequestDraft>): Promise<import("./types").RequestResponse> {
  const res = await fetch(`${API_BASE}/api/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function analyzeSavedRequest(id: string): Promise<import("./types").AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/requests/${id}/analyze`, {
    method: "POST"
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listRequests(limit: number = 20, offset: number = 0, status?: string): Promise<import("./types").PaginatedRequestResponse> {
  let url = `${API_BASE}/api/requests/?limit=${limit}&offset=${offset}`;
  if (status) {
    url += `&status=${status}`;
  }
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) url += `&user_id=${encodeURIComponent(userId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getExpenses(): Promise<import("./types").ExpensesResponse> {
  let url = `${API_BASE}/api/expenses`;
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function listGoals(): Promise<import("./types").GoalListResponse> {
  let url = `${API_BASE}/api/goals`;
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function createGoal(draft: import("./types").GoalDraft): Promise<import("./types").GoalResponse> {
  const payload = { ...draft };
  if (typeof window !== "undefined" && !("user_id" in payload)) {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) payload["user_id"] = userId;
  }
  
  const res = await fetch(`${API_BASE}/api/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function updateGoal(id: string, updates: Partial<import("./types").GoalDraft>): Promise<import("./types").GoalResponse> {
  const res = await fetch(`${API_BASE}/api/goals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchHomeData(): Promise<any> {
  let url = `${API_BASE}/api/home`;
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem("moneymind_user_id");
    if (userId) url += `?user_id=${encodeURIComponent(userId)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
