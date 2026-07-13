export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { JobRequestStatus } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;

  try {
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        creator: { select: { full_name: true, email: true } },
        proposals: {
          include: {
            agency: true,
            submitter: { select: { full_name: true } },
            candidate_submissions: true,
          },
        },
      },
    });

    if (!jobRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Authorization check
    if (user.userType === "COMPANY") {
      if (jobRequest.company_id !== user.entityId) {
        return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
      }
    } else if (user.userType === "AGENCY") {
      // Agency must have matching sector tag
      const agency = await prisma.agency.findUnique({ where: { id: user.entityId } });
      if (!agency || !agency.sector_tags.includes(jobRequest.sector)) {
        return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
      }
    }

    return NextResponse.json({ data: jobRequest });
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
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body as { status: JobRequestStatus };

    const jobRequest = await prisma.jobRequest.findUnique({ where: { id: params.id } });
    if (!jobRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (jobRequest.company_id !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    // Only HR_MANAGER or TA_LEAD can publish
    if (status === "OPEN" && user.role !== "HR_MANAGER" && user.role !== "TA_LEAD") {
      return NextResponse.json({ error: "فقط مدير الموارد البشرية أو مسؤول الاستقطاب يمكنه نشر الطلب" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "OPEN") updateData.opened_at = new Date();
    if (status === "CLOSED") updateData.closed_at = new Date();

    const updated = await prisma.jobRequest.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
