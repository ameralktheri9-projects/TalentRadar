export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const candidate = await prisma.candidateSubmission.findUnique({
      where: { id: params.id },
      include: {
        proposal: {
          include: {
            job_request: { include: { company: { select: { id: true } } } },
            agency: { select: { id: true, name_ar: true, name_en: true } },
          },
        },
        interviews: { orderBy: { scheduled_at: "asc" } },
        placement: true,
      },
    });

    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const proposal = candidate.proposal;

    // Agency can see their own candidates in full
    if (user.userType === "AGENCY") {
      if (proposal.agency.id !== user.entityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ data: candidate });
    }

    // Company user
    if (user.userType === "COMPANY") {
      if (proposal.job_request.company.id !== user.entityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (proposal.status !== "ACCEPTED") {
        // Return anon version only
        return NextResponse.json({
          data: {
            id: candidate.id,
            anon_summary: candidate.anon_summary,
            current_title: candidate.current_title,
            years_experience: candidate.years_experience,
            is_saudi: candidate.is_saudi,
            expected_salary: candidate.expected_salary,
            status: candidate.status,
            created_at: candidate.created_at,
            proposal_id: candidate.proposal_id,
            isAnon: true,
          },
        });
      }

      // Proposal accepted - return full profile, log view
      if (candidate.status === "SUBMITTED") {
        await prisma.candidateSubmission.update({
          where: { id: params.id },
          data: { status: "VIEWED" },
        });
        candidate.status = "VIEWED";
      }

      return NextResponse.json({ data: { ...candidate, isAnon: false } });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const body = await req.json();
    const { status } = body;

    const candidate = await prisma.candidateSubmission.findUnique({
      where: { id: params.id },
      include: {
        proposal: {
          include: {
            job_request: { include: { company: { select: { id: true } } } },
            agency: { select: { id: true } },
          },
        },
      },
    });

    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Company can SHORTLIST or REJECT
    if (user.userType === "COMPANY") {
      if (candidate.proposal.job_request.company.id !== user.entityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["SHORTLISTED", "REJECTED"].includes(status)) {
        return NextResponse.json({ error: "Company can only set SHORTLISTED or REJECTED" }, { status: 400 });
      }
    }

    if (user.userType === "AGENCY") {
      if (candidate.proposal.agency.id !== user.entityId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.candidateSubmission.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
