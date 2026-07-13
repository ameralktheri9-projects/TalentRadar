export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import PayInvoiceButton from "./PayInvoiceButton";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  ISSUED: "صادرة",
  PAID: "مدفوعة",
  DISPUTED: "متنازع عليها",
  REFUNDED: "مستردة",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ISSUED: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  DISPUTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

export default async function CompanyInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const invoices = await prisma.invoice.findMany({
    where: { company_id: user.entityId },
    include: {
      placement: {
        include: {
          candidate_submission: { select: { full_name: true } },
        },
      },
      agency: { select: { name_ar: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <div>
      <Header title="الفواتير" subtitle="إدارة فواتير التوظيف" />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">الوكالة / المرشح</th>
                <th className="text-right p-4 font-medium text-gray-600">المبلغ الإجمالي</th>
                <th className="text-right p-4 font-medium text-gray-600">ضريبة القيمة المضافة</th>
                <th className="text-right p-4 font-medium text-gray-600">المجموع</th>
                <th className="text-right p-4 font-medium text-gray-600">تاريخ الإصدار</th>
                <th className="text-right p-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right p-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد فواتير بعد
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{inv.agency.name_ar}</div>
                      <div className="text-xs text-gray-400">
                        {inv.placement.candidate_submission.full_name}
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{inv.gross_amount.toLocaleString()} ر.س</td>
                    <td className="p-4 text-gray-700">{inv.vat_amount.toFixed(2)} ر.س</td>
                    <td className="p-4 font-semibold text-gray-800">
                      {inv.total_amount.toFixed(2)} ر.س
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status]}`}
                      >
                        {STATUS_LABELS[inv.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      {inv.status === "ISSUED" && <PayInvoiceButton invoiceId={inv.id} />}
                      {inv.status === "PAID" && inv.paid_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(inv.paid_at).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
