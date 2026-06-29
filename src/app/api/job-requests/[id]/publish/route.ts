import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  // Only HR_MANAGER or TA_LEAD can publish
  if (user.role !== "HR_MANAGER" && user.role !== "TA_LEAD") {
    return NextResponse.json({ error: "فقط مدير الموارد البشرية أو مسؤول الاستقطاب يمكنه نشر الطلب" }, { status: 403 });
  }

  try {
    const jobRequest = await prisma.jobRequest.findUnique({ where: { id: params.id } });
    if (!jobRequest) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    if (jobRequest.company_id !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    // Validate proposal_deadline at least 24h from now
    if (!jobRequest.proposal_deadline) {
      return NextResponse.json({ error: "يجب تحديد الموعد النهائي للعروض" }, { status: 400 });
    }

    const minDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (jobRequest.proposal_deadline < minDeadline) {
      return NextResponse.json({ error: "يجب أن يكون الموعد النهائي للعروض بعد 24 ساعة على الأقل من الآن" }, { status: 400 });
    }

    // Validate salary range
    if (jobRequest.salary_min >= jobRequest.salary_max) {
      return NextResponse.json({ error: "يجب أن يكون الراتب الأدنى أقل من الراتب الأقصى" }, { status: 400 });
    }

    const updated = await prisma.jobRequest.update({
      where: { id: params.id },
      data: {
        status: "OPEN",
        opened_at: new Date(),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
