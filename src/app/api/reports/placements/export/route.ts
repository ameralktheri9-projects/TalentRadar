export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY" && user.userType !== "ADMIN") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (user.userType === "COMPANY") {
      const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
      if (!companyUser) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
      where.company_id = companyUser.company_id;
    }

    if (from || to) {
      where.offer_made_at = {};
      if (from) (where.offer_made_at as Record<string, Date>).gte = new Date(from);
      if (to) (where.offer_made_at as Record<string, Date>).lte = new Date(to);
    }

    const placements = await prisma.placement.findMany({
      where,
      include: {
        company: { select: { name_ar: true } },
        agency: { select: { name_ar: true } },
      },
      orderBy: { offer_made_at: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Placements");

    sheet.columns = [
      { header: "Placement ID", key: "id", width: 36 },
      { header: "Company", key: "company", width: 28 },
      { header: "Agency", key: "agency", width: 28 },
      { header: "Offer Amount", key: "offer_amount", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "Start Date", key: "start_date", width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    headerRow.alignment = { horizontal: "center" };

    for (const p of placements) {
      sheet.addRow({
        id: p.id,
        company: p.company.name_ar,
        agency: p.agency.name_ar,
        offer_amount: p.offer_amount,
        status: p.status,
        start_date: p.start_date ? p.start_date.toISOString() : "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="placements-${Date.now()}.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
