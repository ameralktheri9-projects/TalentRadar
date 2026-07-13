export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import CandidateActions from "./CandidateActions";

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

export default async function CompanyCandidatesPage({
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
      proposal: {
        status: "ACCEPTED",
        job_request: { company_id: user.entityId },
      },
      ...(statusFilter ? { status: statusFilter as never } : {}),
    },
    include: {
      proposal: {
        include: {
          job_request: { select: { title: true, id: true } },
          agency: { select: { name_ar: true, id: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const statusTabs = [
    { key: "", label: "الكل" },
    { key: "SUBMITTED", label: "مقدَّم" },
    { key: "VIEWED", label: "تمت المشاهدة" },
    { key: "SHORTLISTED", label: "مختصر" },
    { key: "INTERVIEW_SCHEDULED", label: "مقابلة مجدولة" },
    { key: "HIRED", label: "تم التوظيف" },
    { key: "REJECTED", label: "مرفوض" },
  ];

  return (
    <div>
      <Header title="المرشحون" subtitle="المرشحون المقدَّمون لطلبات التوظيف" />

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

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right p-4 font-medium text-gray-600">المرشح</th>
                <th className="text-right p-4 font-medium text-gray-600">الوظيفة</th>
                <th className="text-right p-4 font-medium text-gray-600">الوكالة</th>
                <th className="text-right p-4 font-medium text-gray-600">الراتب المتوقع</th>
                <th className="text-right p-4 font-medium text-gray-600">الحالة</th>
                <th className="text-right p-4 font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    لا يوجد مرشحون
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <Link href={`/candidates/${c.id}`} className="font-medium text-blue-600 hover:underline">
                        {c.current_title ?? "مرشح"}
                      </Link>
                      <div className="text-xs text-gray-400 mt-0.5">{c.years_experience} سنوات خبرة</div>
                    </td>
                    <td className="p-4 text-gray-700">{c.proposal.job_request.title}</td>
                    <td className="p-4 text-gray-700">{c.proposal.agency.name_ar}</td>
                    <td className="p-4 text-gray-700">
                      {c.expected_salary ? `${c.expected_salary.toLocaleString()} ر.س` : "—"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="p-4">
                      <CandidateActions candidateId={c.id} status={c.status} />
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
