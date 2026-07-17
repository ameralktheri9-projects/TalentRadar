export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; appId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
  if (!companyUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify job request belongs to this company
  const jobRequest = await prisma.jobRequest.findUnique({ where: { id: params.id } });
  if (!jobRequest || jobRequest.company_id !== companyUser.company_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { status, feedbackNote } = body;

  const validStatuses = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW_INVITED", "REJECTED", "OFFER_MADE"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const application = await prisma.directApplication.update({
    where: { id: params.appId },
    data: {
      status,
      statusUpdatedAt: new Date(),
    },
    include: {
      profile: {
        select: { userId: true },
      },
    },
  });

  // Create notification for candidate if linked
  if (application.profile?.userId) {
    const statusLabels: Record<string, string> = {
      UNDER_REVIEW: "قيد المراجعة",
      INTERVIEW_INVITED: "تمت دعوتك لمقابلة",
      REJECTED: "تم رفض طلبك",
      OFFER_MADE: "تم تقديم عرض وظيفي",
    };
    const label = statusLabels[status];
    if (label) {
      await prisma.notification.create({
        data: {
          userId: application.profile.userId,
          userType: "CANDIDATE",
          event: "APPLICATION_STATUS_CHANGED",
          title: "تحديث حالة طلبك",
          body: `${label}${feedbackNote ? `: ${feedbackNote}` : ""}`,
          referenceId: params.appId,
          referenceType: "DirectApplication",
          channel: "IN_APP",
        },
      });
    }
  }

  return NextResponse.json(application);
}
