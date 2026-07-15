export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sector = searchParams.get("sector");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));

  try {
    const where: Record<string, unknown> = { status: "OPEN" };
    if (sector) where.sector = sector;

    const [jobs, total] = await Promise.all([
      prisma.jobRequest.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          title: true,
          sector: true,
          experience_level: true,
          salary_min: true,
          salary_max: true,
          saudi_national_required: true,
          headcount: true,
          proposal_deadline: true,
          created_at: true,
          company: { select: { city: true } },
        },
      }),
      prisma.jobRequest.count({ where }),
    ]);

    return NextResponse.json({ data: jobs, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
