import { Send, Laptop, Plane, CreditCard, UsersRound, WalletCards, CalendarDays, PiggyBank, CalendarCheck2, ChevronRight, House, Sparkles, Check, CalendarRange, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column */}
      <section className="min-w-0">
        <h1 className="text-[30px] leading-9 font-semibold tracking-[-.025em]">Hi Vikas! 👋</h1>
        <p className="mt-2 text-[14px] leading-[21px] text-muted">
          Ask about any expense and get a personalized recommendation<br className="hidden sm:block" />
          based on your finances, goals and preferences.
        </p>

        {/* Question composer */}
        <div className="mt-6 bg-white border border-line rounded-[14px] shadow-card p-5">
          <h2 className="text-[16px] font-semibold">What do you want to know?</h2>

          <div className="mt-4 relative">
            <div className="min-h-[82px] rounded-[11px] border border-[#DCE5E9] bg-white px-4 py-4 text-[13px] text-muted leading-5">
              e.g. Can I afford this laptop? / Should I take this trip now?
            </div>
            <button className="absolute right-3 bottom-3 w-8 h-8 rounded-full bg-[#EFF3F6] text-body flex items-center justify-center hover:bg-[#E7EDF0] transition" aria-label="Submit question">
              <Send className="w-[14px] h-[14px]" />
            </button>
          </div>

          <h3 className="mt-5 text-[13px] font-semibold">Quick examples</h3>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <button className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <Laptop /><span>Can I afford this laptop?</span>
            </button>
            <button className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <Plane /><span>Is it safe to travel now?</span>
            </button>
            <button className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
              <CreditCard /><span>Should I pay my credit card bill?</span>
            </button>
            <button className="quick-chip h-10 px-3.5 rounded-full border border-[#E2E9EC] bg-white text-[12px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
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
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">₹1,25,000</p>
              <p className="mt-1 text-[10px] text-muted">(in hand)</p>
            </div>

            <div className="border-l border-line pl-4 pr-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-blueSoft text-[#4A72C4] flex items-center justify-center">
                <CalendarDays />
              </div>
              <p className="mt-3 text-[10px] text-muted">Monthly Expenses</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">₹25,000</p>
              <p className="mt-1 text-[10px] text-muted">(estimated)</p>
            </div>

            <div className="border-l border-line pl-4 pr-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-mint text-teal flex items-center justify-center">
                <PiggyBank />
              </div>
              <p className="mt-3 text-[10px] text-muted">Savings</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">₹27,00,000</p>
              <p className="mt-1 text-[10px] text-muted">(current)</p>
            </div>

            <div className="border-l border-line pl-4 min-w-0">
              <div className="metric-icon w-8 h-8 rounded-full bg-blueSoft text-[#4A72C4] flex items-center justify-center">
                <CalendarCheck2 />
              </div>
              <p className="mt-3 text-[10px] text-muted">Next Salary</p>
              <p className="mt-1 text-[17px] font-semibold tracking-[-.01em]">₹1,25,000</p>
              <p className="mt-1 text-[10px] text-muted">(monthly)</p>
            </div>
          </div>
        </div>

        {/* Recent requests */}
        <div className="mt-6 flex items-center justify-between px-1">
          <h2 className="text-[16px] font-semibold">Recent requests</h2>
          <a className="text-[12px] font-medium text-blue hover:underline" href="#">View all</a>
        </div>

        <div className="mt-3 bg-white border border-line rounded-[14px] shadow-card overflow-hidden">
          <div className="h-[68px] flex items-center px-4 border-b border-line">
            <div className="w-10 h-10 rounded-full bg-[#F4F6F7] flex items-center justify-center text-body">
              <Laptop className="w-[17px] h-[17px]" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-[12px] font-medium">Can I afford this laptop?</p>
              <p className="text-[10px] text-muted mt-1">Aug 10, 2025</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#E9F7F0] text-[#3D9673] text-[10px] font-medium whitespace-nowrap">Affordable now</span>
            <span className="ml-6 text-[#73879B]"><ChevronRight className="w-4 h-4" /></span>
          </div>

          <div className="h-[68px] flex items-center px-4 border-b border-line">
            <div className="w-10 h-10 rounded-full bg-[#F4F6F7] flex items-center justify-center text-body">
              <Plane className="w-[17px] h-[17px]" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-[12px] font-medium">Is it safe to travel now?</p>
              <p className="text-[10px] text-muted mt-1">Aug 05, 2025</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-amberSoft text-amber text-[10px] font-medium whitespace-nowrap">Wait for better timing</span>
            <span className="ml-6 text-[#73879B]"><ChevronRight className="w-4 h-4" /></span>
          </div>

          <div className="h-[68px] flex items-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#F4F6F7] flex items-center justify-center text-body">
              <House className="w-[17px] h-[17px]" />
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <p className="text-[12px] font-medium">Should I take a home loan?</p>
              <p className="text-[10px] text-muted mt-1">Jul 28, 2025</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-blueSoft text-blue text-[10px] font-medium whitespace-nowrap">Affordable with plan</span>
            <span className="ml-6 text-[#73879B]"><ChevronRight className="w-4 h-4" /></span>
          </div>
        </div>
      </section>

      {/* Recommendation panel */}
      <section className="bg-white border border-line rounded-[14px] shadow-panel p-4 self-start">
        <div className="rounded-xl bg-mintSoft border border-[#ECF4F2] p-4">
          <div className="flex items-center gap-3">
            <span className="text-teal">
              <Sparkles className="w-5 h-5" />
            </span>
            <span className="text-[15px] font-semibold">AI Recommendation</span>
          </div>
          <h2 className="mt-4 text-[24px] leading-8 font-semibold tracking-[-.025em]">Can I afford this laptop?</h2>
          <p className="mt-2 text-[12px] text-muted">Request&nbsp; • &nbsp;₹80,000&nbsp; • &nbsp;Due: 2025-09-15</p>
        </div>

        <div className="mt-4 rounded-xl bg-[#EAF7F3] border border-[#E1F0EC] p-5">
          <div className="flex gap-4">
            <div className="shrink-0 w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-teal">You can afford it — with a plan</h3>
              <p className="mt-4 text-[12px] leading-5 text-body">
                Your current balance is not enough to pay the full amount,<br className="hidden lg:block" />
                but you can cover it with a structured payment plan<br className="hidden lg:block" />
                without affecting your essential expenses.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 divide-y divide-line">
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Amount safe to pay now</span>
            <span className="text-[12px] text-body font-medium text-right">₹25,000</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Affordability status</span>
            <span className="px-3 py-1.5 rounded-full bg-mint text-teal text-[10px] font-medium">Affordable with a plan</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Recommended payment method</span>
            <span className="text-[12px] text-body font-medium text-right">EMI (3 months)</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Payment plan</span>
            <span className="text-[11px] text-body font-medium text-right leading-5">₹25,000 now + 2 × ₹27,500<br />(Dec 10, 2025 · Jan 10, 2026)</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Earliest date for full payment</span>
            <span className="text-[12px] text-body font-medium text-right">2026-01-10</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-center py-3">
            <span className="text-[12px] text-muted">Spending changes needed</span>
            <span className="text-[11px] text-body font-medium text-right leading-5">Reduce dining out (₹5,000/month)<br />&amp; pause subscriptions (₹1,000/month)</span>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-blueSoft border border-[#E9EFFB] p-5">
          <div className="flex gap-3">
            <span className="text-blue shrink-0"><CalendarRange className="w-[18px] h-[18px]" /></span>
            <div>
              <h3 className="text-[13px] font-semibold text-blue">Why this recommendation?</h3>
              <p className="mt-3 text-[11px] leading-[17px] text-body">
                You have a stable income and enough savings to cover the initial payment and upcoming EMIs while keeping your minimum balance intact. This plan allows you to get the laptop now without compromising your other goals.
              </p>
            </div>
          </div>
        </div>

        <button className="mt-6 w-full h-[52px] rounded-[9px] bg-teal text-white text-[13px] font-semibold hover:bg-tealDark transition flex items-center justify-center gap-2">
          <span>View full plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

    </div>
  );
}
