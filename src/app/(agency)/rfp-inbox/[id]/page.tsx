// RFP detail page for agency — view full job request and submit/view proposal

import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import ProposalForm from "@/components/forms/ProposalForm";
import WithdrawButton from "./WithdrawButton";

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

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "خبير",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

const FEE_TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: "نسبة مئوية",
  FLAT: "مبلغ ثابت",
};

interface PageProps {
  params: { id: string };
}

export default async function RfpDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const agency = await prisma.agency.findUnique({ where: { id: user.entityId } });
  if (!agency) redirect("/login");

  const jobRequest = await prisma.jobRequest.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { industry_sector: true, city: true } },
    },
  });

  if (!jobRequest || jobRequest.status !== "OPEN") {
    return (
      <div className="p-6 text-center text-gray-500" dir="rtl">
        <p className="text-lg mb-3">الطلب غير متاح</p>
        <Link href="/rfp-inbox" className="text-blue-600 hover:underline text-sm">
          العودة لصندوق الطلبات
        </Link>
      </div>
    );
  }

  // Check sector match
  if (!agency.sector_tags.includes(jobRequest.sector)) {
    redirect("/rfp-inbox");
  }

  // Check if agency already submitted a proposal
  const existingProposal = await prisma.proposal.findFirst({
    where: { job_request_id: params.id, agency_id: user.entityId },
  });

  const deadlinePassed = jobRequest.proposal_deadline
    ? new Date(jobRequest.proposal_deadline) < new Date()
    : false;

  return (
    <div dir="rtl">
      <Header title={jobRequest.title} subtitle="تفاصيل طلب التوظيف" />
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Job request info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{jobRequest.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <span>{SECTOR_LABELS[jobRequest.sector] ?? jobRequest.sector}</span>
                <span>•</span>
                <span>{EXPERIENCE_LABELS[jobRequest.experience_level] ?? jobRequest.experience_level}</span>
                <span>•</span>
                <span>{jobRequest.headcount} شاغر</span>
              </div>
            </div>
            <StatusBadge status={jobRequest.status} variant="job" />
          </div>

          <div className="prose prose-sm text-gray-700 mb-5 whitespace-pre-wrap">
            {jobRequest.description}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t border-gray-100 pt-4">
            <div>
              <span className="text-gray-400 text-xs">نطاق الراتب</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {jobRequest.salary_min.toLocaleString("ar-SA")} — {jobRequest.salary_max.toLocaleString("ar-SA")} ر.س
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">الموعد النهائي للعروض</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {jobRequest.proposal_deadline
                  ? new Date(jobRequest.proposal_deadline).toLocaleDateString("ar-SA")
                  : "غير محدد"}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">مدة الاتفاقية</span>
              <p className="font-medium text-gray-800 mt-0.5">{jobRequest.sla_days} يوم</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">نوع الميزانية</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {jobRequest.budget_type === "PERCENTAGE_OF_SALARY" ? "نسبة من الراتب" : "مبلغ ثابت"}
              </p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">قيمة الميزانية</span>
              <p className="font-medium text-gray-800 mt-0.5">
                {jobRequest.budget_value}
                {jobRequest.budget_type === "PERCENTAGE_OF_SALARY" ? "%" : " ر.س"}
              </p>
            </div>
            {jobRequest.saudi_national_required && (
              <div>
                <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full border border-orange-200">
                  سعودي الجنسية مطلوب
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Proposal section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {existingProposal ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">عرضك المقدم</h3>
                <StatusBadge status={existingProposal.status} variant="proposal" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">عدد المرشحين</span>
                  <p className="font-medium text-gray-800 mt-0.5">{existingProposal.candidate_count_available}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">نوع الرسوم</span>
                  <p className="font-medium text-gray-800 mt-0.5">{FEE_TYPE_LABELS[existingProposal.fee_type] ?? existingProposal.fee_type}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">قيمة الرسوم</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {existingProposal.fee_value}
                    {existingProposal.fee_type === "PERCENTAGE" ? "%" : " ر.س"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">مدة التنفيذ</span>
                  <p className="font-medium text-gray-800 mt-0.5">{existingProposal.timeline_days} يوم</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">فترة الضمان</span>
                  <p className="font-medium text-gray-800 mt-0.5">{existingProposal.guarantee_days} يوم</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">تاريخ التقديم</span>
                  <p className="font-medium text-gray-800 mt-0.5">
                    {new Date(existingProposal.submitted_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              </div>

              {existingProposal.notes && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <span className="text-gray-400 text-xs">الملاحظات</span>
                  <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{existingProposal.notes}</p>
                </div>
              )}

              {existingProposal.status === "SUBMITTED" && (
                <div className="mt-4 flex justify-end">
                  <WithdrawButton proposalId={existingProposal.id} />
                </div>
              )}
            </div>
          ) : deadlinePassed ? (
            <div className="text-center text-gray-400 py-8">
              <p className="font-medium">انتهى الموعد النهائي لتقديم العروض</p>
              <p className="text-sm mt-1">لم يعد بإمكانك تقديم عرض على هذا الطلب</p>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">تقديم عرض</h3>
              <ProposalForm jobRequestId={params.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
