export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = session.user as { id?: string; userType?: string }
    if (!user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    await prisma.notification.updateMany({
      where: { userId: user.id, userType: user.userType, readAt: null },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ message: "تم تحديد جميع الإشعارات كمقروءة" })
  } catch (err) {
    console.error("Read all error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
