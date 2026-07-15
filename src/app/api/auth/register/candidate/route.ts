export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email"

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, password, phone } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب تعبئتها" }, { status: 400 })
    }

    const existing = await prisma.candidateUser.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const candidateUser = await prisma.candidateUser.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
      },
    })

    await prisma.candidateProfile.create({
      data: {
        userId: candidateUser.id,
        profileScore: 0,
        skills: [],
        languages: [],
      },
    })

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.otpToken.create({
      data: {
        token: otp,
        userType: "CANDIDATE",
        userId: candidateUser.id,
        expiresAt,
      },
    })

    await sendEmail(email, EMAIL_TEMPLATES.OTP_VERIFICATION, {
      name: firstName,
      otp,
      expiresIn: "15 minutes",
    })

    return NextResponse.json(
      { message: "تحقق من بريدك الإلكتروني للحصول على رمز التحقق" },
      { status: 201 }
    )
  } catch (err) {
    console.error("Candidate register error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 400 })
  }
}
