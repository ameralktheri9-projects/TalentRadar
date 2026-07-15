export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const { candidateSubmissionId, applicationId, proposedSlots, notes } = await req.json();

    if (!candidateSubmissionId && !applicationId) {
      return NextResponse.json({ error: "يجب تحديد المرشح أو الطلب" }, { status: 400 });
    }
    if (!proposedSlots || proposedSlots.length === 0) {
      return NextResponse.json({ error: "يجب تحديد موعد واحد على الأقل" }, { status: 400 });
    }

    const scheduledAt = new Date(proposedSlots[0]);
    const schedulerId = (user as AuthUser & { id: string }).id;

    let interview;

    if (candidateSubmissionId) {
      interview = await prisma.interview.create({
        data: {
          candidate_submission_id: candidateSubmissionId,
          scheduled_by: schedulerId,
          interview_type: "VIDEO",
          scheduled_at: scheduledAt,
          outcome: "PENDING",
          feedback: notes ?? null,
        },
      });

      // Notify agency users of the candidate's submission
      try {
        const submission = await prisma.candidateSubmission.findUnique({
          where: { id: candidateSubmissionId },
        });
        if (submission) {
          const agencyUsers = await prisma.agencyUser.findMany({
            where: { agency_id: submission.agency_id },
          });
          for (const au of agencyUsers) {
            await createNotification({
              userId: au.id,
              userType: "AGENCY_USER",
              event: "interview_proposed",
              title: "طلب مقابلة",
              body: `تم اقتراح موعد مقابلة للمرشح`,
              referenceId: interview.id,
              referenceType: "Interview",
              channel: "IN_APP",
            });
          }
        }
      } catch (err) {
        console.error("[interview notification]", err);
      }
    } else {
      const application = await prisma.directApplication.findUnique({
        where: { id: applicationId },
      });
      if (!application) {
        return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
      }

      // For direct applications we still need a candidateSubmission — we'll store notes in feedback
      // Create a dummy interview referencing the first candidate submission for this job request (best effort)
      // Per schema Interview requires candidate_submission_id, so we must have one
      const submission = await prisma.candidateSubmission.findFirst({
        where: { proposal: { job_request_id: application.jobRequestId } },
      });

      if (!submission) {
        return NextResponse.json({ error: "لا يوجد مرشح مرتبط" }, { status: 400 });
      }

      interview = await prisma.interview.create({
        data: {
          candidate_submission_id: submission.id,
          scheduled_by: schedulerId,
          interview_type: "VIDEO",
          scheduled_at: scheduledAt,
          outcome: "PENDING",
          feedback: notes ?? null,
        },
      });

      await prisma.directApplication.update({
        where: { id: applicationId },
        data: { status: "INTERVIEW_INVITED" },
      });
    }

    return NextResponse.json({ interviewId: interview.id, proposedSlots }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
