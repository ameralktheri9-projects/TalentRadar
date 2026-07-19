"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LanguageToggle({ currentLocale }: { currentLocale: "ar" | "en" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function switchLocale(locale: "ar" | "en") {
    setLoading(true);
    await fetch("/api/locale", {
      method: "POST",
      body: JSON.stringify({ locale }),
      headers: { "Content-Type": "application/json" },
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={() => switchLocale(currentLocale === "ar" ? "en" : "ar")}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50"
      title={currentLocale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {currentLocale === "ar" ? (
        <><span className="font-semibold">EN</span><span className="text-xs text-gray-400 hidden sm:inline">English</span></>
      ) : (
        <><span className="font-semibold">ع</span><span className="text-xs text-gray-400 hidden sm:inline">العربية</span></>
      )}
    </button>
  );
}
