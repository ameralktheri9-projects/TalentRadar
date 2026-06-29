import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import DownloadButton from "./DownloadButton";

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const invoices = await prisma.invoice.findMany({
    where: { agency_id: user.entityId },
    include: {
      placement: {
        include: {
          candidate_submission: {
            include: {
              proposal: {
                include: { job_request: { select: { title: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const pending = invoices.filter((i) => i.status === "ISSUED");
  const paid = invoices.filter((i) => i.status === "PAID");

  const totalEarned = paid.reduce((sum, i) => sum + i.agency_payout, 0);
  const pendingPayout = pending.reduce((sum, i) => sum + i.agency_payout, 0);

  return (
    <div>
      <Header title="العمولات" subtitle="إدارة العمولات والمدفوعات" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">إجمالي المكتسب</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {totalEarned.toLocaleString()} ر.س
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">مدفوعات معلقة</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {pendingPayout.toLocaleString()} ر.س
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">مدفوعات معلقة ({pending.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">الوظيفة</th>
                <th className="text-right p-4 font-medium text-gray-600">تاريخ التوظيف</th>
                <th className="text-right p-4 font-medium text-gray-600">الرسوم الإجمالية</th>
                <th className="text-right p-4 font-medium text-gray-600">عمولة المنصة</th>
                <th className="text-right p-4 font-medium text-gray-600">صافي المدفوعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    لا توجد مدفوعات معلقة
                  </td>
                </tr>
              ) : (
                pending.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {inv.placement.candidate_submission.proposal.job_request.title}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(inv.placement.offer_made_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="p-4 text-gray-700">{inv.gross_amount.toLocaleString()} ر.س</td>
                    <td className="p-4 text-red-600">- {inv.platform_cut.toLocaleString()} ر.س</td>
                    <td className="p-4 font-semibold text-green-700">
                      {inv.agency_payout.toLocaleString()} ر.س
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paid */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">مدفوعات مكتملة ({paid.length})</h3>
            <DownloadButton />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">الوظيفة</th>
                <th className="text-right p-4 font-medium text-gray-600">تاريخ الدفع</th>
                <th className="text-right p-4 font-medium text-gray-600">الرسوم الإجمالية</th>
                <th className="text-right p-4 font-medium text-gray-600">عمولة المنصة</th>
                <th className="text-right p-4 font-medium text-gray-600">صافي المدفوعات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paid.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    لا توجد مدفوعات مكتملة
                  </td>
                </tr>
              ) : (
                paid.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">
                      {inv.placement.candidate_submission.proposal.job_request.title}
                    </td>
                    <td className="p-4 text-gray-500">
                      {inv.paid_at
                        ? new Date(inv.paid_at).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>
                    <td className="p-4 text-gray-700">{inv.gross_amount.toLocaleString()} ر.س</td>
                    <td className="p-4 text-red-600">- {inv.platform_cut.toLocaleString()} ر.س</td>
                    <td className="p-4 font-semibold text-green-700">
                      {inv.agency_payout.toLocaleString()} ر.س
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
