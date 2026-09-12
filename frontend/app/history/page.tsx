"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Laptop,
  Plane,
  House,
  CreditCard,
  UsersRound,
  ChevronRight,
  Activity,
  CircleCheck,
  CalendarClock
} from "lucide-react";

type DecisionStatus = "Affordable now" | "Affordable with plan" | "Affordable later" | "Not affordable";

interface Decision {
  id: string;
  question: string;
  type: string;
  dateStr: string;
  date: Date;
  amountStr: string;
  amount: number;
  status: DecisionStatus;
  description: string;
  icon: any;
}

const DEMO_DATA: Decision[] = [
  {
    id: "1",
    question: "Can I afford this laptop?",
    type: "Purchase",
    dateStr: "10 Aug 2025",
    date: new Date("2025-08-10"),
    amountStr: "₹80,000",
    amount: 80000,
    status: "Affordable now",
    description: "Purchase · Structured payment plan",
    icon: Laptop,
  },
  {
    id: "2",
    question: "Is it safe to travel now?",
    type: "Travel",
    dateStr: "05 Aug 2025",
    date: new Date("2025-08-05"),
    amountStr: "₹25,000",
    amount: 25000,
    status: "Affordable later",
    description: "Travel · Waited for better timing",
    icon: Plane,
  },
  {
    id: "3",
    question: "Should I take a home loan?",
    type: "Housing",
    dateStr: "28 Jul 2025",
    date: new Date("2025-07-28"),
    amountStr: "₹45,00,000",
    amount: 4500000,
    status: "Affordable with plan",
    description: "Housing · Scenario comparison",
    icon: House,
  },
  {
    id: "4",
    question: "Can I repay my credit card?",
    type: "Debt",
    dateStr: "20 Jul 2025",
    date: new Date("2025-07-20"),
    amountStr: "₹18,500",
    amount: 18500,
    status: "Affordable now",
    description: "Debt repayment · Full payment",
    icon: CreditCard,
  },
  {
    id: "5",
    question: "Can I send money home?",
    type: "Family",
    dateStr: "12 Jul 2025",
    date: new Date("2025-07-12"),
    amountStr: "₹20,000",
    amount: 20000,
    status: "Affordable now",
    description: "Family transfer · Full payment",
    icon: UsersRound,
  },
];

