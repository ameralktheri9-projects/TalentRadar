import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { outcome, feedback } = body;

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        candidate_submission: {
          include: {
            proposal: {
              include: { job_request: { select: { company_id: true } } },
            },
          },
        },
      },
    });

    if (!interview) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (interview.candidate_submission.proposal.job_request.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validOutcomes = ["PASSED", "FAILED", "NO_SHOW", "CANCELLED"];
    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json({ error: `outcome must be one of: ${validOutcomes.join(", ")}` }, { status: 400 });
    }

    const updated = await prisma.interview.update({
      where: { id: params.id },
      data: {
        outcome,
        feedback,
        feedback_submitted_at: new Date(),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
