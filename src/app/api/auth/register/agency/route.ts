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
    const { agencyName, hrsdLicenseNumber, ownerName, email, password, phone, specializations } = body

    if (!agencyName || !hrsdLicenseNumber || !ownerName || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب تعبئتها" }, { status: 400 })
    }

    const existingAgency = await prisma.agency.findUnique({ where: { hrsd_licence: hrsdLicenseNumber } })
    if (existingAgency) {
      return NextResponse.json({ error: "رقم الترخيص مستخدم بالفعل" }, { status: 400 })
    }

    const existingUser = await prisma.agencyUser.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const agency = await prisma.agency.create({
      data: {
        name_en: agencyName,
        name_ar: agencyName,
        hrsd_licence: hrsdLicenseNumber,
        team_size: 1,
        status: "PENDING",
        subscription_tier: "FREE",
        rating_avg: 0,
        total_placements: 0,
        avg_time_to_fill_days: 0,
        fill_rate: 0,
        response_rate: 0,
        sector_tags: specializations || [],
      },
    })

    const agencyUser = await prisma.agencyUser.create({
      data: {
        agency_id: agency.id,
        full_name: ownerName,
        email,
        password_hash: passwordHash,
        role: "OWNER",
        status: "ACTIVE",
      },
    })

    const now = new Date()
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    await prisma.agencySubscription.create({
      data: {
        agencyId: agency.id,
        tier: "PRO",
        status: "TRIALING",
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialEndsAt: trialEnd,
      },
    })

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.otpToken.create({
      data: {
        token: otp,
        userType: "AGENCY",
        userId: agencyUser.id,
        expiresAt,
      },
    })

    await sendEmail(email, EMAIL_TEMPLATES.OTP_VERIFICATION, {
      name: ownerName,
      otp,
      expiresIn: "15 minutes",
    })

    return NextResponse.json(
      { message: "تحقق من بريدك الإلكتروني للحصول على رمز التحقق" },
      { status: 201 }
    )
  } catch (err) {
    console.error("Agency register error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 400 })
  }
}
