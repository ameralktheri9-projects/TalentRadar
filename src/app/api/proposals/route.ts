import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  const { searchParams } = new URL(req.url);
  const job_request_id = searchParams.get("job_request_id");

  try {
    const where: Record<string, unknown> = {};
    if (user.userType === "AGENCY") where.agency_id = user.entityId;
    if (job_request_id) where.job_request_id = job_request_id;

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        agency: true,
        submitter: { select: { full_name: true } },
        job_request: { include: { company: true } },
      },
      orderBy: { submitted_at: "desc" },
    });
    return NextResponse.json({ data: proposals });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      job_request_id,
      candidate_count_available,
      fee_type,
      fee_value,
      timeline_days,
      guarantee_days,
      notes,
    } = body;

    const proposal = await prisma.proposal.create({
      data: {
        job_request_id,
        agency_id: user.entityId!,
        submitted_by: user.id,
        candidate_count_available: candidate_count_available || 0,
        fee_type,
        fee_value,
        timeline_days,
        guarantee_days: guarantee_days || 90,
        notes,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({ data: proposal }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
