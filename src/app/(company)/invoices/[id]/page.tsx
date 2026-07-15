import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const user = session.user as AuthUser;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      placement: {
        include: {
          candidate_submission: { select: { full_name: true, current_title: true } },
          escrowTransactions: true,
        },
      },
      company: { select: { name_ar: true, cr_number: true } },
      agency: { select: { name_ar: true } },
    },
  });

  if (!invoice) notFound();

  // Auth: only company or agency that owns the invoice
  if (user.userType === "COMPANY" && invoice.company_id !== user.entityId) notFound();
  if (user.userType === "AGENCY" && invoice.agency_id !== user.entityId) notFound();

  const escrow = invoice.placement.escrowTransactions[0];
  const escrowStatus = escrow?.payoutStatus ?? null;

  const statusLabel: Record<string, string> = {
    DRAFT: "مسودة",
    ISSUED: "مُصدرة",
    PAID: "مدفوعة",
    DISPUTED: "متنازع عليها",
    REFUNDED: "مستردة",
  };

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    ISSUED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    DISPUTED: "bg-red-100 text-red-700",
    REFUNDED: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 text-white px-8 py-6 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tracking-wide">TalentRadar</div>
            <div className="text-sm text-slate-300 mt-1">منصة التوظيف B2B</div>
          </div>
          <div className="text-left">
            <div className="text-xl font-bold">فاتورة ضريبية</div>
            <div className="text-xs text-slate-300 mt-1">Tax Invoice</div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">رقم الفاتورة</div>
              <div className="font-mono font-semibold text-gray-800 text-xs mt-0.5">{invoice.id}</div>
            </div>
            <div>
              <div className="text-gray-500">تاريخ الإصدار</div>
              <div className="font-semibold text-gray-800 mt-0.5">
                {new Date(invoice.created_at).toLocaleDateString("ar-SA")}
              </div>
            </div>
            <div>
              <div className="text-gray-500">الشركة</div>
              <div className="font-semibold text-gray-800 mt-0.5">{invoice.company.name_ar}</div>
            </div>
            <div>
              <div className="text-gray-500">الوكالة</div>
              <div className="font-semibold text-gray-800 mt-0.5">{invoice.agency.name_ar}</div>
            </div>
            <div>
              <div className="text-gray-500">المرشح</div>
              <div className="font-semibold text-gray-800 mt-0.5">
                {invoice.placement.candidate_submission.full_name}
              </div>
            </div>
            <div>
              <div className="text-gray-500">تاريخ الاستحقاق</div>
              <div className="font-semibold text-gray-800 mt-0.5">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString("ar-SA")
                  : "—"}
              </div>
            </div>
          </div>

          {/* ZATCA */}
          {invoice.zatcaUUID && (
            <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
              <div className="text-xs font-semibold text-gray-500 mb-2">بيانات الفاتورة الإلكترونية (ZATCA)</div>
              <div className="flex gap-6 items-start">
                <div className="flex-1 space-y-1 text-xs text-gray-600">
                  <div><span className="text-gray-400">الرقم التسلسلي: </span>{invoice.zatcaUUID}</div>
                  {invoice.zatcaQrCode && (
                    <div className="mt-2">
                      <div className="text-gray-400 mb-1">QR Code (base64):</div>
                      <div className="font-mono text-xs break-all bg-white border border-gray-200 rounded p-2 max-h-16 overflow-hidden text-ellipsis">
                        {invoice.zatcaQrCode.substring(0, 80)}...
                      </div>
                    </div>
                  )}
                </div>
                {/* QR placeholder SVG */}
                <div className="w-20 h-20 border border-gray-300 rounded flex items-center justify-center bg-white shrink-0">
                  <svg viewBox="0 0 40 40" width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="16" height="16" fill="none" stroke="#1e293b" strokeWidth="2"/>
                    <rect x="5" y="5" width="10" height="10" fill="#1e293b"/>
                    <rect x="22" y="2" width="16" height="16" fill="none" stroke="#1e293b" strokeWidth="2"/>
                    <rect x="25" y="5" width="10" height="10" fill="#1e293b"/>
                    <rect x="2" y="22" width="16" height="16" fill="none" stroke="#1e293b" strokeWidth="2"/>
                    <rect x="5" y="25" width="10" height="10" fill="#1e293b"/>
                    <rect x="22" y="22" width="4" height="4" fill="#1e293b"/>
                    <rect x="28" y="22" width="4" height="4" fill="#1e293b"/>
                    <rect x="34" y="22" width="4" height="4" fill="#1e293b"/>
                    <rect x="22" y="28" width="4" height="4" fill="#1e293b"/>
                    <rect x="30" y="30" width="8" height="8" fill="#1e293b"/>
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Line items table */}
          <div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-right py-2 px-4 rounded-tr-lg">البند</th>
                  <th className="text-left py-2 px-4 rounded-tl-lg">المبلغ (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">خدمة التوظيف — {invoice.placement.candidate_submission.current_title ?? "مرشح"}</td>
                  <td className="py-3 px-4 text-left font-mono">{invoice.gross_amount.toLocaleString("ar-SA")}</td>
                </tr>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <td className="py-3 px-4 text-gray-500">الإجمالي قبل الضريبة</td>
                  <td className="py-3 px-4 text-left font-mono">{invoice.gross_amount.toLocaleString("ar-SA")}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-500">ضريبة القيمة المضافة (15%)</td>
                  <td className="py-3 px-4 text-left font-mono">{invoice.vat_amount.toLocaleString("ar-SA")}</td>
                </tr>
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="py-3 px-4 rounded-br-lg">الإجمالي شامل الضريبة</td>
                  <td className="py-3 px-4 text-left font-mono rounded-bl-lg">{invoice.total_amount.toLocaleString("ar-SA")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Badges */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">حالة الفاتورة:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[invoice.status] ?? "bg-gray-100 text-gray-700"}`}>
                {statusLabel[invoice.status] ?? invoice.status}
              </span>
            </div>
            {escrowStatus && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">الضمان:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${escrowStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {escrowStatus === "PENDING" ? "محتجز في الضمان" : "تم الإفراج"}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <Link
              href={`/api/reports/invoices/export?invoiceId=${invoice.id}&format=pdf`}
              className="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              تنزيل PDF
            </Link>
            {(invoice.status === "DRAFT" || invoice.status === "ISSUED") && (
              <Link
                href={`/company/invoices/${invoice.id}/pay`}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
              >
                دفع الآن
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
