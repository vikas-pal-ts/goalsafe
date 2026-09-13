"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Laptop, Plane, CreditCard, UsersRound, WalletCards, CalendarDays, PiggyBank, CalendarCheck2, ChevronRight, House, Sparkles, Check, CalendarRange, ArrowRight, AlertTriangle, Hourglass, Calendar } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { fetchHomeData } from "@/lib/api";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  affordable_now:      { label: "AFFORDABLE NOW",        className: "border-[#BFDCD5] bg-mintSoft text-teal",   icon: Check },
  affordable_with_plan:{ label: "AFFORDABLE WITH PLAN",  className: "border-[#C5D3F0] bg-blueSoft text-blue",  icon: Calendar },
  affordable_later:    { label: "AFFORDABLE LATER",      className: "border-[#F0DFC0] bg-amberSoft text-amber", icon: Hourglass },
  not_affordable:      { label: "NOT AFFORDABLE",        className: "border-[#F0C0C0] bg-red-50 text-red-600",   icon: AlertTriangle },
  draft:               { label: "DRAFT",                 className: "border-line bg-slate-100 text-slate-500", icon: Check },
};

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Home() {
  const router = useRouter();
  const { selectedUser } = useUser();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    fetchHomeData()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedUser]);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      router.push(`/new-request?q=${encodeURIComponent(query)}`);
    }
  };

  const handleQuickExample = (q: string) => {
    router.push(`/new-request?q=${encodeURIComponent(q)}`);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-mint flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
        <div className="text-muted text-sm font-medium">Loading your dashboard…</div>
      </div>
    );
  }

  const { user, financial_snapshot: snap, latest_decision: d, recent_requests: recent } = data;
  const statusCfg = d ? (STATUS_CONFIG[d.decision.status] || STATUS_CONFIG["not_affordable"]) : null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column */}
      <section className="min-w-0">
        <h1 className="text-[30px] leading-9 font-semibold tracking-[-.025em]">Hi {user.display_name}! 👋</h1>
        <p className="mt-2 text-[14px] leading-[21px] text-muted">
          Ask about any expense and get a personalized recommendation<br className="hidden sm:block" />
          based on your finances, goals and preferences.
        </p>

        {/* Question composer */}
        <div className="mt-6 bg-white border border-line rounded-[14px] shadow-card p-5">
          <h2 className="text-[16px] font-semibold">What do you want to know?</h2>

          <div className="mt-4 relative">
            <textarea 
              className="w-full min-h-[82px] rounded-[11px] border border-[#DCE5E9] bg-white px-4 py-4 text-[13px] text-body leading-5 outline-none resize-none focus:border-teal focus:ring-1 focus:ring-teal"
              placeholder="e.g. Can I afford this laptop? / Should I take this trip now?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            <button 
              onClick={handleSearchSubmit}
              className="absolute right-3 bottom-4 w-8 h-8 rounded-full bg-[#EFF3F6] text-body flex items-center justify-center hover:bg-[#E7EDF0] transition" 
              aria-label="Submit question"
            >
              <Send className="w-[14px] h-[14px]" />
            </button>
          </div>

          <h3 className="mt-5 text-[13px] font-semibold">Quick examples</h3>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <button onClick={() => handleQuickExample("Can I afford this laptop?")} className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <Laptop /><span>Can I afford this laptop?</span>
            </button>
            <button onClick={() => handleQuickExample("Is it safe to travel now?")} className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <Plane /><span>Is it safe to travel now?</span>
            </button>
            <button onClick={() => handleQuickExample("Should I pay my credit card bill?")} className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <CreditCard /><span>Should I pay my credit card bill?</span>
            </button>
            <button onClick={() => handleQuickExample("Can I send money to my family?")} className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <UsersRound /><span>Can I send money to my family?</span>
            </button>
          </div>
        </div>

        {/* Financial snapshot */}
        <h2 className="mt-7 mb-3 px-1 text-[16px] font-semibold">Your financial snapshot</h2>

        <div className="bg-white border border-line rounded-[14px] shadow-card px-5 py-[18px]">
          <div className="grid grid-cols-4">
            <div className="pr-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-mint text-teal flex items-center justify-center">
                <WalletCards />
              </div>
              <p className="mt-3 text-[10px] text-muted">Available Balance</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">{formatINR(snap.available_balance)}</p>
              <p className="mt-1 text-[10px] text-muted">(in hand)</p>
            </div>

            <div className="border-l border-line pl-4 pr-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-blueSoft text-[#4A72C4] flex items-center justify-center">
                <CalendarDays />
              </div>
              <p className="mt-3 text-[10px] text-muted">Monthly Expenses</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">{formatINR(snap.monthly_expenses)}</p>
              <p className="mt-1 text-[10px] text-muted">(next 30 days)</p>
            </div>

            <div className="border-l border-line pl-4 pr-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-mint text-teal flex items-center justify-center">
                <PiggyBank />
              </div>
              <p className="mt-3 text-[10px] text-muted">Safety Buffer</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">{formatINR(snap.savings)}</p>
              <p className="mt-1 text-[10px] text-muted">(target)</p>
            </div>

            <div className="border-l border-line pl-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-blueSoft text-[#4A72C4] flex items-center justify-center">
                <CalendarCheck2 />
              </div>
              <p className="mt-3 text-[10px] text-muted">Next Salary</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">{formatINR(snap.next_salary)}</p>
              <p className="mt-1 text-[10px] text-muted">(confirmed)</p>
            </div>
          </div>
        </div>

        {/* Recent requests */}
        <div className="mt-6 flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold">Recent requests</h2>
          <button onClick={() => router.push('/history')} className="text-[12px] font-medium text-blue hover:underline">View all</button>
        </div>

        <div className="mt-3 bg-white border border-line rounded-[14px] shadow-card overflow-hidden">
          {recent.length > 0 ? (
            recent.map((req: any, index: number) => {
              const Icon = req.request_type === 'Purchase' ? Laptop : (req.request_type === 'Travel' ? Plane : (req.request_type === 'Housing' ? House : CreditCard));
              const ds = req.decision_data?.decision?.status || (req.status === 'analyzed' ? 'not_affordable' : 'draft');
              const cfg = STATUS_CONFIG[ds] || STATUS_CONFIG['draft'];
              return (
                <button key={req.id} onClick={() => router.push(`/analyze?requestId=${req.id}`)} className={`w-full text-left flex items-center px-4 hover:bg-slate-50 transition min-h-[68px] ${index < recent.length - 1 ? 'border-b border-line' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-[#F4F6F7] flex items-center justify-center text-body shrink-0">
                    <Icon className="w-[17px] h-[17px]" />
                  </div>
                  <div className="ml-4 flex-1 min-w-0 pr-4">
                    <p className="text-[12px] font-medium truncate">{req.description || req.request_type}</p>
                    <p className="text-[10px] text-muted mt-1">{new Date(req.created_at).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"})}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap ${cfg.className}`}>
                    {cfg.label.toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                  </span>
                  <span className="ml-6 text-[#73879B]"><ChevronRight className="w-4 h-4" /></span>
                </button>
              );
            })
          ) : (
            <div className="h-[80px] flex items-center justify-center text-[13px] text-muted">
              Your recent requests will appear here.
            </div>
          )}
        </div>
      </section>

      {/* Recommendation panel */}
      <section className="bg-white border border-line rounded-[14px] shadow-panel p-4 self-start">
        {d ? (
          <>
            <div className="rounded-xl bg-mintSoft border border-[#ECF4F2] p-4">
              <div className="flex items-center gap-3">
                <span className="text-teal">
                  <Sparkles className="w-5 h-5" />
                </span>
                <span className="text-[15px] font-semibold">AI Recommendation</span>
              </div>
              <h2 className="mt-4 text-[24px] leading-8 font-semibold tracking-[-.025em]">{d.user_query || "Financial Question"}</h2>
              <p className="mt-2 text-[12px] text-muted">
                Request&nbsp; • &nbsp;{formatINR(d.decision.amount_safe_to_pay > 0 ? d.decision.amount_safe_to_pay : 0)}&nbsp; • &nbsp;
                Due: {d.decision.earliest_safe_date || 'N/A'}
              </p>
            </div>

            <div className={`mt-4 rounded-xl ${statusCfg?.className.replace('text', 'border')} p-5 border opacity-90`}>
              <div className="flex gap-4">
                <div className={`shrink-0 w-9 h-9 rounded-full ${statusCfg?.className.replace('border', '')} text-white flex items-center justify-center`}>
                  {statusCfg?.icon && <statusCfg.icon className="w-5 h-5 stroke-current fill-transparent" />}
                </div>
                <div>
                  <h3 className={`text-[16px] font-semibold ${statusCfg?.className.split(' ').find((c: string) => c.startsWith('text-')) || 'text-body'}`}>
                    {d.decision.recommended_action}
                  </h3>
                  <p className="mt-4 text-[12px] leading-5 text-body">
                    {d.explanation}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 divide-y divide-line">
              <div className="grid grid-cols-[1fr_auto] items-center py-3">
                <span className="text-[12px] text-muted">Amount safe to pay now</span>
                <span className="text-[12px] text-body font-medium text-right">{formatINR(d.decision.amount_safe_to_pay)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center py-3">
                <span className="text-[12px] text-muted">Affordability status</span>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-medium ${statusCfg?.className}`}>
                  {statusCfg?.label.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center py-3">
                <span className="text-[12px] text-muted">Recommended payment method</span>
                <span className="text-[12px] text-body font-medium text-right capitalize">{d.decision.recommended_payment_method.replace(/_/g, " ")}</span>
              </div>
              
              {d.decision.payment_plan && d.decision.payment_plan.length > 0 && (
                <div className="grid grid-cols-[1fr_auto] items-center py-3">
                  <span className="text-[12px] text-muted">Payment plan</span>
                  <span className="text-[11px] text-body font-medium text-right leading-5">
                    {d.decision.payment_plan.map((p: any) => `${formatINR(p.amount)} on ${p.payment_date}`).join(' + \n')}
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-[1fr_auto] items-center py-3">
                <span className="text-[12px] text-muted">Earliest date for full payment</span>
                <span className="text-[12px] text-body font-medium text-right">{d.decision.earliest_safe_date || '-'}</span>
              </div>

              {d.decision.spending_changes && d.decision.spending_changes.length > 0 && (
                <div className="grid grid-cols-[1fr_auto] items-center py-3">
                  <span className="text-[12px] text-muted">Spending changes needed</span>
                  <span className="text-[11px] text-body font-medium text-right leading-5">
                    {d.decision.spending_changes.map((c: any) => `${c.action === 'stop' ? 'Stop' : 'Reduce'} ${c.category} (to ${formatINR(c.new_amount)})`).join('\n')}
                  </span>
                </div>
              )}
            </div>

            <button onClick={() => router.push(`/analyze?requestId=${d.request_id}`)} className="mt-6 w-full h-[52px] rounded-[9px] bg-teal text-white text-[13px] font-semibold hover:bg-tealDark transition flex items-center justify-center gap-2">
              <span>View full plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-mintSoft flex items-center justify-center text-teal mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-[18px] font-semibold mb-2">No recommendations yet</h3>
            <p className="text-[13px] text-muted mb-6 max-w-[250px]">
              Ask MoneyMind about a purchase or payment to get a personalized recommendation.
            </p>
            <button onClick={() => router.push('/new-request')} className="h-[44px] px-6 rounded-lg bg-teal text-white text-[13px] font-semibold hover:bg-tealDark transition flex items-center justify-center gap-2">
              <span>New request</span>
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
