import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    if (user.userType === "COMPANY") {
      const interviews = await prisma.interview.findMany({
        where: {
          candidate_submission: {
            proposal: {
              job_request: { company_id: user.entityId },
            },
          },
        },
        include: {
          candidate_submission: {
            include: {
              proposal: {
                include: {
                  job_request: { select: { title: true } },
                  agency: { select: { name_ar: true, name_en: true } },
                },
              },
            },
          },
          scheduler: { select: { full_name: true } },
        },
        orderBy: { scheduled_at: "desc" },
      });
      return NextResponse.json({ data: interviews });
    }

    if (user.userType === "AGENCY") {
      const interviews = await prisma.interview.findMany({
        where: {
          candidate_submission: { agency_id: user.entityId },
        },
        include: {
          candidate_submission: {
            include: {
              proposal: {
                include: { job_request: { select: { title: true } } },
              },
            },
          },
        },
        orderBy: { scheduled_at: "desc" },
      });
      return NextResponse.json({ data: interviews });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { candidate_submission_id, interview_type, scheduled_at } = body;

    if (!candidate_submission_id || !interview_type || !scheduled_at) {
      return NextResponse.json(
        { error: "candidate_submission_id, interview_type, scheduled_at are required" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidateSubmission.findUnique({
      where: { id: candidate_submission_id },
      include: {
        proposal: {
          include: { job_request: { select: { company_id: true } } },
        },
      },
    });

    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    if (candidate.proposal.job_request.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!["SHORTLISTED", "VIEWED"].includes(candidate.status)) {
      return NextResponse.json(
        { error: "Candidate must be SHORTLISTED or VIEWED to schedule interview" },
        { status: 400 }
      );
    }

    const [interview] = await prisma.$transaction([
      prisma.interview.create({
        data: {
          candidate_submission_id,
          scheduled_by: user.id,
          interview_type,
          scheduled_at: new Date(scheduled_at),
          outcome: "PENDING",
        },
      }),
      prisma.candidateSubmission.update({
        where: { id: candidate_submission_id },
        data: { status: "INTERVIEW_SCHEDULED" },
      }),
    ]);

    return NextResponse.json({ data: interview }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
