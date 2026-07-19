"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/hooks/useLocale";

export function LanguageToggle({ currentLocale: initialLocale }: { currentLocale?: "ar" | "en" }) {
  const cookieLocale = useLocale();
  const locale = initialLocale ?? cookieLocale;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchLocale() {
    const next = locale === "ar" ? "en" : "ar";
    setLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      body: JSON.stringify({ locale: next }),
      headers: { "Content-Type": "application/json" },
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={switchLocale}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
      title={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {locale === "ar" ? (
        <><span className="font-semibold">EN</span><span className="text-xs text-gray-400 hidden sm:inline ml-1">English</span></>
      ) : (
        <><span className="font-semibold">ع</span><span className="text-xs text-gray-400 hidden sm:inline ml-1">العربية</span></>
      )}
    </button>
  );
}
