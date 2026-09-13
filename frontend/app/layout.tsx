import type { Metadata } from "next";
import "./globals.css";
import { House, CirclePlus, Clock3, UserRound, Settings2, Leaf, ChevronDown, Sprout } from "lucide-react";
import SidebarNav from "@/components/layout/SidebarNav";
import { UserProvider } from "@/components/providers/UserProvider";
import UserDropdown from "@/components/layout/UserDropdown";

export const metadata: Metadata = {
  title: "MoneyMind — Financial Command Center",
  description: "Better money choices today, more freedom tomorrow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <UserProvider>
          <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-[214px] shrink-0 bg-white border-r border-line flex flex-col relative z-20">
              <div className="h-[72px] px-6 flex items-center border-b border-line">
                <div className="logo flex items-center gap-3">
                  <svg viewBox="0 0 34 34" fill="none" aria-hidden="true">
                    <path d="M17 29V15" stroke="#167565" strokeLinecap="round" />
                    <path d="M17 17C9.7 16.3 6.3 12.7 6 6.5C12.2 6.8 17 10.1 17 17Z" fill="#D5EEE8" stroke="#167565" />
                    <path d="M17 21C24.3 20.3 27.7 16.7 28 10.5C21.8 10.8 17 14.1 17 21Z" fill="#B5DED4" stroke="#167565" />
                  </svg>
                  <span className="text-[18px] font-semibold tracking-[-.02em]">MoneyMind</span>
                </div>
              </div>

              <SidebarNav />

              <div className="mt-auto p-4 pb-6">
                <div className="rounded-2xl bg-mintSoft border border-[#E7F1EF] p-4 min-h-[132px]">
                  <span className="text-teal icon-stroke"><Leaf /></span>
                  <p className="mt-2 text-[13px] leading-[21px] font-medium text-teal">
                    Better money<br />choices today,<br />more freedom<br />tomorrow.
                  </p>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 relative overflow-hidden">
              {/* Top header */}
              <header className="h-[72px] bg-white border-b border-line flex items-center justify-between px-7 relative z-10">
                <p className="text-[11px] text-[#687A91]">Smarter decisions. A healthier tomorrow.</p>
                <UserDropdown />
              </header>

            <div className="relative z-10  w-full px-10  pt-10 pb-24 ">
              {children}
            </div>

            <div className="waves"></div>
            <div className="absolute right-8 bottom-5 z-10 opacity-70 text-[#76B293]">
              <Sprout className="w-14 h-14" strokeWidth="1.2" />
            </div>
          </main>
        </div>
        </UserProvider>
      </body>
    </html>
  );
}
