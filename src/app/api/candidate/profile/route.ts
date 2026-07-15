// TODO (Sprint 4): Replace X-Candidate-ID header with proper next-auth session for CandidateUser.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcProfileScore(p: {
  headline?: string | null;
  aboutMe?: string | null;
  photoUrl?: string | null;
  cvUrl?: string | null;
  skills?: string[];
  expectedSalaryMin?: number | null;
  availabilityStatus?: string | null;
  location?: string | null;
  experiences?: unknown[];
  education?: unknown[];
}): number {
  let score = 0;
  if (p.headline) score += 10;
  if (p.aboutMe) score += 10;
  if (p.photoUrl) score += 10;
  if (p.cvUrl) score += 10;
  if (p.skills && p.skills.length > 0) score += 15;
  if (p.experiences && p.experiences.length > 0) score += 20;
  if (p.education && p.education.length > 0) score += 10;
  if (p.expectedSalaryMin) score += 5;
  if (p.availabilityStatus) score += 5;
  if (p.location) score += 5;
  return score;
}

export async function GET(req: NextRequest) {
  const candidateId = req.headers.get("x-candidate-id");
  if (!candidateId) {
    return NextResponse.json({ error: "X-Candidate-ID header required" }, { status: 401 });
  }

  try {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
      include: { experiences: true, education: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // TODO (Sprint 4): Replace with proper auth
  const candidateId = req.headers.get("x-candidate-id");

  try {
    const body = await req.json();
    const {
      headline,
      aboutMe,
      photoUrl,
      cvUrl,
      skills,
      languages,
      expectedSalaryMin,
      expectedSalaryMax,
      availabilityStatus,
      visibilityMode,
      location,
      consentGiven,
    } = body;

    if (!candidateId) {
      // Allow unauthenticated updates during onboarding (Sprint 2 stub)
      return NextResponse.json({ data: { message: "Profile update accepted (no auth)" } });
    }

    const existing = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
      include: { experiences: true, education: true },
    });

    const updateData = {
      ...(headline !== undefined && { headline }),
      ...(aboutMe !== undefined && { aboutMe }),
      ...(photoUrl !== undefined && { photoUrl }),
      ...(cvUrl !== undefined && { cvUrl }),
      ...(skills !== undefined && { skills }),
      ...(languages !== undefined && { languages }),
      ...(expectedSalaryMin !== undefined && { expectedSalaryMin: expectedSalaryMin ? Number(expectedSalaryMin) : null }),
      ...(expectedSalaryMax !== undefined && { expectedSalaryMax: expectedSalaryMax ? Number(expectedSalaryMax) : null }),
      ...(availabilityStatus !== undefined && { availabilityStatus }),
      ...(visibilityMode !== undefined && { visibilityMode }),
      ...(location !== undefined && { location }),
      ...(consentGiven !== undefined && { consentGiven }),
    };

    let profile;
    if (existing) {
      const merged = { ...existing, ...updateData };
      const score = calcProfileScore({
        ...merged,
        experiences: existing.experiences,
        education: existing.education,
      });
      profile = await prisma.candidateProfile.update({
        where: { userId: candidateId },
        data: { ...updateData, profileScore: score },
        include: { experiences: true, education: true },
      });
    } else {
      const score = calcProfileScore({ ...updateData, experiences: [], education: [] });
      profile = await prisma.candidateProfile.create({
        data: {
          userId: candidateId,
          ...updateData,
          profileScore: score,
        },
        include: { experiences: true, education: true },
      });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
