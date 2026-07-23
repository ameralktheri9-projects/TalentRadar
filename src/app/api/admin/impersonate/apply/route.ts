export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret"
);

export async function POST(req: NextRequest) {
  const { token } = await req.json() as { token: string };

  let payload: jose.JWTPayload & { userId?: string; userType?: string };
  try {
    const result = await jose.jwtVerify(token, JWT_SECRET);
    payload = result.payload as typeof payload;
  } catch {
    return NextResponse.json({ error: "رمز غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const { userId, userType } = payload;
  if (!userId || !userType) return NextResponse.json({ error: "رمز غير مكتمل" }, { status: 400 });

  // Look up the user email so the client can sign in via credentials
  let email = "";
  let redirectTo = "/dashboard";

  if (userType === "COMPANY") {
    const u = await prisma.companyUser.findUnique({ where: { id: userId }, select: { email: true } });
    if (!u) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    email = u.email;
    redirectTo = "/dashboard";
  } else if (userType === "AGENCY") {
    const u = await prisma.agencyUser.findUnique({ where: { id: userId }, select: { email: true } });
    if (!u) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    email = u.email;
    redirectTo = "/agency/dashboard";
  } else {
    return NextResponse.json({ error: "نوع مستخدم غير مدعوم للانتحال" }, { status: 400 });
  }

  // Issue a one-time impersonation session token — client will use this as password
  // We create a very short-lived token that the credentials provider can verify
  const oneTimeToken = await new jose.SignJWT({ userId, userType, oneTime: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2m")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return NextResponse.json({ email, password: oneTimeToken, userType, redirectTo });
}
