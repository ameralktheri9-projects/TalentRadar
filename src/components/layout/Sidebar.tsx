"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarLogo } from "@/components/brand/SidebarLogo";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/locale.shared";
import {
  LayoutDashboard, Briefcase, Building2, FileText, Users,
  Search, Target, MessageSquare, UserCog, BarChart2,
  DollarSign, Inbox, PenSquare, CheckSquare, Settings,
  Clock, Sliders, BookOpen
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  userType: "COMPANY" | "AGENCY" | "ADMIN";
  sidebarOpen?: boolean;
  onClose?: () => void;
}

const companyNav: NavItem[] = [
  { href: "/dashboard",          labelKey: "nav.dashboard",       icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href: "/job-requests",       labelKey: "nav.jobRequests",     icon: <Briefcase        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agencies",           labelKey: "nav.agencies",        icon: <Building2        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/invoices",           labelKey: "nav.invoices",        icon: <FileText         className="w-4 h-4 flex-shrink-0" /> },
  { href: "/candidates",         labelKey: "nav.candidates",      icon: <Users            className="w-4 h-4 flex-shrink-0" /> },
  { href: "/candidates/search",  labelKey: "nav.candidateSearch", icon: <Search           className="w-4 h-4 flex-shrink-0" /> },
  { href: "/placements",         labelKey: "nav.placements",      icon: <Target           className="w-4 h-4 flex-shrink-0" /> },
  { href: "/messages",           labelKey: "nav.messages",        icon: <MessageSquare    className="w-4 h-4 flex-shrink-0" /> },
  { href: "/referral",           labelKey: "nav.referral",        icon: <BookOpen         className="w-4 h-4 flex-shrink-0" /> },
  { href: "/settings/users",     labelKey: "nav.users",           icon: <UserCog          className="w-4 h-4 flex-shrink-0" /> },
];

const agencyNav: NavItem[] = [
  { href: "/agency/dashboard",       labelKey: "nav.dashboard",   icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/rfp-inbox",       labelKey: "nav.rfpInbox",    icon: <Inbox           className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/candidates",      labelKey: "nav.candidates",  icon: <Users           className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/commissions",     labelKey: "nav.commissions", icon: <DollarSign      className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/analytics",       labelKey: "nav.analytics",   icon: <BarChart2       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/messages",        labelKey: "nav.messages",    icon: <MessageSquare   className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/profile/edit",    labelKey: "nav.profile",     icon: <PenSquare       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/referral",        labelKey: "nav.referral",    icon: <BookOpen        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/agency/settings/users",  labelKey: "nav.users",       icon: <UserCog         className="w-4 h-4 flex-shrink-0" /> },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard",          labelKey: "nav.dashboard",         icon: <LayoutDashboard className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/agencies",           labelKey: "nav.agencies",          icon: <Building2       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/companies",          labelKey: "nav.companies",         icon: <Briefcase       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/verification-queue", labelKey: "nav.verificationQueue", icon: <CheckSquare     className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/finance",            labelKey: "nav.finance",           icon: <DollarSign      className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/sla",                labelKey: "nav.sla",               icon: <Clock           className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/analytics",          labelKey: "nav.analytics",         icon: <BarChart2       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/matching-config",    labelKey: "nav.matchingConfig",    icon: <Sliders         className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/subscriptions",      labelKey: "nav.subscriptions",     icon: <FileText        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/market-reports",     labelKey: "nav.marketReports",     icon: <BarChart2       className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/notifications",      labelKey: "nav.notifications",     icon: <Settings        className="w-4 h-4 flex-shrink-0" /> },
  { href: "/admin/settings/security",  labelKey: "nav.security",          icon: <Settings        className="w-4 h-4 flex-shrink-0" /> },
];

export default function Sidebar({ userType, sidebarOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const nav = userType === "COMPANY" ? companyNav : userType === "AGENCY" ? agencyNav : adminNav;

  return (
    <>
      {/* Mobile overlay */}
      {onClose && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity",
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "w-64 flex-shrink-0 flex flex-col text-white z-50",
          "md:relative md:translate-x-0",
          "fixed inset-y-0 start-0 transition-transform duration-250",
          !sidebarOpen && "-translate-x-full md:translate-x-0",
        )}
        style={{ background: "linear-gradient(180deg, #0A0E27 0%, #1A1040 100%)" }}
      >
        <SidebarLogo />

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? [
                        "text-white bg-white/12",
                        "border-s-2 border-[#00FFD1]",
                        "shadow-[inset_0_0_12px_rgba(0,255,209,0.08)]",
                      ]
                    : "text-white/60 hover:text-white hover:bg-white/8"
                )}
              >
                <span className={cn("flex-shrink-0", isActive ? "text-[#00FFD1]" : "text-white/50")}>
                  {item.icon}
                </span>
                <span>{t(locale, item.labelKey as Parameters<typeof t>[1])}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <Link
            href="/api/auth/signout"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full"
          >
            <span className="text-white/40">→</span>
            {t(locale, "common.logout")}
          </Link>
        </div>
      </aside>
    </>
  );
}
