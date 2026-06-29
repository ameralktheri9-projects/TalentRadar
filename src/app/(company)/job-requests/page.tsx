import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import { JobRequestStatus } from "@prisma/client";

const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "تقنية المعلومات",
  HEALTHCARE: "الرعاية الصحية",
  FINANCE: "المالية",
  EDUCATION: "التعليم",
  RETAIL: "التجزئة",
  MANUFACTURING: "التصنيع",
  CONSTRUCTION: "البناء والتشييد",
  ENERGY: "الطاقة",
  LOGISTICS: "اللوجستيات",
  HOSPITALITY: "الضيافة",
  MEDIA: "الإعلام",
  GOVERNMENT: "الحكومة",
  OTHER: "أخرى",
};

const STATUS_TABS = [
  { key: "ALL", label: "الكل" },
  { key: "DRAFT", label: "مسودة" },
  { key: "OPEN", label: "مفتوح" },
  { key: "CLOSED", label: "مغلق" },
  { key: "FILLED", label: "مكتمل" },
];

interface PageProps {
  searchParams: { status?: string };
}

export default async function JobRequestsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;
  const statusFilter = searchParams.status as JobRequestStatus | undefined;

  const where: Record<string, unknown> = { company_id: user.entityId };
  if (statusFilter && statusFilter !== "ALL" as string) {
    where.status = statusFilter;
  }

  const jobRequests = await prisma.jobRequest.findMany({
    where,
    include: {
      _count: { select: { proposals: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const activeTab = searchParams.status ?? "ALL";

  return (
    <div>
      <Header title="طلبات التوظيف" subtitle="إدارة جميع طلبات التوظيف" />
      <div className="p-6">
        {/* Header actions */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">جميع الطلبات</h3>
          <Link
            href="/job-requests/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            + طلب توظيف جديد
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/job-requests?status=${tab.key}`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        {jobRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg font-medium">لا توجد طلبات توظيف</p>
            <Link href="/job-requests/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
              أنشئ أول طلب
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm" dir="rtl">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">المسمى الوظيفي</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">القطاع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">العدد المطلوب</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">العروض</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">الموعد النهائي</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobRequests.map((jr) => (
                  <tr key={jr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{jr.title}</td>
                    <td className="px-4 py-3 text-gray-600">{SECTOR_LABELS[jr.sector] ?? jr.sector}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={jr.status} variant="job" />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{jr.headcount}</td>
                    <td className="px-4 py-3 text-gray-600">{jr._count.proposals}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {jr.proposal_deadline
                        ? new Date(jr.proposal_deadline).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/job-requests/${jr.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        عرض
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
