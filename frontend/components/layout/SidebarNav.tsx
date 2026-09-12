"use client";

import { House, CirclePlus, Clock3, UserRound, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: House },
    { name: "New Request", href: "/new-request", icon: CirclePlus },
    { name: "History", href: "/history", icon: Clock3 },
    { name: "Profile", href: "/profile", icon: UserRound },
    { name: "Settings", href: "/settings", icon: Settings2 },
  ];

  return (
    <nav className="px-3.5 pt-5 space-y-1 text-[13px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        
        // Exact match for Home to prevent it from matching everything
        const isActuallyActive = item.href === "/" ? pathname === "/" : isActive;

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`h-11 rounded-xl flex items-center gap-3 px-3.5 transition ${
              isActuallyActive 
                ? "bg-mint text-teal font-medium" 
                : "text-body hover:bg-slate-50"
            }`}
          >
            <span className="icon-stroke">
              <item.icon />
            </span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
