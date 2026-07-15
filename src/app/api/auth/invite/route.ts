export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const user = session.user as { userType?: string; entityId?: string }
    if (!user.entityId || (user.userType !== "COMPANY" && user.userType !== "AGENCY")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "البريد الإلكتروني والدور مطلوبان" }, { status: 400 })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.orgInvite.create({
      data: {
        token,
        orgType: user.userType,
        orgId: user.entityId,
        email,
        role,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    await sendEmail(email, EMAIL_TEMPLATES.ORG_INVITE, {
      inviteLink: `${appUrl}/accept-invite/${token}`,
      role,
    })

    return NextResponse.json({ message: "تم إرسال الدعوة بنجاح" }, { status: 201 })
  } catch (err) {
    console.error("Invite error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء إرسال الدعوة" }, { status: 400 })
  }
}
