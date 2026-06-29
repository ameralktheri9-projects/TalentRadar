import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const candidate = await prisma.candidateSubmission.findUnique({
      where: { id: params.id },
      include: {
        proposal: {
          include: {
            job_request: { include: { company: { select: { id: true } } } },
          },
        },
      },
    });

    if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (candidate.proposal.job_request.company.id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (candidate.proposal.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Proposal must be ACCEPTED to view full profile" }, { status: 400 });
    }

    // Set status to VIEWED if was SUBMITTED
    let updated = candidate;
    if (candidate.status === "SUBMITTED") {
      updated = await prisma.candidateSubmission.update({
        where: { id: params.id },
        data: { status: "VIEWED" },
        include: {
          proposal: {
            include: {
              job_request: { include: { company: { select: { id: true } } } },
            },
          },
        },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
