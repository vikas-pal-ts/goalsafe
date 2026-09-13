"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  user_id: string;
  label: string;
  currency: string;
};

interface UserContextType {
  users: User[];
  selectedUser: User | null;
  setSelectedUserId: (id: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("http://localhost:8000/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data: User[] = await res.json();
        setUsers(data);

        // check local storage
        const storedId = localStorage.getItem("moneymind_user_id");
        if (storedId && data.some(u => u.user_id === storedId)) {
          setSelectedUser(data.find(u => u.user_id === storedId) || null);
        } else if (data.length > 0) {
          setSelectedUser(data[0]);
          localStorage.setItem("moneymind_user_id", data[0].user_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const setSelectedUserId = (id: string) => {
    const user = users.find(u => u.user_id === id);
    if (user) {
      setSelectedUser(user);
      localStorage.setItem("moneymind_user_id", user.user_id);
      // Trigger a soft refresh by reloading window or we can just rely on components listening to context
      // The user requested: "When user changes: pages that display financial data should refresh/re-fetch their data for the new user"
      // Since they use useEffect that depend on selectedUser, it should work.
    }
  };

  return (
    <UserContext.Provider value={{ users, selectedUser, setSelectedUserId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
