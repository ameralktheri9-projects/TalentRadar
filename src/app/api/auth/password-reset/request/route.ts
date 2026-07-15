export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, userType } = body

    if (!email || !userType) {
      return NextResponse.json({ message: "إذا كان البريد الإلكتروني صحيحاً، ستتلقى رابط إعادة التعيين" })
    }

    let user: { id: string; email: string; full_name?: string; firstName?: string } | null = null

    if (userType === "COMPANY") {
      user = await prisma.companyUser.findUnique({ where: { email } })
    } else if (userType === "AGENCY") {
      user = await prisma.agencyUser.findUnique({ where: { email } })
    } else if (userType === "CANDIDATE") {
      const cu = await prisma.candidateUser.findUnique({ where: { email } })
      if (cu) user = { id: cu.id, email: cu.email, firstName: cu.firstName }
    }

    if (user) {
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

      await prisma.passwordResetToken.create({
        data: { token, userType, userId: user.id, expiresAt },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const resetLink = `${appUrl}/reset-password?token=${token}`
      const name = (user as { full_name?: string }).full_name || (user as { firstName?: string }).firstName || email

      await sendEmail(email, EMAIL_TEMPLATES.PASSWORD_RESET, { name, resetLink })
    }

    return NextResponse.json({ message: "إذا كان البريد الإلكتروني صحيحاً، ستتلقى رابط إعادة التعيين" })
  } catch (err) {
    console.error("Password reset request error:", err)
    return NextResponse.json({ message: "إذا كان البريد الإلكتروني صحيحاً، ستتلقى رابط إعادة التعيين" })
  }
}
