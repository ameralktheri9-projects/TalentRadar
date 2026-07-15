export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY" && user.userType !== "AGENCY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const thread = await prisma.messageThread.findUnique({ where: { id: params.threadId } });
    if (!thread) return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });

    if (user.userType === "COMPANY" && thread.companyId !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }
    if (user.userType === "AGENCY" && thread.agencyId !== user.entityId) {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    const { body, isInternalNote } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });

    const senderType = user.userType === "COMPANY" ? "COMPANY" : "AGENCY";

    const message = await prisma.message.create({
      data: {
        threadId: params.threadId,
        senderType,
        senderId: (user as AuthUser & { id: string }).id,
        body,
        isInternalNote: user.userType === "COMPANY" ? (isInternalNote ?? false) : false,
      },
    });

    await prisma.messageThread.update({
      where: { id: params.threadId },
      data: { lastActivityAt: new Date() },
    });

    // Notify the other party
    try {
      const notifBody = body.slice(0, 80);
      if (user.userType === "COMPANY") {
        const agencyUsers = await prisma.agencyUser.findMany({ where: { agency_id: thread.agencyId } });
        for (const au of agencyUsers) {
          await createNotification({
            userId: au.id,
            userType: "AGENCY_USER",
            event: "new_message",
            title: "رسالة جديدة",
            body: notifBody,
            referenceId: params.threadId,
            referenceType: "MessageThread",
            channel: "IN_APP",
          });
        }
      } else {
        const companyUsers = await prisma.companyUser.findMany({ where: { company_id: thread.companyId } });
        for (const cu of companyUsers) {
          await createNotification({
            userId: cu.id,
            userType: "COMPANY_USER",
            event: "new_message",
            title: "رسالة جديدة",
            body: notifBody,
            referenceId: params.threadId,
            referenceType: "MessageThread",
            channel: "IN_APP",
          });
        }
      }
    } catch (notifErr) {
      console.error("[message notification]", notifErr);
    }

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
