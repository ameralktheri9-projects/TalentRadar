export function formatCurrency(amount: number, locale: "ar" | "en" = "ar"): string {
  if (locale === "ar") {
    return `${amount.toLocaleString("ar-SA")} ريال`;
  }
  return `SAR ${amount.toLocaleString("en-US")}`;
}

export function formatDate(date: Date | string | null, locale: "ar" | "en" = "ar"): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(date: Date | string | null, locale: "ar" | "en" = "ar"): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getLocaleFromCookie(cookieHeader: string | null): "ar" | "en" {
  if (!cookieHeader) return "ar";
  const match = cookieHeader.match(/locale=(ar|en)/);
  return (match?.[1] as "ar" | "en") ?? "ar";
}
