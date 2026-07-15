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
      where.created_at = {};
      if (from) (where.created_at as Record<string, Date>).gte = new Date(from);
      if (to) (where.created_at as Record<string, Date>).lte = new Date(to);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Invoices");

    sheet.columns = [
      { header: "Invoice ID", key: "id", width: 36 },
      { header: "Placement ID", key: "placement_id", width: 36 },
      { header: "Amount", key: "gross_amount", width: 16 },
      { header: "VAT", key: "vat_amount", width: 16 },
      { header: "Total", key: "total_amount", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Created Date", key: "created_at", width: 24 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    headerRow.alignment = { horizontal: "center" };

    for (const inv of invoices) {
      sheet.addRow({
        id: inv.id,
        placement_id: inv.placement_id,
        gross_amount: inv.gross_amount,
        vat_amount: inv.vat_amount,
        total_amount: inv.total_amount,
        status: inv.status,
        created_at: inv.created_at.toISOString(),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="invoices-${Date.now()}.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
