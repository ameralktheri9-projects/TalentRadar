export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ApprovalActionButtons from "./ApprovalActionButtons";

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalCompanies,
    totalAgencies,
    totalJobRequests,
    totalPlacements,
    paidInvoices,
    pendingCompanies,
    pendingAgencies,
    placementsThisMonth,
  ] = await Promise.all([
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.agency.count({ where: { status: "ACTIVE" } }),
    prisma.jobRequest.count({ where: { status: "OPEN" } }),
    prisma.placement.count(),
    prisma.invoice.findMany({ where: { status: "PAID" }, select: { platform_cut: true } }),
    prisma.company.findMany({
      where: { status: "PENDING" },
      select: { id: true, name_ar: true, cr_number: true, created_at: true },
      orderBy: { created_at: "asc" },
      take: 5,
    }),
    prisma.agency.findMany({
      where: { status: "PENDING" },
      select: { id: true, name_ar: true, hrsd_licence: true, created_at: true },
      orderBy: { created_at: "asc" },
      take: 5,
    }),
    prisma.placement.count({ where: { offer_made_at: { gte: startOfMonth } } }),
  ]);

  const platformRevenue = paidInvoices.reduce((s, i) => s + i.platform_cut, 0);

  return {
    totalCompanies,
    totalAgencies,
    totalJobRequests,
    totalPlacements,
    platformRevenue,
    pendingCompanies,
    pendingAgencies,
    placementsThisMonth,
  };
}

async function getSlaBreaches() {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const openJobRequests = await prisma.jobRequest.findMany({
    where: { status: "OPEN", opened_at: { lt: fortyEightHoursAgo } },
    include: {
      proposals: { select: { agency_id: true } },
    },
    take: 5,
  });

  return openJobRequests
    .filter((jr) => jr.proposals.length === 0 && jr.opened_at)
    .map((jr) => ({
      id: jr.id,
      job_title: jr.title,
      agency_name: "لا يوجد ردود",
      hours_overdue: Math.round(
        (now.getTime() - (jr.opened_at as Date).getTime()) / (60 * 60 * 1000) - 48
      ),
    }));
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const slaBreaches = await getSlaBreaches();
  const totalPending = stats.pendingCompanies.length + stats.pendingAgencies.length;

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
        <p className="text-sm text-gray-500 mt-1">نظرة عامة على المنصة والموافقات المعلقة</p>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
          <div className={`bg-white rounded-xl border p-5 col-span-3 xl:col-span-1 ${totalPending > 0 ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
            <div className="text-sm text-gray-500 mb-1">موافقات معلقة</div>
            <div className={`text-3xl font-bold ${totalPending > 0 ? "text-red-600" : "text-gray-800"}`}>
              {totalPending}
            </div>
            {totalPending > 0 && (
              <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                يحتاج مراجعة
              </span>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">شركات نشطة</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalCompanies}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">وكالات نشطة</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalAgencies}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">إيرادات المنصة</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.platformRevenue.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400">ريال سعودي</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">إجمالي التوظيفات</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalPlacements}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">طلبات مفتوحة</div>
            <div className="text-3xl font-bold text-gray-800">{stats.totalJobRequests}</div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-2 gap-6">
          {/* Companies */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                شركات بانتظار الموافقة
                {stats.pendingCompanies.length > 0 && (
                  <span className="mr-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {stats.pendingCompanies.length}
                  </span>
                )}
              </h3>
              <Link href="/admin/companies?status=PENDING" className="text-sm text-blue-600 hover:underline">
                عرض الكل
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.pendingCompanies.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">لا توجد شركات معلقة</div>
              ) : (
                stats.pendingCompanies.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{c.name_ar}</div>
                      <div className="text-xs text-gray-400">{c.cr_number}</div>
                    </div>
                    <ApprovalActionButtons entityId={c.id} entityType="company" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Agencies */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                وكالات بانتظار الموافقة
                {stats.pendingAgencies.length > 0 && (
                  <span className="mr-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {stats.pendingAgencies.length}
                  </span>
                )}
              </h3>
              <Link href="/admin/agencies?status=PENDING" className="text-sm text-blue-600 hover:underline">
                عرض الكل
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.pendingAgencies.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">لا توجد وكالات معلقة</div>
              ) : (
                stats.pendingAgencies.map((a) => (
                  <div key={a.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{a.name_ar}</div>
                      <div className="text-xs text-gray-400">{a.hrsd_licence}</div>
                    </div>
                    <ApprovalActionButtons entityId={a.id} entityType="agency" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SLA Breaches */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">تنبيهات خرق SLA</h3>
            <Link href="/admin/sla" className="text-sm text-blue-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          {slaBreaches.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">لا توجد خروقات SLA</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الوكالة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المنصب</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التأخير (ساعة)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {slaBreaches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 text-gray-800">{b.agency_name}</td>
                    <td className="px-5 py-3 text-gray-600">{b.job_title}</td>
                    <td className="px-5 py-3">
                      <span className={`font-medium ${b.hours_overdue > 72 ? "text-red-600" : "text-orange-500"}`}>
                        {b.hours_overdue} ساعة
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
