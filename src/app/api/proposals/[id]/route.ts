import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { ProposalStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        agency: true,
        submitter: { select: { full_name: true, email: true } },
        job_request: { include: { company: true } },
        candidate_submissions: true,
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 });
    }

    // Authorization: agency owns the proposal OR company owns the job request
    if (user.userType === "AGENCY" && proposal.agency_id !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }
    if (user.userType === "COMPANY" && proposal.job_request.company_id !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    return NextResponse.json({ data: proposal });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;

  try {
    const body = await req.json() as { status: ProposalStatus };
    const { status } = body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: { job_request: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 });
    }

    // Agency can only WITHDRAW their own submitted proposals
    if (user.userType === "AGENCY") {
      if (proposal.agency_id !== user.entityId) {
        return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
      }
      if (status !== "WITHDRAWN") {
        return NextResponse.json({ error: "الوكالة يمكنها فقط سحب العرض" }, { status: 403 });
      }
      if (proposal.status !== "SUBMITTED") {
        return NextResponse.json({ error: "يمكن سحب العروض المقدمة فقط" }, { status: 400 });
      }
    }

    // Company can ACCEPT, REJECT, or SHORTLIST
    if (user.userType === "COMPANY") {
      if (proposal.job_request.company_id !== user.entityId) {
        return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
      }
      if (!["ACCEPTED", "REJECTED", "SHORTLISTED"].includes(status)) {
        return NextResponse.json({ error: "الإجراء غير مدعوم" }, { status: 400 });
      }
      if (["ACCEPTED", "REJECTED"].includes(status) && user.role !== "HR_MANAGER" && user.role !== "TA_LEAD") {
        return NextResponse.json({ error: "فقط مدير الموارد البشرية أو مسؤول الاستقطاب يمكنه قبول أو رفض العروض" }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "ACCEPTED" || status === "REJECTED") {
      updateData.responded_at = new Date();
    }

    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
