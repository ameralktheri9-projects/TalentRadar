export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobRequestId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY" && user.userType !== "ADMIN") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const scores = await prisma.matchScore.findMany({
      where: { jobRequestId: params.jobRequestId },
      orderBy: { score: "desc" },
      take: 10,
    });

    const agencyIds = scores.map((s) => s.agencyId);
    const agencies = await prisma.agency.findMany({
      where: { id: { in: agencyIds } },
      select: {
        id: true,
        name_ar: true,
        name_en: true,
        rating_avg: true,
        total_placements: true,
        fill_rate: true,
        avg_time_to_fill_days: true,
        sector_tags: true,
      },
    });
    const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a]));

    const result = scores.map((s) => {
      const agency = agencyMap[s.agencyId];
      return {
        agencyId: s.agencyId,
        agencyName: agency?.name_ar ?? s.agencyId,
        score: s.score,
        breakdown: s.breakdown,
        agency: agency
          ? {
              rating_avg: agency.rating_avg,
              total_placements: agency.total_placements,
              fill_rate: agency.fill_rate,
              avg_time_to_fill_days: agency.avg_time_to_fill_days,
              sector_tags: agency.sector_tags,
            }
          : null,
      };
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
