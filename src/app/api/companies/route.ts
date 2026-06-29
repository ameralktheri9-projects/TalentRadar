import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const companies = await prisma.company.findMany({
      include: { users: { where: { is_primary: true } } },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: companies });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name_ar,
      name_en,
      cr_number,
      industry_sector,
      city,
      saudi_employee_count,
      total_employee_count,
      contact_name,
      contact_email,
      contact_password,
    } = body;

    if (!name_ar || !name_en || !cr_number || !contact_email || !contact_password) {
      return NextResponse.json({ error: "الرجاء ملء جميع الحقول المطلوبة" }, { status: 400 });
    }

    // Check existing CR or email
    const existingCR = await prisma.company.findUnique({ where: { cr_number } });
    if (existingCR) {
      return NextResponse.json({ error: "رقم السجل التجاري مسجل مسبقاً" }, { status: 400 });
    }

    const existingEmail = await prisma.companyUser.findUnique({ where: { email: contact_email } });
    if (existingEmail) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(contact_password, 12);

    const company = await prisma.company.create({
      data: {
        name_ar,
        name_en,
        cr_number,
        industry_sector,
        city,
        saudi_employee_count: saudi_employee_count || 0,
        total_employee_count: total_employee_count || 0,
        status: "PENDING",
        users: {
          create: {
            full_name: contact_name,
            email: contact_email,
            password_hash,
            role: "HR_MANAGER",
            is_primary: true,
            status: "ACTIVE",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({ data: company, message: "تم تسجيل الشركة بنجاح. يرجى انتظار موافقة الإدارة." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
