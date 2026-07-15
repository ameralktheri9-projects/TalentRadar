export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const [activeAgencies, activeCompanies] = await Promise.all([
      prisma.agency.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      data: {
        gmvByMonth: [],
        commissionEarned: 0,
        agencyChurnRate: 0,
        companyLTV: 0,
        slaBreachRate: 0,
        activeAgencies,
        activeCompanies,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
