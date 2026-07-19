"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const candidateNav = [
  { href: "/candidate/dashboard", label: "الرئيسية" },
  { href: "/candidate/jobs", label: "الوظائف" },
  { href: "/candidate/applications", label: "طلباتي" },
  { href: "/candidate/settings", label: "الإعدادات" },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login/candidate");
    } else if (status === "authenticated" && (session?.user as { userType?: string })?.userType !== "CANDIDATE") {
      router.push("/login/candidate");
    }
  }, [status, session, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">جاري التحميل...</div>
      </div>
    );
  }

  const user = session?.user as { name?: string } | undefined;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-bold text-purple-600 text-lg">منصة المرشحين</span>
          <nav className="flex gap-1">
            {candidateNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user?.name && (
              <span className="text-sm text-gray-600">{user.name}</span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login/candidate" })}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
