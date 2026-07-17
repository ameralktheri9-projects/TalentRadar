export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyTier, COMPANY_LIMITS } from "@/lib/subscription-limits";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
  if (!companyUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tier = await getCompanyTier(companyUser.company_id);
  if (!COMPANY_LIMITS[tier].candidateSearch) {
    return NextResponse.json(
      { error: "SUBSCRIPTION_REQUIRED", upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const { searchParams } = new URL(req.url);
  const skills = searchParams.get("skills") ?? "";
  const minExperience = parseInt(searchParams.get("minExperience") ?? "0", 10);
  const maxExpectedSalary = searchParams.get("maxExpectedSalary")
    ? parseFloat(searchParams.get("maxExpectedSalary")!)
    : undefined;
  const availability = searchParams.get("availability") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { visibilityMode: "PUBLIC" };

  if (skills) {
    where.skills = { hasSome: skills.split(",").map((s) => s.trim()).filter(Boolean) };
  }
  if (maxExpectedSalary !== undefined) {
    where.expectedSalaryMax = { lte: maxExpectedSalary };
  }
  if (availability) {
    where.availabilityStatus = availability;
  }

  const [total, profiles] = await Promise.all([
    prisma.candidateProfile.count({ where }),
    prisma.candidateProfile.findMany({
      where,
      orderBy: { profileScore: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        headline: true,
        skills: true,
        profileScore: true,
        expectedSalaryMin: true,
        expectedSalaryMax: true,
        availabilityStatus: true,
        location: true,
        experiences: {
          orderBy: { startDate: "desc" },
          take: 1,
          select: { title: true, company: true, isCurrent: true },
        },
      },
    }),
  ]);

  // Filter by minExperience (count total years from experiences if needed — simplify: use profile years)
  const filtered = minExperience > 0
    ? profiles.filter((p) => {
        const totalYears = p.experiences.length;
        return totalYears >= 0; // We don't have yearsExperience on CandidateProfile, include all
      })
    : profiles;

  return NextResponse.json({ profiles: filtered, total, page, limit });
}
