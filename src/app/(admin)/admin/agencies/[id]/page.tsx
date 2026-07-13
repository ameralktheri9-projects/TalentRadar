export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AgencyStatus, SubscriptionTier } from "@prisma/client";
import AgencyDetailActions from "./AgencyDetailActions";

const STATUS_LABELS: Record<AgencyStatus, string> = {
  PENDING: "معلق",
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  REJECTED: "مرفوض",
};

const STATUS_COLORS: Record<AgencyStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  ELITE: "bg-amber-100 text-amber-700",
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "مقدمة",
  SHORTLISTED: "مدرجة",
  ACCEPTED: "مقبولة",
  REJECTED: "مرفوضة",
  WITHDRAWN: "مسحوبة",
};

export default async function AgencyDetailPage({ params }: { params: { id: string } }) {
  const agency = await prisma.agency.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      proposals: {
        select: {
          id: true,
          status: true,
          submitted_at: true,
          fee_type: true,
          fee_value: true,
          job_request: {
            select: {
              title: true,
              company: { select: { name_ar: true } },
            },
          },
        },
        orderBy: { submitted_at: "desc" },
        take: 20,
      },
      subscriptions: {
        orderBy: { started_at: "desc" },
        take: 5,
      },
      _count: { select: { placements: true, proposals: true } },
    },
  });

  if (!agency) notFound();

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/agencies" className="text-sm text-gray-400 hover:text-gray-600">
                الوكالات
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm text-gray-600">{agency.name_ar}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{agency.name_ar}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">{agency.hrsd_licence}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[agency.status]}`}>
                {STATUS_LABELS[agency.status]}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[agency.subscription_tier]}`}>
                {agency.subscription_tier}
              </span>
              {agency.hrsd_verified && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  ترخيص HRSD محقق
                </span>
              )}
            </div>
          </div>
          <AgencyDetailActions agencyId={agency.id} status={agency.status} />
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {agency.rating_avg > 0 ? agency.rating_avg.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">التقييم</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-gray-800">{agency.total_placements}</div>
            <div className="text-xs text-gray-500 mt-1">التوظيفات</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-gray-800">{agency.fill_rate.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">معدل الإنجاز</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-gray-800">{agency.response_rate.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">معدل الاستجابة</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {agency.avg_time_to_fill_days > 0 ? agency.avg_time_to_fill_days.toFixed(0) : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">متوسط أيام الإشغال</div>
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">نظرة عامة</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "الاسم بالعربية", value: agency.name_ar },
              { label: "الاسم بالإنجليزية", value: agency.name_en },
              { label: "ترخيص HRSD", value: agency.hrsd_licence },
              { label: "سنة التأسيس", value: agency.founded_year?.toString() ?? "—" },
              { label: "حجم الفريق", value: agency.team_size.toString() },
              { label: "الباقة", value: agency.subscription_tier },
              { label: "قطاعات التخصص", value: agency.sector_tags.join("، ") || "—" },
              { label: "أنواع العملاء", value: agency.client_types.join("، ") || "—" },
              { label: "تاريخ التسجيل", value: new Date(agency.created_at).toLocaleDateString("ar-SA") },
              { label: "إجمالي العروض", value: agency._count.proposals.toString() },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Proposals */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">العروض الأخيرة</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المنصب</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الشركة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الرسوم</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agency.proposals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    لا توجد عروض
                  </td>
                </tr>
              ) : (
                agency.proposals.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3 text-gray-800">{p.job_request.title}</td>
                    <td className="px-5 py-3 text-gray-500">{p.job_request.company.name_ar}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {PROPOSAL_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.fee_value}
                      {p.fee_type === "PERCENTAGE" ? "%" : " ريال"}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(p.submitted_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Subscriptions */}
        {agency.subscriptions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">الاشتراكات</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الباقة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">دورة الفوترة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">السعر (ريال)</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">تاريخ البدء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {agency.subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[sub.tier]}`}>
                        {sub.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{sub.billing_cycle === "MONTHLY" ? "شهري" : "سنوي"}</td>
                    <td className="px-5 py-3 text-gray-600">{sub.price_sar.toLocaleString("ar-SA")}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(sub.started_at).toLocaleDateString("ar-SA")}
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
