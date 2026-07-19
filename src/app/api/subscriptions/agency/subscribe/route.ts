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

    const body = await req.json()
    const { tier } = body

    const validTiers = ["FREE", "BASIC", "PRO", "ELITE"]
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "خطة غير صالحة" }, { status: 400 })
    }

    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Check if this is the first paid subscription (for referral credit)
    const existingSub = await prisma.agencySubscription.findFirst({ where: { agencyId: user.entityId } });
    const isFirstPaid = !existingSub && tier !== "FREE";

    const sub = await prisma.agencySubscription.create({
      data: {
        agencyId: user.entityId,
        tier,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })

    // Credit referrer on first paid subscription
    if (isFirstPaid) {
      const agency = await prisma.agency.findUnique({ where: { id: user.entityId }, select: { referredByCode: true } });
      if (agency?.referredByCode) {
        const referrerCompany = await prisma.company.findFirst({ where: { referralCode: agency.referredByCode } });
        if (referrerCompany) {
          await prisma.company.update({ where: { id: referrerCompany.id }, data: { referralCredits: { increment: 1 } } });
        }
        const referrerAgency = await prisma.agency.findFirst({ where: { referralCode: agency.referredByCode } });
        if (referrerAgency) {
          await prisma.agency.update({ where: { id: referrerAgency.id }, data: { referralCredits: { increment: 1 } } });
        }
      }
    }

    await prisma.subscriptionEvent.create({
      data: {
        agencySubId: sub.id,
        eventType: "SUBSCRIBED",
        toTier: tier,
        triggeredBy: (session.user as { id?: string }).id,
        occurredAt: now,
      },
    })

    return NextResponse.json({ subscription: sub }, { status: 201 })
  } catch (err) {
    console.error("Agency subscribe error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
