"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/locale.shared";

function getCookieLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/);
  return match?.[1] === "en" ? "en" : "ar";
}

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("ar");

  useEffect(() => {
    setLocale(getCookieLocale());
  }, []);

  return locale;
}
