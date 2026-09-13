"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  CreditCard,
  ChevronRight,
  Activity,
  ShieldCheck,
  Zap
} from "lucide-react";
import { getExpenses } from "../../lib/api";
import { useUser } from "@/components/providers/UserProvider";
import { ExpenseItem, ExpenseSummary } from "../../lib/types";

type SortType = "Newest first" | "Highest amount";
type FilterType = "All" | "Protected" | "Flexible";

export default function CurrentExpensesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");
  const [sort, setSort] = useState<SortType>("Newest first");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { selectedUser } = useUser();

  useEffect(() => {
    if (!selectedUser) return;
    setIsLoading(true);
    getExpenses().then((res) => {
      setExpenses(res.items);
      setSummary(res.summary);
    }).finally(() => setIsLoading(false));
  }, [selectedUser]);

  const filteredAndSortedData = useMemo(() => {
    let result = expenses;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    if (filter !== "All") {
      if (filter === "Protected") result = result.filter(item => item.is_protected);
      if (filter === "Flexible") result = result.filter(item => !item.is_protected);
    }

    result = [...result].sort((a, b) => {
      if (sort === "Newest first") {
        return new Date(a.next_date).getTime() - new Date(b.next_date).getTime();
      } else if (sort === "Highest amount") {
        return b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [searchQuery, filter, sort, expenses]);

  const renderStatusBadge = (is_protected: boolean) => {
    if (is_protected) {
      return (
        <span className="w-fit px-2.5 py-1 rounded-full text-[9px] font-semibold bg-mint text-teal">
          Protected
        </span>
      );
    } else {
      return (
        <span className="w-fit px-2.5 py-1 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-500">
          Flexible
        </span>
      );
    }
  };

  return (
    <section className="min-h-screen">
      <div className="">
         {/* Summary strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Total Relevant Expenses</span>
              <Activity className="w-4 text-teal" />
            </div>
            <p className="mt-2 text-[20px] font-semibold">{summary?.total_relevant || 0}</p>
            <p className="mt-1 text-[10px] text-muted">Active financial commitments</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Protected Total</span>
              <ShieldCheck className="w-4 text-teal" />
            </div>
            <p className="mt-2 text-[15px] font-semibold text-teal">₹{Number(summary?.protected_total || 0).toLocaleString("en-IN")}</p>
            <p className="mt-1 text-[10px] text-muted">Essential spending</p>
          </div>
          <div className="bg-white border border-line rounded-[14px] p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">Flexible Total</span>
              <Zap className="w-4 text-amber" />
            </div>
            <p className="mt-2 text-[15px] font-semibold text-amber">₹{Number(summary?.flexible_total || 0).toLocaleString("en-IN")}</p>
            <p className="mt-1 text-[10px] text-muted">Can be reduced or stopped</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-teal uppercase tracking-[.12em]">CURRENT FINANCIAL COMMITMENTS</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-.025em]">Current expenses</h1>
            <p className="mt-2 text-[14px] text-muted">Recurring and upcoming expenses that affect your available capacity.</p>
          </div>
        </div>

        {/* Search / filter toolbar */}
        <div className="mt-8 bg-white border border-line rounded-[15px] shadow-card p-3 flex items-center gap-3">
          <div className="flex-1 h-10 rounded-lg border border-line bg-[#FBFCFC] flex items-center px-3 gap-2.5 focus-within:border-[#A8D2C8] focus-within:ring-2 focus-within:ring-[#EAF5F2]">
            <Search className="w-4 text-muted shrink-0" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[12px] placeholder:text-muted"
              placeholder="Search expenses by name or category..." 
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
            <option value="Newest first">Closest Date</option>
            <option value="Highest amount">Highest amount</option>
          </select>
        </div>

        {/* Active filters / status tabs */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {(["All", "Protected", "Flexible"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 h-8 rounded-full text-[10px] transition ${
                  filter === f 
                    ? "bg-mint text-teal font-semibold border border-transparent" 
                    : "bg-white border border-line text-body hover:bg-slate-50"
                }`}
              >
                {f} {f === "All" && <span className="ml-1 opacity-70">{expenses.length}</span>}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-muted">{filteredAndSortedData.length} expenses</span>
        </div>

        {/* Expenses table */}
        <div className="mt-5 bg-white border border-line rounded-[16px] shadow-card overflow-x-auto">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-[minmax(260px,1.7fr)_110px_110px_130px_145px_130px] px-5 h-11 items-center bg-[#FBFCFC] border-b border-line text-[10px] font-semibold text-muted uppercase tracking-[.06em]">
              <span>Expense</span><span>Category</span><span>Frequency</span><span>Next date</span><span>Amount</span><span>Status</span>
            </div>

            <div className="divide-y divide-[#E9EEF0]">
              {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-16 text-center">
                   <p className="text-[14px] font-semibold">Loading expenses...</p>
                 </div>
              ) : filteredAndSortedData.length > 0 ? (
                filteredAndSortedData.map((item) => (
                  <div 
                    key={item.id}
                    className="w-full text-left grid grid-cols-[minmax(260px,1.7fr)_110px_110px_130px_145px_130px] px-5 min-h-[78px] items-center hover:bg-[#FBFCFC] transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-[#F3F7F7] flex items-center justify-center text-body shrink-0">
                        <CreditCard className="w-4" />
                      </span>
                      <div className="min-w-0 pr-4">
                        <p className="text-[12px] font-medium truncate">{item.name}</p>
                        <p className="mt-1 text-[10px] text-muted truncate">{item.flexibility}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-body">{item.category}</span>
                    <span className="text-[10px] text-body capitalize">{item.frequency}</span>
                    <span className="text-[10px] text-body">{new Date(item.next_date).toLocaleDateString("en-GB", {day: "2-digit", month: "short", year: "numeric"})}</span>
                    <span className="text-[12px] font-semibold">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                    <div>{renderStatusBadge(item.is_protected)}</div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-[14px] font-semibold">No expenses found</p>
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
