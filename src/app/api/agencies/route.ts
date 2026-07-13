export const dynamic = "force-dynamic";
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
    const agencies = await prisma.agency.findMany({
      where: { status: "ACTIVE" },
      orderBy: { rating_avg: "desc" },
    });
    return NextResponse.json({ data: agencies });
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
      hrsd_licence,
      founded_year,
      team_size,
      sector_tags,
      contact_name,
      contact_email,
      contact_password,
    } = body;

    if (!name_ar || !name_en || !hrsd_licence || !contact_email || !contact_password) {
      return NextResponse.json({ error: "الرجاء ملء جميع الحقول المطلوبة" }, { status: 400 });
    }

    const existingLicence = await prisma.agency.findUnique({ where: { hrsd_licence } });
    if (existingLicence) {
      return NextResponse.json({ error: "رقم الترخيص مسجل مسبقاً" }, { status: 400 });
    }

    const existingEmail = await prisma.agencyUser.findUnique({ where: { email: contact_email } });
    if (existingEmail) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل مسبقاً" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(contact_password, 12);

    const agency = await prisma.agency.create({
      data: {
        name_ar,
        name_en,
        hrsd_licence,
        founded_year,
        team_size: team_size || 1,
        sector_tags: sector_tags || [],
        status: "PENDING",
        users: {
          create: {
            full_name: contact_name,
            email: contact_email,
            password_hash,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      },
      include: { users: true },
    });

    return NextResponse.json({ data: agency, message: "تم تسجيل الوكالة بنجاح. يرجى انتظار موافقة الإدارة." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
