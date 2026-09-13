"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShoppingBag, Plane, GraduationCap, UsersRound, CreditCard, 
  ChartNoAxesCombined, CalendarDays, CalendarRange, ShieldCheck, 
  ArrowRight, Sparkles, WalletCards, Shield, Target, LockKeyhole, 
  Info, ArrowLeft 
} from "lucide-react";
import { createRequest, getRequest, updateRequest, analyzeSavedRequest } from "../../lib/api";

function NewRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const requestIdParam = searchParams.get("requestId");
  
  const [step, setStep] = useState(stepParam === "2" ? 2 : 1);
  const [requestId, setRequestId] = useState<string | null>(requestIdParam);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const [description, setDescription] = useState("");
  const [requestType, setRequestType] = useState("Purchase");
  const [amount, setAmount] = useState("80000");
  const [desiredDate, setDesiredDate] = useState("2025-09-15");
  const [deadline, setDeadline] = useState("");
  const [paymentPreference, setPaymentPreference] = useState("No preference");
  const [additionalContext, setAdditionalContext] = useState("");

  useEffect(() => {
    setStep(stepParam === "2" ? 2 : 1);
  }, [stepParam]);

  useEffect(() => {
    if (requestIdParam) {
      setRequestId(requestIdParam);
      setIsLoading(true);
      setLoadingText("Loading request...");
      getRequest(requestIdParam).then(data => {
        setDescription(data.description);
        setRequestType(data.request_type);
        setAmount(data.amount.toString());
        setDesiredDate(data.desired_date);
        setDeadline(data.deadline || "");
        setPaymentPreference(data.payment_preference);
        setAdditionalContext(data.additional_context || "");
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [requestIdParam]);

  const saveDraftData = async () => {
    const payload = {
      description: description || "New request",
      request_type: requestType,
      amount: amount.replace(/,/g, ''),
      desired_date: desiredDate,
      deadline: deadline || null,
      payment_preference: paymentPreference,
      additional_context: additionalContext || null,
    };
    if (requestId) {
      return await updateRequest(requestId, payload);
    } else {
      return await createRequest(payload);
    }
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    setLoadingText("Saving...");
    try {
      const data = await saveDraftData();
      setRequestId(data.id);
    } catch (e) {
      console.error(e);
      alert("Failed to save draft");
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep2 = async () => {
    setIsLoading(true);
    setLoadingText("Saving...");
    try {
      const data = await saveDraftData();
      router.push(`/new-request?step=2&requestId=${data.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const goToStep1 = () => {
    if (requestId) {
      router.push(`/new-request?requestId=${requestId}`);
    } else {
      router.push("/new-request");
    }
  };

  const handleAnalyze = async () => {
    if (!requestId) return;
    setIsLoading(true);
    setLoadingText("Analyzing your request...");
    try {
      await analyzeSavedRequest(requestId);
      router.push(`/analyze?requestId=${requestId}`);
    } catch (e) {
      console.error(e);
      alert("Analysis failed");
      setIsLoading(false);
    }
  };

  const requestTypes = [
    { id: "Purchase", icon: ShoppingBag },
    { id: "Travel", icon: Plane },
    { id: "Education", icon: GraduationCap },
    { id: "Family transfer", icon: UsersRound },
    { id: "Debt repayment", icon: CreditCard },
    { id: "Investment", icon: ChartNoAxesCombined },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted">{loadingText}</p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <section className="">
        <div className="">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium text-teal uppercase tracking-[.12em]">Review request</p>
              <h1 className="mt-2 text-[30px] font-semibold tracking-[-.025em]">Ready for MoneyMind to decide?</h1>
              <p className="mt-2 text-[14px] text-muted">Review the details below before running the financial decision analysis.</p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-[minmax(0,620px)_270px] gap-5 items-start">
            <div className="space-y-4">
              <div className="bg-white border border-line rounded-[16px] shadow-card p-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-[11px] text-muted">Your request</p>
                    <h2 className="mt-2 text-[19px] font-semibold">{description || "Can I afford a new laptop for ₹80,000?"}</h2>
                  </div>
                  <span className="p-[10px] rounded-full bg-[#F1F4F5] text-[10px] font-medium">{requestType}</span>
                </div>
                <div className="mt-5 grid grid-cols-3 border-t border-line pt-4">
                  <div>
                    <p className="text-[10px] text-muted">Amount</p>
                    <p className="mt-1 text-[13px] font-semibold">₹{amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Desired date</p>
                    <p className="mt-1 text-[13px] font-semibold">{desiredDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted">Payment preference</p>
                    <p className="mt-1 text-[13px] font-semibold">{paymentPreference}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-line rounded-[16px] shadow-card p-6">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold">Financial information MoneyMind will use</h2>
                    <p className="mt-1 text-[11px] text-muted">Only information relevant to this decision is considered.</p>
                  </div>
                  <LockKeyhole className="w-[17px] text-muted" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl border border-line p-3.5">
                    <p className="text-[10px] text-muted">Available balance</p>
                    <p className="mt-1 text-[13px] font-semibold">₹1,25,000</p>
                  </div>
                  <div className="rounded-xl border border-line p-3.5">
                    <p className="text-[10px] text-muted">Monthly income</p>
                    <p className="mt-1 text-[13px] font-semibold">₹1,25,000</p>
                  </div>
                  <div className="rounded-xl border border-line p-3.5">
                    <p className="text-[10px] text-muted">Monthly expenses</p>
                    <p className="mt-1 text-[13px] font-semibold">₹25,000</p>
                  </div>
                  <div className="rounded-xl border border-line p-3.5">
                    <p className="text-[10px] text-muted">Minimum safe balance</p>
                    <p className="mt-1 text-[13px] font-semibold">₹1,00,000</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-blueSoft border border-[#E6ECFA] p-3.5 flex gap-3">
                  <Info className="w-4 text-blue shrink-0" />
                  <p className="text-[10px] leading-[16px] text-body">MoneyMind will also consider relevant recurring events, confirmed income, payment options and your financial goals.</p>
                </div>
              </div>
              <div className="bg-white border border-line rounded-[16px] shadow-card p-6">
                <h2 className="text-[15px] font-semibold">What happens next?</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#FAFBFB] border border-line p-3.5">
                    <span className="w-7 h-7 rounded-full bg-mint text-teal flex items-center justify-center text-[11px] font-semibold">1</span>
                    <p className="mt-3 text-[11px] font-medium">Analyze cash flow</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Forecast upcoming income and expenses.</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFBFB] border border-line p-3.5">
                    <span className="w-7 h-7 rounded-full bg-mint text-teal flex items-center justify-center text-[11px] font-semibold">2</span>
                    <p className="mt-3 text-[11px] font-medium">Compare options</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Test payment plans against your safety buffer.</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFBFB] border border-line p-3.5">
                    <span className="w-7 h-7 rounded-full bg-mint text-teal flex items-center justify-center text-[11px] font-semibold">3</span>
                    <p className="mt-3 text-[11px] font-medium">Give a decision</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Explain what is safe and why.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-1">
                <button onClick={goToStep1} className="h-11 px-4 rounded-lg border border-line bg-white text-[12px] font-medium text-body flex items-center gap-2 hover:bg-slate-50 transition">
                  <ArrowLeft className="w-4" />Edit request
                </button>
                <button onClick={handleAnalyze} className="h-11 px-5 rounded-lg bg-teal text-white text-[12px] font-semibold flex items-center gap-2 hover:bg-tealDark transition">
                  Analyze my request <Sparkles className="w-4" />
                </button>
              </div>
            </div>
            <aside className="space-y-4">
              <div className="bg-white border border-line rounded-[14px] shadow-card p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-[17px] text-teal" />
                  <h2 className="text-[13px] font-semibold">Decision principles</h2>
                </div>
                <ul className="mt-4 space-y-3 text-[10px] leading-[16px] text-body">
                  <li>• Essential expenses remain covered.</li>
                  <li>• Minimum safe balance is protected.</li>
                  <li>• All planned payments must be possible by their dates.</li>
                  <li>• The decision considers a 90-day financial forecast.</li>
                </ul>
              </div>
              <div className="rounded-[14px] bg-white border border-line p-5">
                <p className="text-[11px] font-semibold">Your data stays contextual</p>
                <p className="mt-2 text-[10px] leading-[16px] text-muted">Messages and images are treated as supporting context, not as trusted financial records.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  // STEP 1
  return (
    <section className="">
      <div className="">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-teal uppercase tracking-[.12em]">New decision</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-.025em]">What are you planning?</h1>
            <p className="mt-2 text-[14px] text-muted">Tell MoneyMind what you're considering. We'll check it against your cash flow and upcoming commitments.</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-[minmax(0,620px)_270px] gap-5 items-start">
          <div className="bg-white border border-line rounded-[16px] shadow-card p-6">
            <label className="text-[15px] font-semibold">Describe the expense</label>
            <p className="mt-1 text-[11px] text-muted">Use your own words. MoneyMind will identify the amount and timing where possible.</p>
            <div className="mt-4 rounded-xl border border-[#DCE5E9] bg-[#FBFCFC] focus-within:border-[#A8D2C8] focus-within:ring-4 focus-within:ring-[#EAF5F2]">
              <textarea 
                rows={4} 
                className="w-full resize-none bg-transparent outline-none px-4 pt-4 text-[14px] placeholder:text-[#93A1AE]" 
                placeholder="e.g. I want to buy a laptop for ₹80,000 by September 15."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              ></textarea>
              <div className="px-4 pb-3 flex justify-between">
                <span className="text-[10px] text-muted">Include destination, deadline or who you're paying if relevant.</span>
                <span className="text-[10px] text-muted">{description.length} / 500</span>
              </div>
            </div>
            <div className="mt-7">
              <p className="text-[12px] font-semibold">Request type</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {requestTypes.map((rt) => (
                  <button 
                    key={rt.id}
                    onClick={() => setRequestType(rt.id)}
                    className={`h-10 rounded-lg border text-[11px] flex items-center justify-center gap-2 transition ${
                      requestType === rt.id 
                        ? 'border-[#BBDDD5] bg-mint text-teal font-medium' 
                        : 'border-line text-body hover:bg-slate-50'
                    }`}
                  >
                    <rt.icon className="w-[17px] h-[17px]" />{rt.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold">Amount</label>
                <div className="mt-2 h-11 rounded-lg border border-line flex items-center px-3.5 focus-within:border-[#A8D2C8] focus-within:ring-2 focus-within:ring-[#EAF5F2]">
                  <span className="text-[13px] text-muted mr-2">₹</span>
                  <input 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full outline-none text-[13px] bg-transparent" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold">Desired date</label>
                <div className="mt-2 h-11 rounded-lg border border-line flex items-center px-3.5 focus-within:border-[#A8D2C8] focus-within:ring-2 focus-within:ring-[#EAF5F2]">
                  <input 
                    value={desiredDate} 
                    onChange={(e) => setDesiredDate(e.target.value)}
                    type="date"
                    className="w-full outline-none text-[13px] bg-transparent" 
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold">Deadline <span className="font-normal text-muted">(optional)</span></label>
                <div className="mt-2 h-11 rounded-lg border border-line flex items-center px-3.5 focus-within:border-[#A8D2C8] focus-within:ring-2 focus-within:ring-[#EAF5F2]">
                  <input 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    type="date"
                    className="w-full outline-none text-[12px] placeholder:text-muted bg-transparent" 
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold">Payment preference</label>
                <select 
                  value={paymentPreference}
                  onChange={(e) => setPaymentPreference(e.target.value)}
                  className="mt-2 w-full h-11 rounded-lg border border-line px-3.5 outline-none text-[12px] text-body bg-transparent focus:border-[#A8D2C8] focus:ring-2 focus:ring-[#EAF5F2]"
                >
                  <option value="No preference">No preference</option>
                  <option value="Pay in full">Pay in full</option>
                  <option value="Installments">Installments</option>
                  <option value="Wait if safer">Wait if safer</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[12px] font-semibold">Additional context <span className="font-normal text-muted">(optional)</span></label>
              <input 
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Anything else MoneyMind should know?" 
                className="mt-2 w-full h-11 rounded-lg border border-line px-3.5 outline-none text-[12px] placeholder:text-muted bg-transparent focus:border-[#A8D2C8] focus:ring-2 focus:ring-[#EAF5F2]" 
              />
            </div>
            <div className="mt-6 rounded-xl bg-blueSoft border border-[#E6ECFA] px-4 py-3.5 flex gap-3">
              <ShieldCheck className="w-[18px] text-blue shrink-0" />
              <p className="text-[11px] leading-[17px] text-body">
                <b className="text-ink">How this works.</b> MoneyMind checks your cash flow, safety buffer, goals and available payment options before making a recommendation.
              </p>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={handleSaveDraft} className="h-11 px-4 rounded-lg border border-line text-[12px] font-medium text-body hover:bg-slate-50 transition">
                Save as draft
              </button>
              <button onClick={goToStep2} className="h-11 px-5 rounded-lg bg-teal text-white text-[12px] font-semibold flex items-center gap-2 hover:bg-tealDark transition">
                Continue to review <ArrowRight className="w-4" />
              </button>
            </div>
          </div>
          <aside className="space-y-4">
            <div className="bg-white border border-line rounded-[14px] shadow-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-[17px] text-teal" />
                <h2 className="text-[13px] font-semibold">MoneyMind checks</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2.5">
                  <WalletCards className="w-4 text-teal shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Cash flow</p>
                    <p className="text-[10px] text-muted">Income and upcoming payments</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Shield className="w-4 text-teal shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Safety buffer</p>
                    <p className="text-[10px] text-muted">Your protected minimum balance</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Target className="w-4 text-teal shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Goals</p>
                    <p className="text-[10px] text-muted">How the choice affects priorities</p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <CreditCard className="w-4 text-teal shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium">Payment options</p>
                    <p className="text-[10px] text-muted">Full pay, installments or wait</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[14px] bg-mintSoft border border-[#E5F0ED] p-5">
              <p className="text-[11px] font-semibold text-teal">Tip</p>
              <p className="mt-2 text-[11px] leading-[17px] text-body">
                You don't need to know every detail. Start with what you're planning and MoneyMind can help structure the request.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default function NewRequest() {
  return (
    <Suspense fallback={<div className="">Loading...</div>}>
      <NewRequestForm />
    </Suspense>
  );
}
