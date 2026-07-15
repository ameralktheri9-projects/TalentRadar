export const AGENCY_LIMITS = {
  FREE:  { proposalsPerMonth: 2,        featuredRfp: false, analytics: 'none'  as const, marketReports: false },
  BASIC: { proposalsPerMonth: 10,       featuredRfp: false, analytics: 'basic' as const, marketReports: false },
  PRO:   { proposalsPerMonth: Infinity, featuredRfp: true,  analytics: 'full'  as const, marketReports: false },
  ELITE: { proposalsPerMonth: Infinity, featuredRfp: true,  analytics: 'full'  as const, marketReports: true, priorityQueue: true },
} as const

export const COMPANY_LIMITS = {
  FREE:       { jobRequestsPerMonth: 2,        aiSalary: false, candidateSearch: false, analytics: 'none'  as const },
  BASIC:      { jobRequestsPerMonth: 10,       aiSalary: true,  candidateSearch: false, analytics: 'basic' as const },
  PRO:        { jobRequestsPerMonth: Infinity, aiSalary: true,  candidateSearch: true,  analytics: 'full'  as const },
  ENTERPRISE: { jobRequestsPerMonth: Infinity, aiSalary: true,  candidateSearch: true,  analytics: 'full'  as const, dedicated: true },
} as const

export type AgencyTierKey = keyof typeof AGENCY_LIMITS
export type CompanyTierKey = keyof typeof COMPANY_LIMITS

export async function getAgencyTier(agencyId: string): Promise<AgencyTierKey> {
  const { prisma } = await import('./prisma')
  const sub = await prisma.agencySubscription.findFirst({
    where: { agencyId, status: { in: ['ACTIVE', 'TRIALING'] } },
    orderBy: { createdAt: 'desc' },
  })
  return (sub?.tier as AgencyTierKey) ?? 'FREE'
}

export async function getCompanyTier(companyId: string): Promise<CompanyTierKey> {
  const { prisma } = await import('./prisma')
  const sub = await prisma.companySubscription.findFirst({
    where: { companyId, status: { in: ['ACTIVE', 'TRIALING'] } },
  })
  return (sub?.tier as CompanyTierKey) ?? 'FREE'
}

export async function checkUsageLimit(
  orgId: string,
  orgType: 'COMPANY' | 'AGENCY',
  action: 'JOB_REQUEST' | 'PROPOSAL'
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { prisma } = await import('./prisma')
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  if (orgType === 'AGENCY' && action === 'PROPOSAL') {
    const tier = await getAgencyTier(orgId)
    const limit = AGENCY_LIMITS[tier].proposalsPerMonth
    const used = await prisma.proposal.count({
      where: { agency_id: orgId, submitted_at: { gte: startOfMonth } },
    })
    return { allowed: used < limit, used, limit: limit === Infinity ? -1 : limit }
  }

  if (orgType === 'COMPANY' && action === 'JOB_REQUEST') {
    const tier = await getCompanyTier(orgId)
    const limit = COMPANY_LIMITS[tier].jobRequestsPerMonth
    const used = await prisma.jobRequest.count({
      where: { company_id: orgId, created_at: { gte: startOfMonth } },
    })
    return { allowed: used < limit, used, limit: limit === Infinity ? -1 : limit }
  }

  return { allowed: true, used: 0, limit: -1 }
}
