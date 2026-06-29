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
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // Agencies that haven't responded to RFPs (no proposals submitted) within 48h
  const openJobRequests = await prisma.jobRequest.findMany({
    where: {
      status: "OPEN",
      opened_at: { lt: fortyEightHoursAgo },
    },
    include: {
      proposals: {
        select: { agency_id: true, submitted_at: true },
      },
      company: { select: { name_ar: true } },
    },
  });

  // Proposals accepted but no candidates submitted within sla_days
  const acceptedProposals = await prisma.proposal.findMany({
    where: { status: "ACCEPTED" },
    include: {
      agency: { select: { name_ar: true } },
      job_request: { select: { title: true, sla_days: true, opened_at: true } },
      candidate_submissions: { select: { id: true } },
    },
  });

  const breaches: Array<{
    id: string;
    agency_name: string;
    job_title: string;
    breach_type: "NO_RESPONSE" | "NO_CANDIDATE";
    hours_overdue: number;
    opened_at: Date | null;
  }> = [];

  // No response breaches
  for (const jr of openJobRequests) {
    if (!jr.opened_at) continue;
    const hoursOpen = (now.getTime() - jr.opened_at.getTime()) / (60 * 60 * 1000);
    if (hoursOpen <= 48) continue;

    // Find agencies that got the RFP but didn't respond
    // For simplicity: if no proposals at all, flag for "platform" breach
    if (jr.proposals.length === 0) {
      breaches.push({
        id: `no-response-${jr.id}`,
        agency_name: "لا يوجد ردود",
        job_title: jr.title,
        breach_type: "NO_RESPONSE",
        hours_overdue: Math.round(hoursOpen - 48),
        opened_at: jr.opened_at,
      });
    }
  }

  // No candidate submitted within sla_days
  for (const proposal of acceptedProposals) {
    if (!proposal.job_request.opened_at) continue;
    const slaDays = proposal.job_request.sla_days;
    const slaEnd = new Date(proposal.job_request.opened_at.getTime() + slaDays * 24 * 60 * 60 * 1000);
    if (now <= slaEnd) continue;
    if (proposal.candidate_submissions.length > 0) continue;

    const hoursOverdue = (now.getTime() - slaEnd.getTime()) / (60 * 60 * 1000);
    breaches.push({
      id: `no-candidate-${proposal.id}`,
      agency_name: proposal.agency.name_ar,
      job_title: proposal.job_request.title,
      breach_type: "NO_CANDIDATE",
      hours_overdue: Math.round(hoursOverdue),
      opened_at: proposal.job_request.opened_at,
    });
  }

  return NextResponse.json(breaches);
}
