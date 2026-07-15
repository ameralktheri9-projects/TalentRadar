import { prisma } from './prisma'

interface MatchBreakdown {
  sectorMatch: number      // 0-30
  ratingScore: number      // 0-25
  responseTimeScore: number // 0-20
  pastPlacementsScore: number // 0-15
  feeScore: number         // 0-10
}

export async function computeMatchScore(
  jobRequestId: string,
  agencyId: string
): Promise<{ score: number; breakdown: MatchBreakdown }> {
  const [jobRequest, agency] = await Promise.all([
    prisma.jobRequest.findUnique({ where: { id: jobRequestId } }),
    prisma.agency.findUnique({ where: { id: agencyId } }),
  ])

  if (!jobRequest || !agency) return { score: 0, breakdown: { sectorMatch: 0, ratingScore: 0, responseTimeScore: 0, pastPlacementsScore: 0, feeScore: 0 } }

  // sectorMatch (30 pts) — agency.sector_tags contains job sector
  const sectorTags = agency.sector_tags ?? []
  const sectorMatch = sectorTags.includes(jobRequest.sector) ? 30
    : sectorTags.some((t: string) => t.toLowerCase().includes(jobRequest.sector.toLowerCase())) ? 15
    : 0

  // ratingScore (25 pts) — agency.rating_avg / 5 * 25
  const ratingScore = Math.round((agency.rating_avg / 5) * 25)

  // responseTimeScore (20 pts) — use avg_time_to_fill_days as proxy
  const avgDays = agency.avg_time_to_fill_days ?? 30
  const responseTimeScore = avgDays <= 7 ? 20 : avgDays <= 14 ? 15 : avgDays <= 21 ? 10 : avgDays <= 30 ? 5 : 0

  // pastPlacementsScore (15 pts) — total_placements as proxy
  const placements = agency.total_placements ?? 0
  const pastPlacementsScore = placements > 50 ? 15 : placements >= 20 ? 10 : placements >= 5 ? 5 : 0

  // feeScore (10 pts) — agency fill_rate as proxy for reliability
  const fillRate = agency.fill_rate ?? 0
  const feeScore = fillRate >= 0.85 ? 10 : fillRate >= 0.7 ? 5 : 0

  const score = sectorMatch + ratingScore + responseTimeScore + pastPlacementsScore + feeScore
  const breakdown: MatchBreakdown = { sectorMatch, ratingScore, responseTimeScore, pastPlacementsScore, feeScore }

  // Upsert MatchScore
  await prisma.matchScore.upsert({
    where: { jobRequestId_agencyId: { jobRequestId, agencyId } },
    create: { jobRequestId, agencyId, score, breakdown: breakdown as object },
    update: { score, breakdown: breakdown as object, computedAt: new Date() },
  })

  return { score, breakdown }
}

export async function scoreAllAgenciesForJob(jobRequestId: string): Promise<void> {
  const agencies = await prisma.agency.findMany({ where: { status: 'ACTIVE' } })
  await Promise.all(agencies.map(a => computeMatchScore(jobRequestId, a.id)))
}
