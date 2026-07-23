import { prisma } from "./prisma";
import { subDays, subHours } from "date-fns";

interface MatchBreakdown {
  sectorMatch: number;        // 0-30
  ratingScore: number;        // 0-25
  responseTimeScore: number;  // 0-20
  pastPlacementsScore: number;// 0-15
  feeScore: number;           // 0-10
}

export async function computeMatchScore(
  jobRequestId: string,
  agencyId: string
): Promise<{ score: number; breakdown: MatchBreakdown }> {
  const [jobRequest, agency] = await Promise.all([
    prisma.jobRequest.findUnique({ where: { id: jobRequestId } }),
    prisma.agency.findUnique({ where: { id: agencyId } }),
  ]);

  if (!jobRequest || !agency) {
    return {
      score: 0,
      breakdown: { sectorMatch: 0, ratingScore: 0, responseTimeScore: 0, pastPlacementsScore: 0, feeScore: 0 },
    };
  }

  // sectorMatch (30 pts)
  const sectorTags = agency.sector_tags ?? [];
  const sectorMatch = sectorTags.includes(jobRequest.sector)
    ? 30
    : sectorTags.some((t: string) => t.toLowerCase().includes(jobRequest.sector.toLowerCase()))
    ? 15
    : 0;

  // ratingScore (25 pts)
  const ratingScore = Math.round((agency.rating_avg / 5) * 25);

  // responseTimeScore (20 pts) — V3: apply penalty for ignored RFPs in last 30 days
  const avgDays = agency.avg_time_to_fill_days ?? 30;
  let baseResponseScore = avgDays <= 7 ? 20 : avgDays <= 14 ? 15 : avgDays <= 21 ? 10 : avgDays <= 30 ? 5 : 0;

  // V3 ranking improvement: penalty for RFPs notified but no proposal submitted within 48h
  const notifiedRfps: string[] = (agency.notifiedRfps as string[]) ?? [];
  if (notifiedRfps.length > 0) {
    const cutoff = subDays(new Date(), 30);
    const ignored = await prisma.jobRequest.count({
      where: {
        id: { in: notifiedRfps },
        created_at: { gte: cutoff, lt: subHours(new Date(), 48) },
        proposals: {
          none: { agency_id: agencyId },
        },
      },
    });
    baseResponseScore = Math.max(0, baseResponseScore - ignored * 2);
  }
  const responseTimeScore = baseResponseScore;

  // pastPlacementsScore (15 pts) — V3: recency weighting (last 30 days count 3x)
  const recentPlacements = await prisma.placement.count({
    where: {
      agency_id: agencyId,
      offer_made_at: { gte: subDays(new Date(), 30) },
    },
  });
  const olderPlacements = Math.max(0, (agency.total_placements ?? 0) - recentPlacements);
  const weightedCount = recentPlacements * 3 + olderPlacements;
  const pastPlacementsScore = weightedCount > 50 ? 15 : weightedCount >= 20 ? 10 : weightedCount >= 5 ? 5 : 0;

  // feeScore (10 pts)
  const fillRate = agency.fill_rate ?? 0;
  const feeScore = fillRate >= 0.85 ? 10 : fillRate >= 0.7 ? 5 : 0;

  const score = sectorMatch + ratingScore + responseTimeScore + pastPlacementsScore + feeScore;
  const breakdown: MatchBreakdown = { sectorMatch, ratingScore, responseTimeScore, pastPlacementsScore, feeScore };

  await prisma.matchScore.upsert({
    where: { jobRequestId_agencyId: { jobRequestId, agencyId } },
    create: { jobRequestId, agencyId, score, breakdown: breakdown as object },
    update: { score, breakdown: breakdown as object, computedAt: new Date() },
  });

  return { score, breakdown };
}

export async function scoreAllAgenciesForJob(jobRequestId: string): Promise<void> {
  const agencies = await prisma.agency.findMany({ where: { status: "ACTIVE" } });
  await Promise.all(agencies.map((a) => computeMatchScore(jobRequestId, a.id)));
}
