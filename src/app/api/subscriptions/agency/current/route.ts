export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
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

    return NextResponse.json({ subscription: sub })
  } catch (err) {
    console.error("Agency current sub error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
