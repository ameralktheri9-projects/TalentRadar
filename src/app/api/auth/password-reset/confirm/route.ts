export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 })
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    if (resetToken.userType === "COMPANY") {
      await prisma.companyUser.update({
        where: { id: resetToken.userId },
        data: { password_hash: passwordHash },
      })
    } else if (resetToken.userType === "AGENCY") {
      await prisma.agencyUser.update({
        where: { id: resetToken.userId },
        data: { password_hash: passwordHash },
      })
    } else if (resetToken.userType === "CANDIDATE") {
      await prisma.candidateUser.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      })
    }

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ message: "تم إعادة تعيين كلمة المرور بنجاح" })
  } catch (err) {
    console.error("Password reset confirm error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء إعادة التعيين" }, { status: 400 })
  }
}
