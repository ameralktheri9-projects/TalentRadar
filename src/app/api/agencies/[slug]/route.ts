export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Try by publicSlug first, then by id
  let agency = await prisma.agency.findUnique({
    where: { publicSlug: slug },
    include: {
      ratings: {
        orderBy: { created_at: "desc" },
        take: 5,
        select: {
          score_speed: true,
          score_quality: true,
          score_professionalism: true,
          score_outcome: true,
          overall_score: true,
          comment: true,
          created_at: true,
        },
      },
    },
  });

  if (!agency) {
    agency = await prisma.agency.findUnique({
      where: { id: slug },
      include: {
        ratings: {
          orderBy: { created_at: "desc" },
          take: 5,
          select: {
            score_speed: true,
            score_quality: true,
            score_professionalism: true,
            score_outcome: true,
            overall_score: true,
            comment: true,
            created_at: true,
          },
        },
      },
    });
  }

  if (!agency || agency.status !== "ACTIVE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: agency.id,
    name_en: agency.name_en,
    name_ar: agency.name_ar,
    publicSlug: agency.publicSlug,
    bio: agency.bio,
    sector_tags: agency.sector_tags,
    client_types: agency.client_types,
    subscription_tier: agency.subscription_tier,
    rating_avg: agency.rating_avg,
    total_placements: agency.total_placements,
    avg_time_to_fill_days: agency.avg_time_to_fill_days,
    fill_rate: agency.fill_rate,
    response_rate: agency.response_rate,
    status: agency.status,
    hrsd_verified: agency.hrsd_verified,
    founded_year: agency.founded_year,
    team_size: agency.team_size,
    ratings: agency.ratings,
  });
}
