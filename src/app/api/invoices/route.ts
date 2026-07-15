export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { generateZatcaQrCode } from "@/lib/zatca";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const where =
      user.userType === "COMPANY"
        ? { company_id: user.entityId }
        : user.userType === "AGENCY"
        ? { agency_id: user.entityId }
        : null;

    if (!where) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        placement: {
          include: {
            candidate_submission: { select: { full_name: true, current_title: true } },
          },
        },
        company: { select: { name_ar: true } },
        agency: { select: { name_ar: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: invoices });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const body = await req.json();
    const {
      placement_id,
      company_id,
      agency_id,
      gross_amount,
      platform_cut,
      agency_payout,
      vat_amount,
      total_amount,
      status,
      due_date,
    } = body;

    const invoice = await prisma.invoice.create({
      data: {
        placement_id,
        company_id,
        agency_id,
        gross_amount,
        platform_cut,
        agency_payout,
        vat_amount,
        total_amount,
        status: status ?? "DRAFT",
        due_date: due_date ? new Date(due_date) : undefined,
      },
    });

    // Generate ZATCA fields
    const zatcaUUID = crypto.randomUUID();
    const company = await prisma.company.findUnique({ where: { id: company_id } });
    const zatcaQrCode = generateZatcaQrCode({
      sellerName: company?.name_ar ?? "TalentRadar",
      vatNumber: company?.cr_number ?? "0000000000",
      timestamp: invoice.created_at.toISOString(),
      totalWithVat: total_amount.toString(),
      vatAmount: vat_amount.toString(),
    });

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { zatcaUUID, zatcaQrCode },
    });

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
