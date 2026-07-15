"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  userType: "COMPANY" | "AGENCY" | "ADMIN";
}

const companyNav: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: "🏠" },
  { href: "/job-requests", label: "طلبات التوظيف", icon: "📋" },
  { href: "/agencies", label: "الوكالات", icon: "🏢" },
  { href: "/invoices", label: "الفواتير", icon: "💰" },
  { href: "/candidates", label: "المرشحون", icon: "👥" },
  { href: "/placements", label: "التعيينات", icon: "🎯" },
  { href: "/messages", label: "الرسائل", icon: "💬" },
  { href: "/settings/users", label: "المستخدمون", icon: "👤" },
];

const agencyNav: NavItem[] = [
  { href: "/agency/dashboard", label: "لوحة التحكم", icon: "🏠" },
  { href: "/agency/rfp-inbox", label: "صندوق الطلبات", icon: "📥" },
  { href: "/agency/candidates", label: "المرشحون", icon: "👥" },
  { href: "/agency/commissions", label: "العمولات", icon: "💵" },
  { href: "/agency/analytics", label: "التحليلات", icon: "📊" },
  { href: "/agency/messages", label: "الرسائل", icon: "💬" },
  { href: "/agency/settings/users", label: "المستخدمون", icon: "👤" },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "لوحة التحكم", icon: "🏠" },
  { href: "/admin/agencies", label: "الوكالات", icon: "🏢" },
  { href: "/admin/companies", label: "الشركات", icon: "🏭" },
];

export default function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname();
  const nav = userType === "COMPANY" ? companyNav : userType === "AGENCY" ? agencyNav : adminNav;

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-600">منصة صيد المواهب</h1>
        <p className="text-xs text-gray-500 mt-1">TalentHunt</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <span>🚪</span>
          تسجيل الخروج
        </Link>
      </div>
    </aside>
  );
}
