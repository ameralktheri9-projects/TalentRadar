export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await req.json()
    const { firstName, lastName, password } = body

    if (!firstName || !lastName || !password) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 })
    }

    const invite = await prisma.orgInvite.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: "رابط الدعوة غير صالح أو منتهي الصلاحية" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const fullName = `${firstName} ${lastName}`

    if (invite.orgType === "COMPANY") {
      await prisma.companyUser.create({
        data: {
          company_id: invite.orgId,
          full_name: fullName,
          email: invite.email,
          password_hash: passwordHash,
          role: invite.role as "HR_MANAGER" | "TA_LEAD" | "BU_MANAGER",
          status: "ACTIVE",
        },
      })
    } else if (invite.orgType === "AGENCY") {
      await prisma.agencyUser.create({
        data: {
          agency_id: invite.orgId,
          full_name: fullName,
          email: invite.email,
          password_hash: passwordHash,
          role: invite.role as "OWNER" | "RECRUITER" | "FINANCE",
          status: "ACTIVE",
        },
      })
    }

    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    })

    return NextResponse.json({ message: "تم قبول الدعوة بنجاح" })
  } catch (err) {
    console.error("Accept invite error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء قبول الدعوة" }, { status: 400 })
  }
}
