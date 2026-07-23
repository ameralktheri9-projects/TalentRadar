"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { SidebarLogo } from "@/components/brand/SidebarLogo";
import { LayoutDashboard, Briefcase, FileText, Settings } from "lucide-react";

const candidateNav = [
  { href: "/candidate/dashboard",     label: "الرئيسية",  icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href: "/candidate/jobs",          label: "الوظائف",   icon: <Briefcase        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/candidate/applications",  label: "طلباتي",   icon: <FileText         className="w-4 h-4 flex-shrink-0" /> },
  { href: "/candidate/settings",      label: "الإعدادات", icon: <Settings         className="w-4 h-4 flex-shrink-0" /> },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as { userType?: string })?.userType !== "CANDIDATE") {
      router.push("/login");
    }
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col text-white hidden md:flex"
             style={{ background: "linear-gradient(180deg, #0A0E27 0%, #1A1040 100%)" }}>
        <SidebarLogo />
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {candidateNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white bg-white/12 border-s-2 border-[#00FFD1] shadow-[inset_0_0_12px_rgba(0,255,209,0.08)]"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}
              >
                <span className={cn("flex-shrink-0", isActive ? "text-[#00FFD1]" : "text-white/50")}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full"
          >
            <span className="text-white/40">→</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 flex items-center justify-between h-14">
            <span className="font-bold text-sm" style={{ background: "linear-gradient(90deg,#00FFD1,#7B61FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TalentRadar
            </span>
            <nav className="flex gap-1">
              {candidateNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    pathname === item.href || pathname.startsWith(item.href + "/")
                      ? "text-[#00A88A] bg-emerald-50"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  {item.icon}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="hidden md:block h-[3px]" style={{ background: "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)" }} />
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
          <p className="text-sm text-gray-500">بوابة المرشح</p>
        </div>

        <main className="flex-1 bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
}
