import { cookies } from "next/headers";
import type { Locale } from "./locale.shared";

export function getLocale(): Locale {
  const cookieStore = cookies();
  const val = cookieStore.get("locale")?.value;
  return val === "en" ? "en" : "ar";
}
