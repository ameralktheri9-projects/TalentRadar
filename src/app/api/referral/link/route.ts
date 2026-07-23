export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateReferralCode(prefix: string, id: string): string {
  const short = id.slice(-4).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TR-${prefix}-${short}${rand}`;
}

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://talent-radar-gamma.vercel.app";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    if (user.userType === "COMPANY") {
      const company = await prisma.company.findUnique({ where: { id: user.entityId } });
      if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

      let code = company.referralCode;
      if (!code) {
        code = generateReferralCode("COMP", company.id);
        await prisma.company.update({ where: { id: company.id }, data: { referralCode: code } });
      }

      // Count referrals
      const referred = await prisma.company.count({ where: { referredByCode: code } });

      return NextResponse.json({
        code,
        url: `${BASE_URL}/register/company?ref=${code}`,
        referred,
        credits: company.referralCredits,
      });
    }

    if (user.userType === "AGENCY") {
      const agency = await prisma.agency.findUnique({ where: { id: user.entityId } });
      if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

      let code = agency.referralCode;
      if (!code) {
        code = generateReferralCode("AGCY", agency.id);
        await prisma.agency.update({ where: { id: agency.id }, data: { referralCode: code } });
      }

      const referred = await prisma.agency.count({ where: { referredByCode: code } });

      return NextResponse.json({
        code,
        url: `${BASE_URL}/register/agency?ref=${code}`,
        referred,
        credits: agency.referralCredits,
      });
    }

    return NextResponse.json({ error: "Unsupported user type" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
