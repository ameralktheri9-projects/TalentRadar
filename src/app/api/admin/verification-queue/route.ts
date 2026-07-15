export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = session.user as { userType?: string }
    if (user.userType !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const [companies, agencies] = await Promise.all([
      prisma.company.findMany({
        where: { status: "PENDING" },
        orderBy: { created_at: "desc" },
      }),
      prisma.agency.findMany({
        where: { status: "PENDING" },
        orderBy: { created_at: "desc" },
      }),
    ])

    return NextResponse.json({ companies, agencies })
  } catch (err) {
    console.error("Verification queue error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
