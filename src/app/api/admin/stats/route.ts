import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as AuthUser).userType !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCompanies,
    totalAgencies,
    totalJobRequests,
    totalPlacements,
    paidInvoices,
    pendingCompanies,
    pendingAgencies,
    agenciesForFillRate,
    placementsThisMonth,
  ] = await Promise.all([
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.agency.count({ where: { status: "ACTIVE" } }),
    prisma.jobRequest.count({ where: { status: "OPEN" } }),
    prisma.placement.count(),
    prisma.invoice.findMany({
      where: { status: "PAID" },
      select: { gross_amount: true, platform_cut: true },
    }),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.agency.count({ where: { status: "PENDING" } }),
    prisma.agency.findMany({
      where: { status: "ACTIVE" },
      select: { fill_rate: true },
    }),
    prisma.placement.count({
      where: { offer_made_at: { gte: startOfMonth } },
    }),
  ]);

  const totalGmv = paidInvoices.reduce((sum, inv) => sum + inv.gross_amount, 0);
  const platformRevenue = paidInvoices.reduce((sum, inv) => sum + inv.platform_cut, 0);
  const avgFillRate =
    agenciesForFillRate.length > 0
      ? agenciesForFillRate.reduce((sum, a) => sum + a.fill_rate, 0) / agenciesForFillRate.length
      : 0;

  return NextResponse.json({
    total_companies: totalCompanies,
    total_agencies: totalAgencies,
    total_job_requests: totalJobRequests,
    total_placements: totalPlacements,
    total_gmv: totalGmv,
    platform_revenue: platformRevenue,
    pending_company_approvals: pendingCompanies,
    pending_agency_approvals: pendingAgencies,
    avg_fill_rate: Math.round(avgFillRate * 10) / 10,
    placements_this_month: placementsThisMonth,
  });
}
