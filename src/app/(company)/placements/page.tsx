export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  OFFER_MADE: "عرض مقدَّم",
  ACCEPTED: "مقبول",
  DECLINED: "مرفوض",
  STARTED: "بدأ العمل",
  GUARANTEE_BREACH: "خرق الضمان",
  REPLACED: "مستبدل",
};

const STATUS_COLORS: Record<string, string> = {
  OFFER_MADE: "bg-yellow-100 text-yellow-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  DECLINED: "bg-red-100 text-red-700",
  STARTED: "bg-green-100 text-green-700",
  GUARANTEE_BREACH: "bg-orange-100 text-orange-700",
  REPLACED: "bg-gray-100 text-gray-600",
};

export default async function PlacementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const placements = await prisma.placement.findMany({
    where: { company_id: user.entityId },
    include: {
      candidate_submission: { select: { full_name: true, current_title: true } },
      agency: { select: { name_ar: true } },
      invoice: { select: { id: true, status: true } },
      rating: { select: { id: true } },
    },
    orderBy: { offer_made_at: "desc" },
  });

  return (
    <div>
      <Header title="التوظيفات" subtitle="سجل جميع حالات التوظيف" />

      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">المرشح</th>
                <th className="text-right p-4 font-medium text-gray-600">الوكالة</th>
                <th className="text-right p-4 font-medium text-gray-600">قيمة العرض</th>
                <th className="text-right p-4 font-medium text-gray-600">تاريخ البدء</th>
                <th className="text-right p-4 font-medium text-gray-600">نهاية الضمان</th>
                <th className="text-right p-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right p-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {placements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    لا توجد توظيفات بعد
                  </td>
                </tr>
              ) : (
                placements.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">
                        {p.candidate_submission.full_name}
                      </div>
                      <div className="text-xs text-gray-400">{p.candidate_submission.current_title}</div>
                    </td>
                    <td className="p-4 text-gray-700">{p.agency.name_ar}</td>
                    <td className="p-4 text-gray-700">
                      {p.offer_amount.toLocaleString()} ر.س
                    </td>
                    <td className="p-4 text-gray-700">
                      {p.start_date
                        ? new Date(p.start_date).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>
                    <td className="p-4 text-gray-700">
                      {p.guarantee_end_date
                        ? new Date(p.guarantee_end_date).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {p.status === "STARTED" && !p.rating && (
                          <Link
                            href={`/placements/${p.id}/rate`}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                          >
                            تقييم الوكالة
                          </Link>
                        )}
                        {p.invoice && (
                          <Link
                            href={`/invoices`}
                            className="text-xs text-gray-500 hover:underline"
                          >
                            الفاتورة
                          </Link>
                        )}
                      </div>
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
