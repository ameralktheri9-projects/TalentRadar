"use client";

// TODO (Sprint 4): Wire CandidateUser into next-auth and enforce auth here.
// For now, candidate routes are public while the portal is being built.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const candidateNav = [
  { href: "/candidate/dashboard", label: "الرئيسية" },
  { href: "/candidate/jobs", label: "الوظائف" },
  { href: "/candidate/applications", label: "طلباتي" },
  { href: "/candidate/settings", label: "الإعدادات" },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-blue-600 text-lg">منصة المرشحين</span>
          <nav className="flex gap-1">
            {candidateNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
