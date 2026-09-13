"use client";

import { useState, useMemo, useEffect } from "react";
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
  CalendarClock,
  ShoppingBag,
  ChartNoAxesCombined
} from "lucide-react";
import { listRequests } from "../../lib/api";
import { useUser } from "@/components/providers/UserProvider";
import { RequestResponse } from "../../lib/types";

type DecisionStatus = "Affordable now" | "Affordable with plan" | "Affordable later" | "Not affordable" | "Draft";

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

const mapIcon = (type: string) => {
  switch (type) {
    case "Purchase": return ShoppingBag;
    case "Travel": return Plane;
    case "Housing": return House;
    case "Debt repayment": return CreditCard;
    case "Family transfer": return UsersRound;
    case "Investment": return ChartNoAxesCombined;
    default: return Laptop;
  }
};

const mapStatus = (status: string, decisionData: any): DecisionStatus => {
  if (status !== "analyzed" || !decisionData) return "Draft";
  const ds = decisionData.decision?.status;
  switch (ds) {
    case "affordable_now": return "Affordable now";
    case "affordable_with_plan": return "Affordable with plan";
    case "affordable_later": return "Affordable later";
    case "not_affordable": return "Not affordable";
    default: return "Draft";
  }
};

type FilterType = "All" | "Affordable now" | "With plan" | "Later" | "Not affordable" | "Draft";
type SortType = "Newest first" | "Oldest first" | "Highest amount";

export default function HistoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("Newest first");
  const [requests, setRequests] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedUser } = useUser();

  useEffect(() => {
    if (!selectedUser) return;
    setIsLoading(true);
    listRequests().then((res) => {
      const data = res.items.map((req) => ({
        id: req.id,
        question: req.description,
        type: req.request_type,
        dateStr: new Date(req.created_at).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric"
        }),
        date: new Date(req.created_at),
        amountStr: `₹${Number(req.amount).toLocaleString("en-IN")}`,
        amount: Number(req.amount),
        status: mapStatus(req.status, req.decision_data),
        description: req.request_type,
        icon: mapIcon(req.request_type),
      }));
      setRequests(data);
    }).finally(() => setIsLoading(false));
  }, [selectedUser]);

  const filteredAndSortedData = useMemo(() => {
    let result = requests;

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
      if (filter === "Draft") mappedStatus = "Draft";

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
  }, [searchQuery, filter, sort, requests]);

  const handleRowClick = (id: string) => {
    router.push(`/analyze?requestId=${id}`);
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
    } else if (status === "Draft") {
      classes = "bg-slate-100 text-slate-500";
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
            <p className="mt-2 text-[20px] font-semibold">{requests.filter(r => r.status !== "Draft").length}</p>
            <p className="mt-1 text-[10px] text-muted">Completed analysis requests</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Most common outcome</span>
              <CircleCheck className="w-4 text-teal" />
            </div>
            <p className="mt-2 text-[15px] font-semibold text-teal">Affordable</p>
            <p className="mt-1 text-[10px] text-muted">Based on your recent decisions</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Plans currently active</span>
              <CalendarClock className="w-4 text-blue" />
            </div>
            <p className="mt-2 text-[20px] font-semibold">0</p>
            <p className="mt-1 text-[10px] text-muted">Tracked payment plans</p>
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
            {(["All", "Affordable now", "With plan", "Later", "Not affordable", "Draft"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 h-8 rounded-full text-[10px] transition ${
                  filter === f 
                    ? "bg-mint text-teal font-semibold border border-transparent" 
                    : "bg-white border border-line text-body hover:bg-slate-50"
                }`}
              >
                {f} {f === "All" && <span className="ml-1 opacity-70">{requests.length}</span>}
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
              {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                   <p className="text-[14px] font-semibold">Loading history...</p>
                 </div>
              ) : filteredAndSortedData.length > 0 ? (
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
