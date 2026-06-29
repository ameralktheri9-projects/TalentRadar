import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "مقدَّم",
  VIEWED: "تمت المشاهدة",
  SHORTLISTED: "مختصر",
  INTERVIEW_SCHEDULED: "مقابلة مجدولة",
  OFFER_MADE: "عرض مقدَّم",
  HIRED: "تم التوظيف",
  REJECTED: "مرفوض",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-700",
  VIEWED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-yellow-100 text-yellow-700",
  INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700",
  OFFER_MADE: "bg-orange-100 text-orange-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const OUTCOME_LABELS: Record<string, string> = {
  PENDING: "في الانتظار",
  PASSED: "اجتاز",
  FAILED: "فشل",
  NO_SHOW: "لم يحضر",
  CANCELLED: "ملغى",
};

export default async function AgencyCandidatesPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const statusFilter = searchParams.status;

  const candidates = await prisma.candidateSubmission.findMany({
    where: {
      agency_id: user.entityId,
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    include: {
      proposal: {
        include: {
          job_request: { select: { title: true, sector: true } },
        },
      },
      interviews: {
        orderBy: { scheduled_at: "desc" },
        take: 1,
        select: { outcome: true, scheduled_at: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const statusTabs = [
    { key: "", label: "الكل" },
    { key: "SUBMITTED", label: "مقدَّم" },
    { key: "SHORTLISTED", label: "مختصر" },
    { key: "INTERVIEW_SCHEDULED", label: "مقابلة مجدولة" },
    { key: "HIRED", label: "تم التوظيف" },
    { key: "REJECTED", label: "مرفوض" },
  ];

  return (
    <div>
      <Header title="المرشحون" subtitle="المرشحون الذين قدمتهم وكالتك" />

      <div className="p-6 space-y-6">
        {/* Status Tabs */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key ? `/candidates?status=${tab.key}` : "/candidates"}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (statusFilter ?? "") === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">المرشح</th>
                <th className="text-right p-4 font-medium text-gray-600">القطاع / الوظيفة</th>
                <th className="text-right p-4 font-medium text-gray-600">تاريخ التقديم</th>
                <th className="text-right p-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right p-4 font-medium text-gray-600">نتيجة المقابلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    لا يوجد مرشحون
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{c.current_title ?? "مرشح"}</div>
                      <div className="text-xs text-gray-400">{c.years_experience} سنوات خبرة</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>{c.proposal.job_request.sector}</div>
                      <div className="text-xs text-gray-400">{c.proposal.job_request.title}</div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}
                      >
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {c.interviews[0]
                        ? OUTCOME_LABELS[c.interviews[0].outcome]
                        : "—"}
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
