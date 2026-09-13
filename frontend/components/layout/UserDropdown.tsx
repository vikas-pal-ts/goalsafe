"use client";

import { useUser } from "@/components/providers/UserProvider";
import { UserRound, ChevronDown } from "lucide-react";

export default function UserDropdown() {
  const { users, selectedUser, setSelectedUserId, isLoading } = useUser();

  if (isLoading || !selectedUser) {
    return (
      <div className="flex items-center gap-2.5 opacity-50">
        <button className="avatar w-9 h-9 rounded-full bg-[#F2F5F7] text-body flex items-center justify-center border border-[#E9EEF0]" aria-label="Profile">
          <UserRound />
        </button>
        <span className="text-[12px] font-medium text-body">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 relative group">
      <button className="avatar w-9 h-9 rounded-full bg-[#F2F5F7] text-body flex items-center justify-center border border-[#E9EEF0]" aria-label="Profile">
        <UserRound />
      </button>
      
      <div className="flex flex-col text-left">
        <span className="text-[12px] font-medium text-body">{selectedUser.label}</span>
      </div>

      <div className="relative">
        <select 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={selectedUser.user_id}
          onChange={(e) => setSelectedUserId(e.target.value)}
          title="Change User"
        >
          {users.map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.label} · {u.user_id}
            </option>
          ))}
        </select>
        <button className="w-8 h-8 rounded-full bg-[#F6F8F9] border border-[#EEF1F2] text-muted flex items-center justify-center pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
