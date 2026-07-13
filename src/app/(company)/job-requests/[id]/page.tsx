export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import ProposalActions from "./ProposalActions";
import CloseButton from "./CloseButton";

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "خبير",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

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

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function JobRequestDetailPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;
  const activeTab = searchParams.tab ?? "proposals";

  const jobRequest = await prisma.jobRequest.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { full_name: true } },
      proposals: {
        include: {
          agency: { select: { name_ar: true, name_en: true } },
          candidate_submissions: {
            select: {
              id: true,
              anon_summary: true,
              full_name: true,
              current_title: true,
              years_experience: true,
              status: true,
            },
          },
        },
        orderBy: { submitted_at: "desc" },
      },
    },
  });

  if (!jobRequest) {
    return (
      <div className="p-6">
        <p className="text-gray-500">الطلب غير موجود</p>
        <Link href="/job-requests" className="text-blue-600 hover:underline text-sm">
          العودة للقائمة
        </Link>
      </div>
    );
  }

  if (jobRequest.company_id !== user.entityId) {
    redirect("/job-requests");
  }

  // Collect all candidates from all proposals
  const allCandidates = jobRequest.proposals.flatMap((p) =>
    p.candidate_submissions.map((c) => ({ ...c, proposalStatus: p.status }))
  );

  return (
    <div>
      <Header title={jobRequest.title} subtitle="تفاصيل طلب التوظيف" />
      <div className="p-6 space-y-6">
        {/* Job details card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6" dir="rtl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{jobRequest.title}</h2>
              <p className="text-gray-500 text-sm mt-1">{jobRequest.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={jobRequest.status} variant="job" />
              {(jobRequest.status === "OPEN" || jobRequest.status === "DRAFT") && (
                <CloseButton jobRequestId={jobRequest.id} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">القطاع</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {SECTOR_LABELS[jobRequest.sector] ?? jobRequest.sector}
              </p>
            </div>
            <div>
              <span className="text-gray-500">مستوى الخبرة</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {EXPERIENCE_LABELS[jobRequest.experience_level] ?? jobRequest.experience_level}
              </p>
            </div>
            <div>
              <span className="text-gray-500">نطاق الراتب</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {jobRequest.salary_min.toLocaleString("ar-SA")} - {jobRequest.salary_max.toLocaleString("ar-SA")} ر.س
              </p>
            </div>
            <div>
              <span className="text-gray-500">العدد المطلوب</span>
              <p className="font-medium text-gray-900 mt-0.5">{jobRequest.headcount}</p>
            </div>
            <div>
              <span className="text-gray-500">الموعد النهائي للعروض</span>
              <p className="font-medium text-gray-900 mt-0.5">
                {jobRequest.proposal_deadline
                  ? new Date(jobRequest.proposal_deadline).toLocaleDateString("ar-SA")
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">أُنشئ بواسطة</span>
              <p className="font-medium text-gray-900 mt-0.5">{jobRequest.creator.full_name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-200 mb-4">
            <Link
              href={`/job-requests/${params.id}?tab=proposals`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "proposals"
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              العروض ({jobRequest.proposals.length})
            </Link>
            <Link
              href={`/job-requests/${params.id}?tab=candidates`}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === "candidates"
                  ? "bg-white border border-b-white border-gray-200 text-blue-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              المرشحون ({allCandidates.length})
            </Link>
          </div>

          {/* Proposals tab */}
          {activeTab === "proposals" && (
            <div>
              {jobRequest.proposals.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                  <p>لا توجد عروض مقدمة حتى الآن</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm" dir="rtl">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">الوكالة</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">الرسوم</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">مدة التنفيذ</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">الضمان</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">المرشحون</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {jobRequest.proposals.map((proposal) => (
                        <tr key={proposal.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {proposal.agency.name_ar}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {proposal.fee_value}
                            {proposal.fee_type === "PERCENTAGE" ? "%" : " ر.س"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{proposal.timeline_days} يوم</td>
                          <td className="px-4 py-3 text-gray-600">{proposal.guarantee_days} يوم</td>
                          <td className="px-4 py-3 text-gray-600">
                            {proposal.candidate_count_available}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={proposal.status} variant="proposal" />
                          </td>
                          <td className="px-4 py-3">
                            <ProposalActions
                              proposalId={proposal.id}
                              currentStatus={proposal.status}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Candidates tab */}
          {activeTab === "candidates" && (
            <div>
              {allCandidates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
                  <p>لا يوجد مرشحون حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allCandidates.map((candidate) => {
                    const isAccepted = candidate.proposalStatus === "ACCEPTED";
                    return (
                      <div
                        key={candidate.id}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                        dir="rtl"
                      >
                        {isAccepted ? (
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{candidate.full_name}</p>
                              {candidate.current_title && (
                                <p className="text-sm text-gray-600 mt-0.5">{candidate.current_title}</p>
                              )}
                              <p className="text-sm text-gray-500 mt-0.5">
                                خبرة {candidate.years_experience} سنة
                              </p>
                            </div>
                            <StatusBadge status={candidate.status} variant="candidate" />
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-gray-700 text-sm">
                                {candidate.anon_summary ?? "لا يوجد ملخص متاح"}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                (اقبل العرض لرؤية تفاصيل المرشح كاملة)
                              </p>
                            </div>
                            <StatusBadge status={candidate.status} variant="candidate" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
