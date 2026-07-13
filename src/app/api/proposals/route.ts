export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  const { searchParams } = new URL(req.url);
  const job_request_id = searchParams.get("job_request_id");

  try {
    if (user.userType === "AGENCY") {
      const where: Record<string, unknown> = { agency_id: user.entityId };
      if (job_request_id) where.job_request_id = job_request_id;

      const proposals = await prisma.proposal.findMany({
        where,
        include: {
          agency: true,
          submitter: { select: { full_name: true } },
          job_request: true,
          candidate_submissions: true,
        },
        orderBy: { submitted_at: "desc" },
      });
      return NextResponse.json({ data: proposals });
    }

    // Company users see proposals for their job requests
    if (user.userType === "COMPANY") {
      const where: Record<string, unknown> = {
        job_request: { company_id: user.entityId },
      };
      if (job_request_id) where.job_request_id = job_request_id;

      const proposals = await prisma.proposal.findMany({
        where,
        include: {
          agency: true,
          submitter: { select: { full_name: true } },
          job_request: true,
          candidate_submissions: true,
        },
        orderBy: { submitted_at: "desc" },
      });
      return NextResponse.json({ data: proposals });
    }

    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    // Validate agency status
    const agency = await prisma.agency.findUnique({ where: { id: user.entityId } });
    if (!agency || agency.status !== "ACTIVE") {
      return NextResponse.json({ error: "يجب أن تكون الوكالة نشطة لتقديم العروض" }, { status: 403 });
    }
    if (!agency.hrsd_verified) {
      return NextResponse.json({ error: "يجب أن تكون الوكالة معتمدة من هيئة الموارد البشرية" }, { status: 403 });
    }

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

    // Validate job request
    const jobRequest = await prisma.jobRequest.findUnique({ where: { id: job_request_id } });
    if (!jobRequest) {
      return NextResponse.json({ error: "طلب التوظيف غير موجود" }, { status: 404 });
    }
    if (jobRequest.status !== "OPEN") {
      return NextResponse.json({ error: "طلب التوظيف غير مفتوح لاستقبال العروض" }, { status: 400 });
    }
    if (jobRequest.proposal_deadline && jobRequest.proposal_deadline < new Date()) {
      return NextResponse.json({ error: "انتهت المهلة المحددة لتقديم العروض" }, { status: 400 });
    }

    // Prevent duplicates
    const existing = await prisma.proposal.findFirst({
      where: { agency_id: user.entityId, job_request_id },
    });
    if (existing) {
      return NextResponse.json({ error: "لقد قدمت عرضاً على هذا الطلب مسبقاً" }, { status: 409 });
    }

    const proposal = await prisma.proposal.create({
      data: {
        job_request_id,
        agency_id: user.entityId!,
        submitted_by: user.id,
        candidate_count_available: Number(candidate_count_available) || 0,
        fee_type,
        fee_value: Number(fee_value),
        timeline_days: Number(timeline_days),
        guarantee_days: Number(guarantee_days) || 90,
        notes,
        status: "SUBMITTED",
        submitted_at: new Date(),
      },
    });

    return NextResponse.json({ data: proposal }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
