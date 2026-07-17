// TODO (Sprint 4): Replace profileId query param with proper candidate session auth.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId");

  if (!profileId) {
    return NextResponse.json({ error: "profileId query param required" }, { status: 400 });
  }

  try {
    const applications = await prisma.directApplication.findMany({
      where: { profileId },
      include: {
        profile: { select: { id: true } },
      },
      orderBy: { appliedAt: "desc" },
    });

    // Fetch job request details separately since DirectApplication doesn't have a Prisma relation to JobRequest model yet
    const jobRequestIds = Array.from(new Set(applications.map((a) => a.jobRequestId)));
    const jobRequests = await prisma.jobRequest.findMany({
      where: { id: { in: jobRequestIds } },
      select: { id: true, title: true, sector: true },
    });
    const jrMap = Object.fromEntries(jobRequests.map((jr) => [jr.id, jr]));

    const data = applications.map((a) => ({
      ...a,
      jobRequest: jrMap[a.jobRequestId] ?? null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
