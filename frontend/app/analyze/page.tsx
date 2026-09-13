"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { analyzeFinancialRequest } from "@/lib/api";
import { useUser } from "@/components/providers/UserProvider";
import type { AnalyzeResponse, AffordabilityStatus } from "@/lib/types";
import { DEMO_RESPONSE } from "@/lib/mock-data";
import { 
  ArrowLeft, Hourglass, Check, 
  AlertTriangle, Calendar, Wallet, Play, Info, Flag, ChevronRight
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Status helpers                                                        */
/* ------------------------------------------------------------------ */
const STATUS_CONFIG: Record<
  AffordabilityStatus,
  { label: string; className: string; icon: any }
> = {
  affordable_now:      { label: "AFFORDABLE NOW",        className: "border-[#BFDCD5] bg-mintSoft text-teal",   icon: Check },
  affordable_with_plan:{ label: "AFFORDABLE WITH PLAN",  className: "border-[#C5D3F0] bg-blueSoft text-blue",  icon: Calendar },
  affordable_later:    { label: "AFFORDABLE LATER",      className: "border-[#F0DFC0] bg-amberSoft text-amber", icon: Hourglass },
  not_affordable:      { label: "NOT AFFORDABLE",        className: "border-[#F0C0C0] bg-red-50 text-red-600",   icon: AlertTriangle },
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function ScenarioCard({ s }: { s: AnalyzeResponse["scenarios"][0] }) {
  const isRecommended = s.is_recommended;
  const isNotRecommended = s.label.toLowerCase().includes("today") && !isRecommended; // simplistic mapping based on HTML demo
  const isAlternative = !isRecommended && !isNotRecommended;

  let wrapperClasses = "bg-white border border-line rounded-[12px] shadow-card transition duration-180 ease-out p-5 hover:-translate-y-[2px] hover:shadow-panel";
  let badgeClasses = "";
  let badgeLabel = "";
  let badgeIcon = Calendar;
  let accentText = "";

  if (isRecommended) {
    wrapperClasses = "transition duration-180 ease-out p-5 rounded-[12px] border border-[#BFDCD5] bg-mintSoft shadow-panel hover:-translate-y-[2px]";
    badgeClasses = "bg-mint text-teal";
    badgeLabel = "Recommended";
    badgeIcon = Check;
    accentText = "text-teal";
  } else if (isNotRecommended) {
    badgeClasses = "bg-amberSoft text-amber";
    badgeLabel = "Not recommended";
    badgeIcon = AlertTriangle;
    accentText = "text-amber";
  } else {
    badgeClasses = "bg-blueSoft text-blue";
    badgeLabel = "Alternative";
    badgeIcon = Calendar;
    accentText = "text-blue";
  }

  const Icon = badgeIcon;

  return (
    <article className={wrapperClasses}>
      <div className="flex items-start justify-between gap-3">
        <span className={`w-9 h-9 rounded-[9px] flex items-center justify-center ${badgeClasses}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-[.07em] ${accentText}`}>
          {badgeLabel}
        </span>
      </div>
      <h3 className="mt-5 mb-0 text-[17px] font-semibold text-ink">{s.label}</h3>
      <p className="mt-2 min-h-[45px] text-[13px] leading-[1.55] text-body">{s.description}</p>
      
      <div className={`mt-5 pt-4 border-t ${isRecommended ? 'border-[#D3E8E2]' : 'border-line'} text-[18px] font-semibold text-ink`}>
        {s.payment_summary}
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Safety buffer</div>
          <div className={`mt-1 text-[13px] font-semibold ${isRecommended || isNotRecommended ? accentText : 'text-ink'}`}>
            {formatINR(s.remaining_buffer)}
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Liquidity</div>
          <div className={`mt-1 text-[13px] font-semibold ${isRecommended || isNotRecommended ? accentText : 'text-ink'}`}>
            {s.liquidity_days} days
          </div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Main page content                                                     */
/* ------------------------------------------------------------------ */

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const requestId = searchParams.get("requestId") ?? "";

  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const { selectedUser } = useUser();

  useEffect(() => {
    if (!selectedUser) return;
    if (requestId) {
      setLoading(true);
      import("@/lib/api").then(({ getRequest }) => {
        getRequest(requestId)
          .then((res) => {
            if (res.decision_data) {
              setData(res.decision_data);
            } else {
              setData(DEMO_RESPONSE);
            }
          })
          .catch(() => setData(DEMO_RESPONSE))
          .finally(() => setLoading(false));
      });
    } else if (query) {
      setLoading(true);
      analyzeFinancialRequest({ user_query: query })
        .then(setData)
        .catch(() => setData(DEMO_RESPONSE)) // graceful fallback to demo
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [query, requestId, selectedUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
        <div className="text-muted text-sm font-medium">Analyzing your financial plan…</div>
      </div>
    );
  }

  const d = data ?? DEMO_RESPONSE;
  const statusCfg = STATUS_CONFIG[d.decision.status] || STATUS_CONFIG["not_affordable"];
  const snap = d.financial_snapshot;
  const StatusIcon = statusCfg.icon;

  return (
    <div className=" w-full">
      {/* 2. QUESTION AREA */}
      <section>
        {/* <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[13px] font-medium text-muted hover:text-ink transition-colors bg-transparent border-0 p-0 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />Back
        </button> */}
        <div className="">
          <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Your question</div>
          <p className="mt-3 mb-0 text-[22px] leading-[1.35] font-semibold tracking-[-.018em] text-ink">
            “{d.user_query}”
          </p>
        </div>
      </section>

      {/* 3. DECISION HERO & 4. DECISION METRICS */}
      <section className="mt-11 max-w-[1020px]">
        <div className={`inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[11px] font-semibold tracking-[.075em] ${statusCfg.className}`}>
          <StatusIcon className="w-4 h-4" />
          {statusCfg.label}
        </div>
        <h1 className="mt-6 mb-0 max-w-[980px] text-[32px] md:text-[47px] leading-[1.1] font-medium tracking-[-.035em] text-ink">
          {d.decision.recommended_action}
        </h1>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 border-y border-line">
          <div className="py-6 sm:pr-7">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Safe to pay today</div>
            <div className="mt-2 text-ink text-[30px] leading-[1.1] font-semibold tracking-[-.02em]">{formatINR(d.decision.amount_safe_to_pay)}</div>
          </div>
          {d.decision.earliest_safe_date ? (
            <div className="py-6 sm:px-7 sm:border-l border-t sm:border-t-0 border-line">
              <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Earliest safe date</div>
              <div className="mt-2 text-ink text-[26px] sm:text-[30px] leading-[1.1] font-semibold tracking-[-.02em]">{d.decision.earliest_safe_date}</div>
            </div>
          ) : (
            <div className="py-6 sm:px-7 sm:border-l border-t sm:border-t-0 border-line">
              <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Earliest safe date</div>
              <div className="mt-2 text-ink text-[26px] sm:text-[30px] leading-[1.1] font-semibold tracking-[-.02em]">-</div>
            </div>
          )}
          <div className="py-6 sm:pl-7 sm:border-l border-t sm:border-t-0 border-line">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Method</div>
            <div className="mt-2 text-ink text-[30px] leading-[1.1] font-semibold tracking-[-.02em] capitalize">{d.decision.recommended_payment_method.replace(/_/g, " ")}</div>
          </div>
        </div>
      </section>

      {/* 5. WHY? */}
      <section className="mt-[44px] md:mt-[58px]">
        <h2 className="m-0 text-ink text-[22px] leading-[1.25] font-semibold">Why?</h2>
        <p className="mt-5 max-w-[900px] text-[18px] leading-[1.65] text-body whitespace-pre-wrap">
          {d.explanation}
        </p>
        <div className="mt-6 flex items-center gap-2 text-[12px] text-muted">
          <Info className="w-4 h-4" />
          Decision based on your current balance, scheduled income, upcoming expenses and 90-day cash-flow forecast.
        </div>
      </section>

      {/* 6. YOUR FINANCIAL PICTURE */}
      <section className="mt-[44px] md:mt-[58px]">
        <h2 className="m-0 text-ink text-[22px] leading-[1.25] font-semibold">Your financial picture</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:divide-x divide-line border-y border-line">
          <div className="py-5 md:pr-5 border-b md:border-b-0 border-line">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Available balance</div>
            <div className="mt-2 text-[25px] font-semibold text-ink">{formatINR(snap.available_balance)}</div>
          </div>
          <div className="py-5 md:px-5 border-b md:border-b-0 border-line">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Safety buffer</div>
            <div className="mt-2 text-[25px] font-semibold text-ink">{formatINR(snap.minimum_balance)}</div>
          </div>
          <div className="py-5 md:px-5 border-b md:border-b-0 border-line">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Liquidity horizon</div>
            <div className="mt-2 text-[25px] font-semibold text-ink">{snap.liquidity_horizon_days} days</div>
          </div>
          <div className="py-5 md:pl-5">
            <div className="text-[12px] font-semibold tracking-[.075em] uppercase text-muted">Projected low</div>
            <div className="mt-2 text-[25px] font-semibold text-ink">{formatINR(snap.projected_lowest_balance)}</div>
          </div>
        </div>
      </section>

      {/* 7. SCENARIO COMPARISON */}
      <section className="mt-[44px] md:mt-[58px]">
        <h2 className="m-0 text-ink text-[22px] leading-[1.25] font-semibold">Scenario comparison</h2>
        <p className="mt-2 text-[14px] text-muted">Three ways to approach the same purchase.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {d.scenarios.map((s) => <ScenarioCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* 8. FINANCIAL TIMELINE */}
      <section className="mt-[44px] md:mt-[58px]">
        <h2 className="m-0 text-ink text-[22px] leading-[1.25] font-semibold">Financial timeline</h2>
        <p className="mt-2 text-[14px] text-muted">The next 90 days considered in the decision.</p>
        <div className="bg-white border border-line rounded-[12px] shadow-card mt-6 p-6 sm:p-7">
          <div className="relative">
            <div className="absolute left-[18px] top-3 bottom-3 w-px bg-line"></div>
            
            <div className="relative flex gap-5 pb-8">
              <div className="z-10 w-9 h-9 shrink-0 rounded-full border border-line bg-white flex items-center justify-center text-muted">
                <Wallet className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="m-0 text-[15px] font-semibold text-ink">Current balance</h3>
                  <span className="text-[12px] text-muted">Today</span>
                </div>
                <div className="mt-1 text-[18px] font-semibold text-ink">{formatINR(snap.available_balance)}</div>
              </div>
            </div>

            {snap.upcoming_obligations.slice(0, 1).map((ob) => (
              <div key={ob.name} className="relative flex gap-5 pb-8">
                <div className="z-10 w-9 h-9 shrink-0 rounded-full border border-line bg-white flex items-center justify-center text-muted">
                  <Calendar className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="m-0 text-[15px] font-semibold text-ink">{ob.name}</h3>
                    <span className="text-[12px] text-muted">{ob.due_date}</span>
                  </div>
                  <div className="mt-1 text-[16px] font-semibold text-ink">{formatINR(ob.amount)}</div>
                  <p className="mt-1 mb-0 text-[12px] text-muted">Scheduled expense included in the forecast.</p>
                </div>
              </div>
            ))}

            {d.decision.payment_plan[0] && (
              <div className="relative flex gap-5 pb-8">
                <div className="z-10 w-9 h-9 shrink-0 rounded-full border border-[#BFDCD5] bg-mint text-teal flex items-center justify-center">
                  <Check className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="m-0 text-[15px] font-semibold text-ink">Recommended payment</h3>
                    <span className="text-[12px] text-teal font-medium">{d.decision.payment_plan[0].payment_date}</span>
                  </div>
                  <div className="mt-1 text-[18px] font-semibold text-ink">{formatINR(d.decision.payment_plan[0].amount)}</div>
                  <p className="mt-1 mb-0 text-[12px] text-muted">Next salary credit makes the payment compatible with your safety buffer.</p>
                </div>
              </div>
            )}

            <div className="relative flex gap-5">
              <div className="z-10 w-9 h-9 shrink-0 rounded-full border border-line bg-white flex items-center justify-center text-muted">
                <Flag className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="m-0 text-[15px] font-semibold text-ink">90-day horizon</h3>
                  <span className="text-[12px] text-muted">Forecast complete</span>
                </div>
                <p className="mt-1 mb-0 text-[12px] text-muted">The decision accounts for the projected cash-flow horizon.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. SECOND OPINION */}
      <section className="mt-[44px] md:mt-[58px]">
        <div className="border-t border-line pt-10">
          <h2 className="m-0 text-ink text-[22px] leading-[1.25] font-semibold">Want a second opinion?</h2>
          <p className="mt-2 text-[14px] text-muted">See how experienced financial educators think about this kind of decision.</p>
          <div className="mt-6 space-y-3">
            {d.educational_resources.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-line rounded-[12px] shadow-card transition duration-180 ease-out hover:-translate-y-[2px] hover:shadow-panel hover:border-[#cfdcdf] hover:bg-[#fbfdfd] flex items-center gap-4 p-5 no-underline">
                <span className="w-9 h-9 shrink-0 rounded-[9px] bg-blueSoft text-blue flex items-center justify-center">
                  <Play className="fill-current w-[18px] h-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{r.title}</span>
                  <span className="mt-1 block text-[12px] text-muted">{r.creator} · {r.duration}</span>
                  {r.reason && <span className="mt-2 block text-[12px] text-body">{r.reason}</span>}
                </span>
                <ChevronRight className="shrink-0 w-5 h-5 text-muted" />
              </a>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-[11px] text-muted">
            <Info className="w-4 h-4" />
            Educational content is informational only and does not determine MoneyMind’s decision.
          </div>
        </div>
      </section>

    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
        <div className="text-muted text-sm font-medium">Loading decision…</div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}
