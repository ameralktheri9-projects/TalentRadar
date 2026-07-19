export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { locale } = await req.json() as { locale: string };
  if (locale !== "ar" && locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const response = NextResponse.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    `locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
  );
  return response;
}
