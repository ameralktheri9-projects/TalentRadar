"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/NotificationBell";

const adminNav = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: "◻" },
  { href: "/admin/companies", label: "الشركات", icon: "◻" },
  { href: "/admin/agencies", label: "الوكالات", icon: "◻" },
  { href: "/admin/sla", label: "مراقبة SLA", icon: "◻" },
  { href: "/admin/analytics", label: "التحليلات", icon: "◻" },
];

function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">لوحة الإدارة</h1>
        <p className="text-xs text-slate-400 mt-1">TalentHunt Admin</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {adminNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full"
        >
          تسجيل الخروج
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <header className="flex items-center justify-end px-6 py-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-40">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
