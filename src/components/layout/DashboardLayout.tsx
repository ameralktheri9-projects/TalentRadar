"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import NotificationBell from "@/components/NotificationBell";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "COMPANY" | "AGENCY" | "ADMIN";
}

const PORTAL_ACCENT: Record<string, string> = {
  COMPANY:   "#00FFD1",
  AGENCY:    "#7B61FF",
  ADMIN:     "#00FFD1",
};

export default function DashboardLayout({ children, userType }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accentColor = PORTAL_ACCENT[userType] ?? "#00FFD1";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        userType={userType}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* TopBar */}
        <header className="bg-white border-b border-gray-200 relative flex-shrink-0">
          {/* 1px brand accent line at top */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, ${accentColor} 0%, #7B61FF 100%)` }}
          />
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:block" />

            <div className="flex items-center gap-3">
              <LanguageToggle />
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
