import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { getLocale } from "@/lib/locale.server";

export const metadata: Metadata = {
  title: "TalentRadar | منصة صيد المواهب",
  description: "منصة B2B لربط شركات التوظيف بأصحاب العمل في المملكة العربية السعودية",
  manifest: "/manifest.json",
  themeColor: "#00C2A0",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TalentRadar" },
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
