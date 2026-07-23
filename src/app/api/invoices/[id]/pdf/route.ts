export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { InvoicePDF } from "@/lib/invoice-pdf";
import React from "react";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY" && user.userType !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        placement: {
          include: {
            candidate_submission: { select: { full_name: true, current_title: true } },
          },
        },
        company: { select: { name_ar: true, cr_number: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.userType === "COMPANY" && invoice.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate QR code image from ZATCA TLV base64 string
    let qrImageBase64: string | undefined;
    if (invoice.zatcaQrCode) {
      const qrDataUrl = await QRCode.toDataURL(invoice.zatcaQrCode, {
        width: 180,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      // strip "data:image/png;base64," prefix
      qrImageBase64 = qrDataUrl.split(",")[1];
    }

    // eslint-disable-next-line
    const element = (React.createElement as Function)(InvoicePDF, {
      invoice: {
        id: invoice.id,
        zatcaUUID: invoice.zatcaUUID,
        zatcaQrCode: invoice.zatcaQrCode,
        gross_amount: invoice.gross_amount,
        vat_amount: invoice.vat_amount,
        total_amount: invoice.total_amount,
        status: invoice.status,
        created_at: invoice.created_at,
        due_date: invoice.due_date,
      },
      company: {
        name_ar: invoice.company.name_ar,
        cr_number: invoice.company.cr_number,
      },
      placement: {
        candidate_submission: {
          full_name: invoice.placement.candidate_submission.full_name,
          current_title: invoice.placement.candidate_submission.current_title,
        },
      },
      qrImageBase64,
    });

    // eslint-disable-next-line
    const pdfBuffer = await (renderToBuffer as Function)(element);

    const safeId = invoice.id.replace(/[^a-zA-Z0-9-]/g, "");
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${safeId}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
