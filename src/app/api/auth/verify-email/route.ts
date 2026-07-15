export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otp, userType } = body

    if (!email || !otp || !userType) {
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 })
    }

    const otpToken = await prisma.otpToken.findFirst({
      where: {
        token: otp,
        userType,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!otpToken) {
      return NextResponse.json({ error: "رمز التحقق غير صالح أو منتهي الصلاحية" }, { status: 400 })
    }

    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { usedAt: new Date() },
    })

    if (userType === "CANDIDATE") {
      await prisma.candidateUser.update({
        where: { email },
        data: { emailVerifiedAt: new Date() },
      })
    }
    // COMPANY and AGENCY users don't have emailVerifiedAt — token marking is enough

    return NextResponse.json({ message: "تم التحقق من البريد الإلكتروني بنجاح" })
  } catch (err) {
    console.error("Verify email error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء التحقق" }, { status: 400 })
  }
}
