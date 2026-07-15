export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = session.user as { userType?: string; entityId?: string }
    if (user.userType !== "AGENCY" || !user.entityId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const sub = await prisma.agencySubscription.findFirst({
      where: { agencyId: user.entityId, status: { in: ["ACTIVE", "TRIALING"] } },
      orderBy: { createdAt: "desc" },
    })

    if (!sub) {
      return NextResponse.json({ error: "لا يوجد اشتراك نشط" }, { status: 404 })
    }

    const updated = await prisma.agencySubscription.update({
      where: { id: sub.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    })

    await prisma.subscriptionEvent.create({
      data: {
        agencySubId: sub.id,
        eventType: "CANCELLED",
        fromTier: sub.tier,
        triggeredBy: (session.user as { id?: string }).id,
      },
    })

    return NextResponse.json({ subscription: updated })
  } catch (err) {
    console.error("Agency cancel error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
