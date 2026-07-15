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
    if (user.userType !== "COMPANY" || !user.entityId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const sub = await prisma.companySubscription.findUnique({
      where: { companyId: user.entityId },
    })

    if (!sub || sub.status === "CANCELLED") {
      return NextResponse.json({ error: "لا يوجد اشتراك نشط" }, { status: 404 })
    }

    const updated = await prisma.companySubscription.update({
      where: { companyId: user.entityId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    })

    return NextResponse.json({ subscription: updated })
  } catch (err) {
    console.error("Company cancel error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
