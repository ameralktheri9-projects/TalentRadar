export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { generateIcs } from "@/lib/calendar";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const { interviewId, confirmedSlot } = await req.json();
    if (!interviewId || !confirmedSlot) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { candidate_submission: true },
    });
    if (!interview) return NextResponse.json({ error: "المقابلة غير موجودة" }, { status: 404 });

    const startDate = new Date(confirmedSlot);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    const updated = await prisma.interview.update({
      where: { id: interviewId },
      data: { scheduled_at: startDate, outcome: "PENDING" },
    });

    // Generate ICS
    const icsContent = generateIcs({
      title: "مقابلة عمل - TalentRadar",
      startDate,
      endDate,
      description: "مقابلة عمل عبر الفيديو",
      location: "Video Call",
    });

    // Notify parties
    try {
      const submission = interview.candidate_submission;

      const agencyUsers = await prisma.agencyUser.findMany({
        where: { agency_id: submission.agency_id },
      });
      for (const au of agencyUsers) {
        await createNotification({
          userId: au.id,
          userType: "AGENCY_USER",
          event: "interview_confirmed",
          title: "تأكيد موعد المقابلة",
          body: `تم تأكيد موعد المقابلة: ${startDate.toLocaleDateString("ar-SA")}`,
          referenceId: interviewId,
          referenceType: "Interview",
          channel: "IN_APP",
        });
      }

      const companyUsers = await prisma.companyUser.findMany({
        where: { company_id: { not: undefined } },
      });
      // Notify the scheduler
      await createNotification({
        userId: interview.scheduled_by,
        userType: "COMPANY_USER",
        event: "interview_confirmed",
        title: "تأكيد موعد المقابلة",
        body: `تم تأكيد موعد المقابلة: ${startDate.toLocaleDateString("ar-SA")}`,
        referenceId: interviewId,
        referenceType: "Interview",
        channel: "IN_APP",
      });
    } catch (err) {
      console.error("[confirm interview notification]", err);
    }

    return NextResponse.json({ interview: updated, icsContent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
