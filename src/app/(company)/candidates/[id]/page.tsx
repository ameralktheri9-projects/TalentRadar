export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import InterviewScheduleForm from "./InterviewScheduleForm";
import InterviewFeedbackForm from "./InterviewFeedbackForm";
import HireForm from "./HireForm";
import ProposeInterviewModal from "./ProposeInterviewModal";

const OUTCOME_LABELS: Record<string, string> = {
  PENDING: "في الانتظار",
  PASSED: "اجتاز",
  FAILED: "فشل",
  NO_SHOW: "لم يحضر",
  CANCELLED: "ملغى",
};

const TYPE_LABELS: Record<string, string> = {
  PHONE: "هاتفية",
  VIDEO: "مرئية",
  ONSITE: "حضورية",
};

export default async function CandidateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const candidate = await prisma.candidateSubmission.findUnique({
    where: { id: params.id },
    include: {
      proposal: {
        include: {
          job_request: { include: { company: { select: { id: true } } } },
          agency: { select: { name_ar: true } },
        },
      },
      interviews: { orderBy: { scheduled_at: "asc" } },
      placement: true,
    },
  });

  if (!candidate) notFound();

  if (candidate.proposal.job_request.company.id !== user.entityId) {
    redirect("/candidates");
  }

  const proposalAccepted = candidate.proposal.status === "ACCEPTED";
  const isHRManager = (user as AuthUser & { role?: string }).role === "HR_MANAGER";
  const pendingInterviews = candidate.interviews.filter((i) => i.outcome === "PENDING");
  const canHire =
    isHRManager &&
    candidate.interviews.length > 0 &&
    !candidate.placement &&
    candidate.status !== "HIRED" &&
    candidate.status !== "REJECTED";

  return (
    <div>
      <Header
        title={proposalAccepted ? candidate.full_name : "مرشح (مجهول)"}
        subtitle={candidate.current_title ?? ""}
      />

      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Main info */}
        <div className="col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg">بيانات المرشح</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {proposalAccepted ? (
                <>
                  <div>
                    <span className="text-gray-500">الاسم الكامل</span>
                    <p className="font-medium">{candidate.full_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">البريد الإلكتروني</span>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                  {candidate.phone && (
                    <div>
                      <span className="text-gray-500">الهاتف</span>
                      <p className="font-medium">{candidate.phone}</p>
                    </div>
                  )}
                  {candidate.cv_url && (
                    <div>
                      <span className="text-gray-500">السيرة الذاتية</span>
                      <p className="font-medium">
                        <a href={candidate.cv_url} className="text-blue-600 hover:underline">
                          تحميل
                        </a>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
                  بيانات المرشح الكاملة متاحة بعد قبول العرض
                </div>
              )}
              <div>
                <span className="text-gray-500">المسمى الوظيفي الحالي</span>
                <p className="font-medium">{candidate.current_title ?? "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">سنوات الخبرة</span>
                <p className="font-medium">{candidate.years_experience}</p>
              </div>
              <div>
                <span className="text-gray-500">الجنسية</span>
                <p className="font-medium">{candidate.nationality ?? "—"}</p>
              </div>
              <div>
                <span className="text-gray-500">سعودي</span>
                <p className="font-medium">{candidate.is_saudi ? "نعم" : "لا"}</p>
              </div>
              <div>
                <span className="text-gray-500">الراتب الحالي</span>
                <p className="font-medium">
                  {candidate.current_salary ? `${candidate.current_salary.toLocaleString()} ر.س` : "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">الراتب المتوقع</span>
                <p className="font-medium">
                  {candidate.expected_salary ? `${candidate.expected_salary.toLocaleString()} ر.س` : "—"}
                </p>
              </div>
            </div>
            {candidate.anon_summary && (
              <div>
                <span className="text-gray-500 text-sm">ملخص</span>
                <p className="mt-1 text-sm text-gray-700">{candidate.anon_summary}</p>
              </div>
            )}
          </div>

          {/* Interviews Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">المقابلات</h3>
            {candidate.interviews.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد مقابلات بعد</p>
            ) : (
              <div className="space-y-3">
                {candidate.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="border border-gray-100 rounded-lg p-4 flex items-start justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {TYPE_LABELS[interview.interview_type]} —{" "}
                        {new Date(interview.scheduled_at).toLocaleDateString("ar-SA")}
                      </div>
                      {interview.feedback && (
                        <p className="text-xs text-gray-500 mt-1">{interview.feedback}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        interview.outcome === "PASSED"
                          ? "bg-green-100 text-green-700"
                          : interview.outcome === "FAILED" || interview.outcome === "NO_SHOW"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {OUTCOME_LABELS[interview.outcome]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule Interview Form */}
            {proposalAccepted && ["SHORTLISTED", "VIEWED"].includes(candidate.status) && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="font-medium text-gray-700 mb-3">جدولة مقابلة جديدة</h4>
                <InterviewScheduleForm candidateId={candidate.id} />
              </div>
            )}

            {/* Pending Interview Feedback */}
            {pendingInterviews.map((interview) => (
              <div key={interview.id} className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="font-medium text-gray-700 mb-3">تسجيل نتيجة المقابلة</h4>
                <InterviewFeedbackForm interviewId={interview.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">معلومات الوكالة</h3>
            <p className="text-sm">{candidate.proposal.agency.name_ar}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">الوظيفة</h3>
            <p className="text-sm">{candidate.proposal.job_request.title}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">جدولة مقابلة</h3>
            <ProposeInterviewModal candidateSubmissionId={candidate.id} />
          </div>

          {canHire && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-3">تسجيل التوظيف</h3>
              <HireForm candidateId={candidate.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
