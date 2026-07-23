export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as OTPAuth from "otpauth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totp = new OTPAuth.TOTP({
    issuer: "TalentRadar Admin",
    label: admin.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const secret = totp.secret.base32;
  const uri = totp.toString();

  // Store secret (not yet enabled until confirmed)
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: secret },
  });

  return NextResponse.json({ secret, uri });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { code } = await req.json() as { code: string };
  const admin = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!admin?.totpSecret) return NextResponse.json({ error: "No TOTP secret" }, { status: 400 });

  const totp = new OTPAuth.TOTP({
    issuer: "TalentRadar Admin",
    label: admin.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(admin.totpSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { totpEnabled: true },
  });

  return NextResponse.json({ ok: true });
}
