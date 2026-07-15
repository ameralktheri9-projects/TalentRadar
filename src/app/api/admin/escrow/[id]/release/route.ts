export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { reason } = body;

  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: params.id },
    include: { placement: { include: { agency: true } } },
  });

  if (!escrow) return NextResponse.json({ error: "Escrow transaction not found" }, { status: 404 });

  await prisma.escrowTransaction.update({
    where: { id: params.id },
    data: {
      payoutStatus: "INITIATED",
      releasedAt: new Date(),
      releaseReason: reason ?? "Released by admin",
    },
  });

  await prisma.placement.update({
    where: { id: escrow.placementId },
    data: { escrowReleasedAt: new Date() },
  });

  const agencyUser = await prisma.agencyUser.findFirst({
    where: { agency_id: escrow.placement.agency_id },
  });

  if (agencyUser) {
    await createNotification({
      userId: agencyUser.id,
      userType: "AGENCY_USER",
      event: "escrow_released",
      title: "تم الإفراج عن الضمان",
      body: `تم الإفراج عن مبلغ الضمان (${escrow.amount} ر.س) وسيتم تحويله إليكم قريباً`,
      referenceId: escrow.placementId,
      referenceType: "Placement",
      channel: "IN_APP",
    });
  }

  return NextResponse.json({ message: "Escrow released" });
}
