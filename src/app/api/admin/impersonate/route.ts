export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "fallback-secret"
);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, userType } = await req.json() as { userId: string; userType: string };
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";

  // Log to AuditLog
  await prisma.auditLog.create({
    data: {
      adminId: user.id,
      action: "IMPERSONATE",
      targetId: userId,
      targetType: userType,
      metadata: { ip, timestamp: new Date().toISOString() },
      ip,
    },
  });

  // Issue a short-lived impersonation token (15 min)
  const token = await new jose.SignJWT({ userId, userType, impersonated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const BASE = process.env.NEXTAUTH_URL ?? "";
  return NextResponse.json({
    impersonationToken: token,
    redirectUrl: `${BASE}/impersonate?token=${token}`,
  });
}
