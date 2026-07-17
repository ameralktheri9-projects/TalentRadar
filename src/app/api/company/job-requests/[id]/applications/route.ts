export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify job request belongs to this company
  const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
  if (!companyUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const jobRequest = await prisma.jobRequest.findUnique({ where: { id: params.id } });
  if (!jobRequest || jobRequest.company_id !== companyUser.company_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const applications = await prisma.directApplication.findMany({
    where: { jobRequestId: params.id },
    include: {
      profile: {
        include: {
          experiences: { orderBy: { startDate: "desc" }, take: 3 },
        },
        select: {
          id: true,
          headline: true,
          profileScore: true,
          expectedSalaryMin: true,
          expectedSalaryMax: true,
          availabilityStatus: true,
          skills: true,
          experiences: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return NextResponse.json(applications);
}
