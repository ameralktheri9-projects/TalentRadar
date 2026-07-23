export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobRequestId: string } }
) {
  try {
    const job = await prisma.jobRequest.findUnique({
      where: { id: params.jobRequestId, status: "OPEN" },
      select: {
        id: true,
        title: true,
        description: true,
        sector: true,
        experience_level: true,
        salary_min: true,
        salary_max: true,
        saudi_national_required: true,
        headcount: true,
        sla_days: true,
        proposal_deadline: true,
        created_at: true,
        company: { select: { city: true, name_ar: true } },
      },
    });

    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check if the logged-in candidate has already applied
    let alreadyApplied = false;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const candidateUser = await prisma.candidateUser.findUnique({
        where: { id: (session.user as { id?: string }).id },
        include: { profile: { select: { id: true } } },
      });
      if (candidateUser?.profile?.id) {
        const existing = await prisma.directApplication.findUnique({
          where: {
            profileId_jobRequestId: {
              profileId: candidateUser.profile.id,
              jobRequestId: params.jobRequestId,
            },
          },
        });
        alreadyApplied = !!existing;
      }
    }

    return NextResponse.json({ data: job, alreadyApplied });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
