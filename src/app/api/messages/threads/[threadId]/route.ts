export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const thread = await prisma.messageThread.findUnique({
      where: { id: params.threadId },
      include: { proposal: { include: { job_request: { select: { title: true } }, agency: { select: { name_ar: true } } } } },
    });

    if (!thread) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });

    if (user.userType === "COMPANY" && thread.companyId !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }
    if (user.userType === "AGENCY" && thread.agencyId !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    const messageFilter: Record<string, unknown> = { threadId: params.threadId };
    if (user.userType === "AGENCY") {
      messageFilter.isInternalNote = false;
    }

    const messages = await prisma.message.findMany({
      where: messageFilter,
      orderBy: { createdAt: "asc" },
    });

    // Mark unread
    const now = new Date();
    if (user.userType === "COMPANY") {
      await prisma.message.updateMany({
        where: { threadId: params.threadId, readByCompanyAt: null },
        data: { readByCompanyAt: now },
      });
    } else if (user.userType === "AGENCY") {
      await prisma.message.updateMany({
        where: { threadId: params.threadId, readByAgencyAt: null, isInternalNote: false },
        data: { readByAgencyAt: now },
      });
    }

    return NextResponse.json({ thread, messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
