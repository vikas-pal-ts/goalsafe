"use client";

import { useState, useEffect } from "react";
import { Plus, Target, CheckCircle2, PauseCircle } from "lucide-react";
import { listGoals, createGoal } from "../../lib/api";
import { useUser } from "@/components/providers/UserProvider";
import { GoalResponse, GoalDraft } from "../../lib/types";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<GoalDraft>>({
    name: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
    priority: "medium",
    status: "active"
  });

  const { selectedUser } = useUser();

  const fetchGoals = () => {
    setIsLoading(true);
    listGoals().then((res) => setGoals(res.items)).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!selectedUser) return;
    fetchGoals();
  }, [selectedUser]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) return;
    try {
      await createGoal(newGoal as GoalDraft);
      setShowAddForm(false);
      setNewGoal({ name: "", target_amount: "", current_amount: "0", target_date: "", priority: "medium", status: "active" });
      fetchGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to create goal");
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="w-4 text-teal" />;
    if (status === "paused") return <PauseCircle className="w-4 text-amber" />;
    return <Target className="w-4 text-blue" />;
  };

  const getStatusText = (status: string) => {
    if (status === "completed") return "Completed";
    if (status === "paused") return "Paused";
    return "On track"; // Simplified for demo
  };

  return (
    <section className="min-h-screen">
      <div className="">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-medium text-teal uppercase tracking-[.12em]">YOUR PRIORITIES</p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-.025em]">Financial goals</h1>
            <p className="mt-2 text-[14px] text-muted">Keep your bigger priorities visible when making everyday decisions.</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="h-10 px-4 rounded-lg bg-teal text-white text-[12px] font-semibold flex items-center gap-2 hover:bg-tealDark transition"
          >
            <Plus className="w-4" /> Add goal
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white border border-line rounded-[16px] shadow-card p-6 mb-8">
            <h2 className="text-[16px] font-semibold mb-4">Create a New Goal</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-body mb-1">Goal Name</label>
                <input required type="text" value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} className="w-full h-10 rounded-lg border border-line px-3 text-[13px] outline-none focus:border-teal focus:ring-1 focus:ring-teal" placeholder="e.g. Home purchase" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-body mb-1">Target Amount (₹)</label>
                <input required type="number" value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} className="w-full h-10 rounded-lg border border-line px-3 text-[13px] outline-none focus:border-teal focus:ring-1 focus:ring-teal" placeholder="2500000" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-body mb-1">Current Saved (₹)</label>
                <input required type="number" value={newGoal.current_amount} onChange={e => setNewGoal({...newGoal, current_amount: e.target.value})} className="w-full h-10 rounded-lg border border-line px-3 text-[13px] outline-none focus:border-teal focus:ring-1 focus:ring-teal" placeholder="0" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-body mb-1">Target Date</label>
                <input required type="date" value={newGoal.target_date} onChange={e => setNewGoal({...newGoal, target_date: e.target.value})} className="w-full h-10 rounded-lg border border-line px-3 text-[13px] outline-none focus:border-teal focus:ring-1 focus:ring-teal" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-[12px] font-medium text-muted hover:text-body">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-teal text-white text-[12px] font-semibold rounded-lg hover:bg-tealDark transition">Save Goal</button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <p className="text-[14px] font-semibold text-muted">Loading goals...</p>
          ) : goals.length > 0 ? (
            goals.map((goal) => {
              const target = Number(goal.target_amount);
              const current = Number(goal.current_amount);
              const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
              const dateStr = new Date(goal.target_date).toLocaleDateString("en-GB", {month: "short", year: "numeric"});

              return (
                <div key={goal.id} className="bg-white border border-line rounded-[16px] shadow-card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-[15px] font-semibold tracking-[-.01em]">{goal.name}</h3>
                      <div className="flex items-center gap-1.5 bg-[#F3F7F7] px-2.5 py-1 rounded-full">
                        {getStatusIcon(goal.status)}
                        <span className="text-[10px] font-medium text-body">{getStatusText(goal.status)}</span>
                      </div>
                    </div>
                    <p className="text-[24px] font-semibold mb-1">₹{target.toLocaleString("en-IN")}</p>
                    <p className="text-[12px] text-muted">₹{current.toLocaleString("en-IN")} saved</p>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between text-[11px] font-semibold mb-2">
                      <span className="text-body">{progress}%</span>
                      <span className="text-muted">Target · {dateStr}</span>
                    </div>
                    <div className="w-full bg-[#E9EEF0] h-2 rounded-full overflow-hidden">
                      <div className="bg-teal h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center border border-dashed border-line rounded-[16px]">
              <Target className="w-8 h-8 text-[#C4D5E0] mx-auto mb-3" />
              <p className="text-[14px] font-semibold">No goals yet</p>
              <p className="mt-1 text-[12px] text-muted">Create your first financial goal to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
