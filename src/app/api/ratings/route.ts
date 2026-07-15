export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      placement_id,
      speed,
      candidateQuality,
      communication,
      valueForMoney,
      overall,
      comment,
    } = body;

    if (!placement_id || !speed || !candidateQuality || !communication || !valueForMoney || !overall) {
      return NextResponse.json(
        { error: "placement_id and all 5 dimension scores are required" },
        { status: 400 }
      );
    }

    const dimScores = [speed, candidateQuality, communication, valueForMoney, overall];
    if (dimScores.some((s) => s < 1 || s > 5)) {
      return NextResponse.json({ error: "All scores must be between 1 and 5" }, { status: 400 });
    }

    const placement = await prisma.placement.findUnique({
      where: { id: placement_id },
      include: { rating: true },
    });

    if (!placement) return NextResponse.json({ error: "Placement not found" }, { status: 404 });
    if (placement.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (placement.status !== "STARTED") {
      return NextResponse.json({ error: "Placement must be STARTED to rate" }, { status: 400 });
    }
    if (placement.rating) {
      return NextResponse.json({ error: "Rating already submitted for this placement" }, { status: 409 });
    }

    // overall_score = average of all 5 dimensions
    const overallScore = dimScores.reduce((a, b) => a + b, 0) / 5;

    const rating = await prisma.$transaction(async (tx) => {
      const r = await tx.rating.create({
        data: {
          placement_id,
          rated_by: user.id,
          agency_id: placement.agency_id,
          // Map 5 dimensions to the 4 existing schema fields + store detail
          score_speed: speed,
          score_quality: candidateQuality,
          score_professionalism: communication,
          score_outcome: valueForMoney,
          overall_score: overallScore,
          comment,
        },
      });

      await tx.ratingDetail.create({
        data: {
          ratingId: r.id,
          speed,
          candidateQuality,
          communication,
          valueForMoney,
          overall,
        },
      });

      return r;
    });

    // Recalculate agency rating_avg
    const allRatings = await prisma.rating.findMany({
      where: { agency_id: placement.agency_id },
      select: { overall_score: true },
    });
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.overall_score, 0) / allRatings.length;

    await prisma.agency.update({
      where: { id: placement.agency_id },
      data: { rating_avg: avgRating },
    });

    return NextResponse.json({ data: rating }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
