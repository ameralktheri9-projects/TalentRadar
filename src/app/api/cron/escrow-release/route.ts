export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const placements = await prisma.placement.findMany({
    where: {
      guaranteeExpiresAt: { lt: now },
      escrowReleasedAt: null,
      escrowTransactions: {
        some: { payoutStatus: "PENDING" },
      },
    },
    include: {
      agency: true,
      escrowTransactions: { where: { payoutStatus: "PENDING" } },
    },
  });

  let released = 0;

  for (const placement of placements) {
    for (const escrow of placement.escrowTransactions) {
      await prisma.escrowTransaction.update({
        where: { id: escrow.id },
        data: {
          payoutStatus: "INITIATED",
          releasedAt: now,
          releaseReason: "Auto-release after 90-day guarantee",
        },
      });
    }

    await prisma.placement.update({
      where: { id: placement.id },
      data: { escrowReleasedAt: now },
    });

    const agencyUser = await prisma.agencyUser.findFirst({
      where: { agency_id: placement.agency_id },
    });

    if (agencyUser) {
      await createNotification({
        userId: agencyUser.id,
        userType: "AGENCY_USER",
        event: "escrow_auto_released",
        title: "تم الإفراج التلقائي عن الضمان",
        body: "انتهت فترة الضمان (90 يوماً) وتم الإفراج عن مبلغ الضمان تلقائياً",
        referenceId: placement.id,
        referenceType: "Placement",
        channel: "IN_APP",
      });
    }

    released++;
  }

  return NextResponse.json({ released });
}