type FilterType = "All" | "Affordable now" | "With plan" | "Later" | "Not affordable";
type SortType = "Newest first" | "Oldest first" | "Highest amount";

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("Newest first");

  const filteredAndSortedData = useMemo(() => {
    let result = DEMO_DATA;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q) ||
          item.amountStr.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filter !== "All") {
      let mappedStatus: DecisionStatus | null = null;
      if (filter === "Affordable now") mappedStatus = "Affordable now";
      if (filter === "With plan") mappedStatus = "Affordable with plan";
      if (filter === "Later") mappedStatus = "Affordable later";
      if (filter === "Not affordable") mappedStatus = "Not affordable";

      if (mappedStatus) {
        result = result.filter((item) => item.status === mappedStatus);
      }
    }

    // Sorting
    result = [...result].sort((a, b) => {
      if (sort === "Newest first") {
        return b.date.getTime() - a.date.getTime();
      } else if (sort === "Oldest first") {
        return a.date.getTime() - b.date.getTime();
      } else if (sort === "Highest amount") {
        return b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [searchQuery, filter, sort]);

  const handleRowClick = (id: string) => {
    // Placeholder navigation strategy
    router.push(`/analyze?q=${id}`);
  };

  const renderStatusBadge = (status: DecisionStatus) => {
    let classes = "";
    if (status === "Affordable now") {
      classes = "bg-mint text-teal";
    } else if (status === "Affordable with plan") {
      classes = "bg-blueSoft text-blue";
    } else if (status === "Affordable later") {
      classes = "bg-amberSoft text-amber";
    } else if (status === "Not affordable") {
      classes = "bg-red-50 text-red-600";
    }
    return (
      <span className={`w-fit px-2.5 py-1 rounded-full text-[9px] font-semibold ${classes}`}>
        {status === "Affordable with plan" ? "With a plan" : status}
      </span>
    );
  };

  return (
    <section className="min-h-screen">
      <div className="">
         {/* Summary strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Decisions this month</span>
              <Activity className="w-4 text-teal" />
            </div>
            <p className="mt-2 text-[20px] font-semibold">4</p>
            <p className="mt-1 text-[10px] text-muted">Across purchases and travel</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Most common outcome</span>
              <CircleCheck className="w-4 text-teal" />
            </div>
            <p className="mt-2 text-[15px] font-semibold text-teal">Affordable now</p>
            <p className="mt-1 text-[10px] text-muted">6 of your recent decisions</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Plans currently active</span>
              <CalendarClock className="w-4 text-blue" />
            </div>
            <p className="mt-2 text-[20px] font-semibold">2</p>
            <p className="mt-1 text-[10px] text-muted">Next payment · 10 Dec 2025</p>
          </div>
        </div>
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-teal uppercase tracking-[.12em]">Your decisions</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-.025em]">Decision history</h1>
            <p className="mt-2 text-[14px] text-muted">Review previous decisions, payment plans and what changed after each request.</p>
          </div>
          <button 
            onClick={() => router.push('/new-request')}
            className="h-10 px-4 rounded-lg bg-teal text-white text-[12px] font-semibold flex items-center gap-2 hover:bg-tealDark transition"
          >
            <Plus className="w-4" /> New request
          </button>
        </div>

        {/* Search / filter toolbar */}
        <div className="mt-8 bg-white border border-line rounded-[15px] shadow-card p-3 flex items-center gap-3">
          <div className="flex-1 h-10 rounded-lg border border-line bg-[#FBFCFC] flex items-center px-3 gap-2.5 focus-within:border-[#A8D2C8] focus-within:ring-2 focus-within:ring-[#EAF5F2]">
            <Search className="w-4 text-muted shrink-0" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[12px] placeholder:text-muted"
              placeholder="Search requests, amounts or categories..." 
            />
          </div>
          <button className="h-10 px-3 rounded-lg border border-line bg-white text-[11px] text-body flex items-center gap-2 hover:bg-slate-50 transition">
            <SlidersHorizontal className="w-4" /> Filters
          </button>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="h-10 rounded-lg border border-line bg-white px-3 text-[11px] text-body outline-none focus:border-[#A8D2C8] focus:ring-2 focus:ring-[#EAF5F2]"
          >
            <option value="Newest first">Newest first</option>
            <option value="Oldest first">Oldest first</option>
            <option value="Highest amount">Highest amount</option>
          </select>
        </div>

        {/* Active filters / status tabs */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(["All", "Affordable now", "With plan", "Later", "Not affordable"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 h-8 rounded-full text-[10px] transition ${
                  filter === f 
                    ? "bg-mint text-teal font-semibold border border-transparent" 
                    : "bg-white border border-line text-body hover:bg-slate-50"
                }`}
              >
                {f} {f === "All" && <span className="ml-1 opacity-70">{DEMO_DATA.length}</span>}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted">{filteredAndSortedData.length} decisions</span>
        </div>

        {/* History table */}
        <div className="mt-5 bg-white border border-line rounded-[16px] shadow-card overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-[minmax(260px,1.7fr)_110px_150px_145px_130px_70px] px-5 h-11 items-center bg-[#FBFCFC] border-b border-line text-[10px] font-semibold text-muted uppercase tracking-[.06em]">
              <span>Decision</span><span>Type</span><span>Date</span><span>Amount</span><span>Status</span><span></span>
            </div>

            <div className="divide-y divide-[#E9EEF0]">
              {filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => handleRowClick(item.id)}
                    className="w-full text-left grid grid-cols-[minmax(260px,1.7fr)_110px_150px_145px_130px_70px] px-5 min-h-[78px] items-center hover:bg-[#FBFCFC] transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-[#F3F7F7] flex items-center justify-center text-body shrink-0">
                        <item.icon className="w-4" />
                      </span>
                      <div className="min-w-0 pr-4">
                        <p className="text-[12px] font-medium truncate">{item.question}</p>
                        <p className="mt-1 text-[10px] text-muted truncate">{item.description}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-body">{item.type}</span>
                    <span className="text-[10px] text-body">{item.dateStr}</span>
                    <span className="text-[12px] font-semibold">{item.amountStr}</span>
                    {renderStatusBadge(item.status)}
                    <span className="flex justify-end">
                      <ChevronRight className="w-4 text-muted" />
                    </span>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-semibold">No decisions found</p>
                  <p className="mt-2 text-[12px] text-muted">Try changing your search or filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

       
      </div>
    </section>
  );
}
