export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencyTier, AGENCY_LIMITS } from "@/lib/subscription-limits";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const agencyUser = await prisma.agencyUser.findUnique({ where: { id: user.entityId } });
    if (!agencyUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const tier = await getAgencyTier(agencyUser.agency_id);
    if (AGENCY_LIMITS[tier].analytics === "none") {
      return NextResponse.json({ error: "يتطلب اشتراك BASIC أو أعلى" }, { status: 402 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const agencyId = agencyUser.agency_id;

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { avg_time_to_fill_days: true, fill_rate: true, total_placements: true },
    });

    const [proposalsThisMonth, proposalsTotal, placements, activeJobRequests] = await Promise.all([
      prisma.proposal.count({
        where: { agency_id: agencyId, submitted_at: { gte: startOfMonth } },
      }),
      prisma.proposal.count({ where: { agency_id: agencyId } }),
      prisma.placement.count({ where: { agency_id: agencyId } }),
      // Count proposals where job request is still OPEN
      prisma.proposal.count({
        where: {
          agency_id: agencyId,
          status: { in: ["SUBMITTED", "SHORTLISTED"] },
        },
      }),
    ]);

    const winRate = proposalsTotal > 0 ? Math.round((placements / proposalsTotal) * 100) : 0;

    return NextResponse.json({
      data: {
        winRate,
        avgDaysToFill: agency?.avg_time_to_fill_days ?? 0,
        revenueByMonth: [],
        clientRetentionRate: 0,
        proposalsThisMonth,
        activeJobRequests,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
