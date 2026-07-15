export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyTier, COMPANY_LIMITS } from "@/lib/subscription-limits";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
    if (!companyUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const tier = await getCompanyTier(companyUser.company_id);
    if (COMPANY_LIMITS[tier].analytics === "none") {
      return NextResponse.json({ error: "يتطلب اشتراك BASIC أو أعلى" }, { status: 402 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const companyId = companyUser.company_id;

    const [jobRequestsThisMonth, openRolesCount, placementsThisYear, topAgenciesRaw] = await Promise.all([
      prisma.jobRequest.count({
        where: { company_id: companyId, created_at: { gte: startOfMonth } },
      }),
      prisma.jobRequest.count({
        where: { company_id: companyId, status: "OPEN" },
      }),
      prisma.placement.count({
        where: { company_id: companyId, offer_made_at: { gte: startOfYear } },
      }),
      prisma.placement.findMany({
        where: { company_id: companyId },
        select: { agency_id: true },
      }),
    ]);

    // Get agency names for top agencies
    const agencyCountMap: Record<string, number> = {};
    for (const p of topAgenciesRaw) {
      agencyCountMap[p.agency_id] = (agencyCountMap[p.agency_id] ?? 0) + 1;
    }
    const topAgencyIds = Object.entries(agencyCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topAgenciesData = await prisma.agency.findMany({
      where: { id: { in: topAgencyIds } },
      select: { id: true, name_ar: true },
    });
    const topAgencies = topAgenciesData.map((a) => ({
      agencyId: a.id,
      agencyName: a.name_ar,
      count: agencyCountMap[a.id] ?? 0,
    })).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      data: {
        timeToFillByRole: [],
        avgAgencyFeePaid: 0,
        topAgencies,
        jobRequestsThisMonth,
        openRolesCount,
        placementsThisYear,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
