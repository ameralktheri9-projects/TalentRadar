export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const user = session.user as { userType?: string }
    if (user.userType !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    const body = await req.json()
    const { reason, type } = body
    const { id } = params

    if (type === "COMPANY") {
      const company = await prisma.company.update({
        where: { id },
        data: { status: "SUSPENDED" },
        include: { users: { where: { is_primary: true } } },
      })
      if (company.users[0]) {
        await sendEmail(company.users[0].email, EMAIL_TEMPLATES.PROPOSAL_RECEIVED, {
          name: company.users[0].full_name,
          message: `لم يتم قبول تسجيل شركتكم. السبب: ${reason || "لم يُذكر"}`,
        })
      }
    } else if (type === "AGENCY") {
      const agency = await prisma.agency.update({
        where: { id },
        data: { status: "REJECTED" },
        include: { users: { where: { role: "OWNER" } } },
      })
      if (agency.users[0]) {
        await sendEmail(agency.users[0].email, EMAIL_TEMPLATES.PROPOSAL_RECEIVED, {
          name: agency.users[0].full_name,
          message: `لم يتم قبول تسجيل وكالتكم. السبب: ${reason || "لم يُذكر"}`,
        })
      }
    }

    return NextResponse.json({ message: "تم الرفض بنجاح" })
  } catch (err) {
    console.error("Reject error:", err)
    return NextResponse.json({ error: "حدث خطأ" }, { status: 400 })
  }
}
