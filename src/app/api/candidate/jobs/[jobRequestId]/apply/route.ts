// TODO (Sprint 4): Require proper candidate session auth.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobRequestId: string } }
) {
  try {
    const body = await req.json();
    const { profileId, coverNote } = body;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    // Verify job request is open
    const jobRequest = await prisma.jobRequest.findUnique({
      where: { id: params.jobRequestId, status: "OPEN" },
      include: {
        company: {
          include: {
            users: { where: { is_primary: true }, take: 1 },
          },
        },
      },
    });

    if (!jobRequest) {
      return NextResponse.json({ error: "Job not found or closed" }, { status: 404 });
    }

    // Verify profile exists
    const profile = await prisma.candidateProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check for duplicate application
    const existing = await prisma.directApplication.findUnique({
      where: {
        profileId_jobRequestId: {
          profileId,
          jobRequestId: params.jobRequestId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already applied to this job" }, { status: 409 });
    }

    const application = await prisma.directApplication.create({
      data: {
        profileId,
        jobRequestId: params.jobRequestId,
        coverNote: coverNote?.slice(0, 500),
        status: "SUBMITTED",
      },
    });

    // Notify company HR manager about new direct application
    const companyUser = jobRequest.company.users[0];
    if (companyUser) {
      try {
        await createNotification({
          userId: companyUser.id,
          userType: "COMPANY_USER",
          event: "direct_application",
          title: "طلب توظيف مباشر",
          body: `تقدّم مرشح مباشراً على وظيفة "${jobRequest.title}"`,
          referenceId: application.id,
          referenceType: "DirectApplication",
          channel: "IN_APP",
        });
      } catch (notifError) {
        console.error("[apply notification]", notifError);
      }
    }

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
