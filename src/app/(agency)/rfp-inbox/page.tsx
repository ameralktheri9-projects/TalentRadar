import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import { Prisma } from "@prisma/client";

const SECTOR_OPTIONS = [
  { value: "TECHNOLOGY", label: "تقنية المعلومات" },
  { value: "HEALTHCARE", label: "الرعاية الصحية" },
  { value: "FINANCE", label: "المالية" },
  { value: "EDUCATION", label: "التعليم" },
  { value: "RETAIL", label: "التجزئة" },
  { value: "MANUFACTURING", label: "التصنيع" },
  { value: "CONSTRUCTION", label: "البناء والتشييد" },
  { value: "ENERGY", label: "الطاقة" },
  { value: "LOGISTICS", label: "اللوجستيات" },
  { value: "HOSPITALITY", label: "الضيافة" },
  { value: "MEDIA", label: "الإعلام" },
  { value: "GOVERNMENT", label: "الحكومة" },
  { value: "OTHER", label: "أخرى" },
];

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(
  SECTOR_OPTIONS.map((o) => [o.value, o.label])
);

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "خبير",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

const EXPERIENCE_OPTIONS = [
  { value: "JUNIOR", label: "مبتدئ" },
  { value: "MID", label: "متوسط" },
  { value: "SENIOR", label: "خبير" },
  { value: "DIRECTOR", label: "مدير" },
  { value: "C_SUITE", label: "تنفيذي" },
];

interface PageProps {
  searchParams: {
    sector?: string | string[];
    experience_level?: string | string[];
  };
}

export default async function RfpInboxPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  // Get agency with sector_tags
  const agency = await prisma.agency.findUnique({ where: { id: user.entityId } });
  if (!agency) redirect("/login");

  const sectorFilter = Array.isArray(searchParams.sector)
    ? searchParams.sector
    : searchParams.sector
    ? [searchParams.sector]
    : [];

  const expFilter = Array.isArray(searchParams.experience_level)
    ? searchParams.experience_level
    : searchParams.experience_level
    ? [searchParams.experience_level]
    : [];

  // Build where clause: OPEN, deadline not passed, sector in agency's sector_tags
  const now = new Date();
  const where: Prisma.JobRequestWhereInput = {
    status: "OPEN",
    OR: [
      { proposal_deadline: null },
      { proposal_deadline: { gt: now } },
    ],
    sector: {
      in:
        sectorFilter.length > 0
          ? sectorFilter.filter((s) => agency.sector_tags.includes(s))
          : agency.sector_tags,
    },
  };

  if (expFilter.length > 0) {
    where.experience_level = { in: expFilter as Prisma.EnumExperienceLevelFilter["in"] };
  }

  const jobRequests = await prisma.jobRequest.findMany({
    where,
    orderBy: { created_at: "desc" },
  });

  // Fetch this agency's submitted proposals to show badge
  const myProposals = await prisma.proposal.findMany({
    where: {
      agency_id: user.entityId,
      job_request_id: { in: jobRequests.map((jr) => jr.id) },
    },
    select: { job_request_id: true, status: true },
  });

  const myProposalMap = new Map(myProposals.map((p) => [p.job_request_id, p.status]));

  const buildUrl = (params: Record<string, string | string[] | undefined>) => {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (!val) continue;
      if (Array.isArray(val)) {
        val.forEach((v) => sp.append(key, v));
      } else {
        sp.set(key, val);
      }
    }
    const qs = sp.toString();
    return `/rfp-inbox${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <Header title="صندوق الطلبات" subtitle="طلبات التوظيف المطابقة لتخصصاتك" />
      <div className="p-6 flex gap-6" dir="rtl">
        {/* Sidebar filters */}
        <aside className="w-56 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">تصفية</h3>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">القطاع</p>
              <div className="space-y-1.5">
                {SECTOR_OPTIONS.filter((s) => agency.sector_tags.includes(s.value)).map((s) => {
                  const isChecked = sectorFilter.includes(s.value);
                  const newSectors = isChecked
                    ? sectorFilter.filter((x) => x !== s.value)
                    : [...sectorFilter, s.value];
                  return (
                    <Link
                      key={s.value}
                      href={buildUrl({
                        sector: newSectors,
                        experience_level: expFilter,
                      })}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">مستوى الخبرة</p>
              <div className="space-y-1.5">
                {EXPERIENCE_OPTIONS.map((e) => {
                  const isChecked = expFilter.includes(e.value);
                  const newExp = isChecked
                    ? expFilter.filter((x) => x !== e.value)
                    : [...expFilter, e.value];
                  return (
                    <Link
                      key={e.value}
                      href={buildUrl({
                        sector: sectorFilter,
                        experience_level: newExp,
                      })}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      {e.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Job request cards */}
        <div className="flex-1">
          {jobRequests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">📥</div>
              <p className="text-lg font-medium">لا توجد طلبات مطابقة حالياً</p>
              <p className="text-sm mt-1">سيتم عرض الطلبات المطابقة لتخصصات وكالتك هنا</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobRequests.map((jr) => {
                const myProposalStatus = myProposalMap.get(jr.id);
                return (
                  <div
                    key={jr.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{jr.title}</h3>
                          {myProposalStatus && (
                            <StatusBadge status={myProposalStatus} variant="proposal" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{SECTOR_LABELS[jr.sector] ?? jr.sector}</span>
                          <span>•</span>
                          <span>{EXPERIENCE_LABELS[jr.experience_level] ?? jr.experience_level}</span>
                          <span>•</span>
                          <span>{jr.headcount} شاغر</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-gray-400 text-xs">نطاق الراتب</span>
                        <p className="font-medium text-gray-800 text-xs mt-0.5">
                          {jr.salary_min.toLocaleString("ar-SA")} - {jr.salary_max.toLocaleString("ar-SA")} ر.س
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">الموعد النهائي</span>
                        <p className="font-medium text-gray-800 text-xs mt-0.5">
                          {jr.proposal_deadline
                            ? new Date(jr.proposal_deadline).toLocaleDateString("ar-SA")
                            : "غير محدد"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">مدة SLA</span>
                        <p className="font-medium text-gray-800 text-xs mt-0.5">{jr.sla_days} يوم</p>
                      </div>
                      {jr.saudi_national_required && (
                        <div>
                          <span className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200">
                            سعودي الجنسية مطلوب
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Link
                        href={`/rfp-inbox/${jr.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        عرض وتقديم
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
