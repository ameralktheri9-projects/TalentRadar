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
    const { tradeName, crNumber, sector, contactName, contactEmail, password, phone, ref } = body

    if (!tradeName || !crNumber || !sector || !contactName || !contactEmail || !password) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب تعبئتها" }, { status: 400 })
    }

    if (!/^\d{10}$/.test(crNumber)) {
      return NextResponse.json({ error: "رقم السجل التجاري يجب أن يكون 10 أرقام" }, { status: 400 })
    }

    const existing = await prisma.company.findUnique({ where: { cr_number: crNumber } })
    if (existing) {
      return NextResponse.json({ error: "رقم السجل التجاري مستخدم بالفعل" }, { status: 400 })
    }

    const existingUser = await prisma.companyUser.findUnique({ where: { email: contactEmail } })
    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const company = await prisma.company.create({
      data: {
        name_en: tradeName,
        name_ar: tradeName,
        cr_number: crNumber,
        industry_sector: sector,
        city: "RIYADH",
        saudi_employee_count: 0,
        total_employee_count: 0,
        status: "PENDING",
        ...(ref ? { referredByCode: ref as string } : {}),
      },
    })

    const companyUser = await prisma.companyUser.create({
      data: {
        company_id: company.id,
        full_name: contactName,
        email: contactEmail,
        password_hash: passwordHash,
        role: "HR_MANAGER",
        is_primary: true,
        status: "ACTIVE",
        ...(phone ? {} : {}),
      },
    })

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.otpToken.create({
      data: {
        token: otp,
        userType: "COMPANY",
        userId: companyUser.id,
        expiresAt,
      },
    })

    await sendEmail(contactEmail, EMAIL_TEMPLATES.OTP_VERIFICATION, {
      name: contactName,
      otp,
      expiresIn: "15 minutes",
    })

    return NextResponse.json(
      { message: "تحقق من بريدك الإلكتروني للحصول على رمز التحقق" },
      { status: 201 }
    )
  } catch (err) {
    console.error("Company register error:", err)
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 400 })
  }
}
