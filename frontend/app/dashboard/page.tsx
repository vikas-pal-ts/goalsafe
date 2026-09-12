"use client";

import { DEMO_SNAPSHOT, DEMO_SCENARIOS } from "@/lib/mock-data";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const CASHFLOW_DAYS = [
  { day: "Sep 12", balance: 2500000 },
  { day: "Sep 17", balance: 2465000 },
  { day: "Sep 24", balance: 2443000 },
  { day: "Oct 02", balance: 2438800 },
  { day: "Oct 12", balance: 2588800 },
  { day: "Oct 14", balance: 2526800 },
  { day: "Oct 28", balance: 2491600 },
  { day: "Nov 10", balance: 2641600 },
];

const MAX_BAL = Math.max(...CASHFLOW_DAYS.map((d) => d.balance));
const MIN_BALANCE = DEMO_SNAPSHOT.minimum_balance;

export default function DashboardPage() {
  const snap = DEMO_SNAPSHOT;

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <a href="/" className="text-mm-text-muted text-sm hover:text-mm-text transition-colors">
            ← MoneyMind
          </a>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl font-700 mt-2">
            Your financial dashboard
          </h1>
          <p className="text-mm-text-secondary text-sm mt-1">Demo data · 90-day forecast window</p>
        </div>
        <a
          href="/"
          id="new-analysis-btn"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-mm-success text-[#080c14] hover:opacity-90 transition-all"
        >
          New analysis
        </a>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
        {[
          { label: "Available balance", value: formatINR(snap.available_balance), icon: "💰", color: "text-mm-success" },
          { label: "Safety buffer", value: formatINR(snap.minimum_balance), icon: "🛡️", color: "text-mm-info" },
          { label: "Liquidity horizon", value: `${snap.liquidity_horizon_days} days`, icon: "📅", color: "text-mm-text" },
          { label: "Confirmed income (30d)", value: formatINR(snap.confirmed_income_next_30_days), icon: "📈", color: "text-mm-warning" },
        ].map((m) => (
          <div key={m.label} className="mm-card p-5">
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="text-mm-text-muted text-xs mb-1">{m.label}</div>
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Cashflow chart */}
      <section className="mm-card p-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-base font-semibold mb-5">Cashflow trajectory</h2>
        <div className="relative h-40">
          {/* Minimum balance line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-mm-warning opacity-60"
            style={{ top: `${(1 - MIN_BALANCE / MAX_BAL) * 100}%` }}
          >
            <span className="absolute right-0 -top-4 text-[10px] text-mm-warning">
              Min balance {formatINR(MIN_BALANCE)}
            </span>
          </div>
          {/* Bars */}
          <div className="flex items-end justify-between h-full gap-1">
            {CASHFLOW_DAYS.map((d) => {
              const pct = (d.balance / MAX_BAL) * 100;
              const safe = d.balance >= MIN_BALANCE;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${safe ? "bg-mm-success" : "bg-mm-danger"}`}
                    style={{ height: `${pct}%`, opacity: 0.7 }}
                    title={`${d.day}: ${formatINR(d.balance)}`}
                  />
                  <span className="text-[9px] text-mm-text-muted whitespace-nowrap">{d.day.slice(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming obligations */}
      <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
        <h2 className="text-base font-semibold mb-3">Upcoming obligations</h2>
        <div className="mm-card divide-y divide-mm-border">
          {snap.upcoming_obligations.map((ob) => (
            <div key={ob.name} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ob.is_protected ? "bg-mm-danger" : "bg-mm-info"}`} />
                <div>
                  <div className="text-sm font-medium">{ob.name}</div>
                  <div className="text-xs text-mm-text-muted">
                    Due {ob.due_date} · {ob.is_protected ? "Protected" : "Flexible"}
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold">{formatINR(ob.amount)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Scenario snapshot */}
      <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
        <h2 className="text-base font-semibold mb-3">Scenario overview</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {DEMO_SCENARIOS.map((s) => (
            <div key={s.id} className={`mm-card p-4 ${s.is_recommended ? "border-mm-success" : ""}`}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">{s.label}</span>
                <span>{s.safety_icon}</span>
              </div>
              <div className="text-xs text-mm-text-muted">{s.payment_summary}</div>
              <div className="mt-3 grid grid-cols-2 gap-1 text-xs">
                <div className="text-mm-text-muted">Buffer</div>
                <div className="font-medium text-right">{formatINR(s.remaining_buffer)}</div>
                <div className="text-mm-text-muted">Liquidity</div>
                <div className="font-medium text-right">{s.liquidity_days}d</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center text-xs text-mm-text-muted pb-8">
        MoneyMind uses deterministic analysis — AI interprets, never calculates.{" "}
        <span className="text-mm-success">DEMO MODE</span>
      </div>
    </main>
  );
}
