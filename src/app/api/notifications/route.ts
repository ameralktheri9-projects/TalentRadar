export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = session.user as { id?: string; userType?: string }
    if (!user.id) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id, userType: user.userType },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unread = notifications.filter((n) => !n.readAt)
    const recent = notifications.slice(0, 20)

    return NextResponse.json({
      unread,
      recent,
      unreadCount: unread.length,
    })
  } catch (err) {
    console.error("Notifications error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
