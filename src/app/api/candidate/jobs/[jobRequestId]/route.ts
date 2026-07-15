export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
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

    return NextResponse.json({ data: job });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
