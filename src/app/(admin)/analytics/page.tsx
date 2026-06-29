import { prisma } from "@/lib/prisma";

async function getAnalyticsData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const [
    paidInvoices,
    paidInvoicesThisMonth,
    companyUserCount,
    agencyUserCount,
    topAgencies,
    agencies,
    jobRequests,
  ] = await Promise.all([
    prisma.invoice.findMany({ where: { status: "PAID" }, select: { gross_amount: true, platform_cut: true } }),
    prisma.invoice.findMany({
      where: { status: "PAID", paid_at: { gte: startOfMonth } },
      select: { gross_amount: true, platform_cut: true },
    }),
    prisma.companyUser.count({ where: { status: "ACTIVE" } }),
    prisma.agencyUser.count({ where: { status: "ACTIVE" } }),
    prisma.agency.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name_ar: true, total_placements: true, fill_rate: true, rating_avg: true },
      orderBy: { total_placements: "desc" },
      take: 5,
    }),
    prisma.agency.findMany({
      where: { status: "ACTIVE" },
      select: { fill_rate: true, avg_time_to_fill_days: true },
    }),
    prisma.jobRequest.findMany({
      select: { sector: true, status: true, created_at: true },
    }),
  ]);

  const totalGmv = paidInvoices.reduce((s, i) => s + i.gross_amount, 0);
  const gmvThisMonth = paidInvoicesThisMonth.reduce((s, i) => s + i.gross_amount, 0);
  const platformRevenue = paidInvoices.reduce((s, i) => s + i.platform_cut, 0);
  const avgFillRate =
    agencies.length > 0
      ? agencies.reduce((s, a) => s + a.fill_rate, 0) / agencies.length
      : 0;
  const avgTimeToFill =
    agencies.filter((a) => a.avg_time_to_fill_days > 0).length > 0
      ? agencies.filter((a) => a.avg_time_to_fill_days > 0).reduce((s, a) => s + a.avg_time_to_fill_days, 0) /
        agencies.filter((a) => a.avg_time_to_fill_days > 0).length
      : 0;

  // Top sectors
  const sectorCount: Record<string, number> = {};
  for (const jr of jobRequests) {
    sectorCount[jr.sector] = (sectorCount[jr.sector] ?? 0) + 1;
  }
  const topSectors = Object.entries(sectorCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([sector, count]) => ({ sector, count }));

  // Monthly placements
  const placements = await prisma.placement.findMany({
    where: {
      offer_made_at: {
        gte: new Date(months[0].year, months[0].month, 1),
      },
    },
    select: { offer_made_at: true },
  });

  const monthlyPlacements = months.map((m) => {
    const count = placements.filter(
      (p) =>
        p.offer_made_at.getFullYear() === m.year && p.offer_made_at.getMonth() === m.month
    ).length;
    const label = new Date(m.year, m.month, 1).toLocaleDateString("ar-SA", { month: "long", year: "numeric" });
    return { label, count };
  });

  return {
    totalGmv,
    gmvThisMonth,
    platformRevenue,
    companyUserCount,
    agencyUserCount,
    avgFillRate,
    avgTimeToFill,
    topAgencies,
    topSectors,
    monthlyPlacements,
  };
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">التحليلات</h1>
        <p className="text-sm text-gray-500 mt-1">إحصائيات المنصة والأداء</p>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">إجمالي GMV</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.totalGmv.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400">ريال سعودي</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">GMV هذا الشهر</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.gmvThisMonth.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400">ريال سعودي</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">إيرادات المنصة</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.platformRevenue.toLocaleString("ar-SA", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400">ريال سعودي</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">المستخدمون النشطون</div>
            <div className="text-2xl font-bold text-gray-800">
              {data.companyUserCount + data.agencyUserCount}
            </div>
            <div className="text-xs text-gray-400">
              {data.companyUserCount} شركة · {data.agencyUserCount} وكالة
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">معدل الإنجاز الوسطي</div>
            <div className="text-2xl font-bold text-gray-800">{data.avgFillRate.toFixed(0)}%</div>
            <div className="text-xs text-gray-400">
              {data.avgTimeToFill > 0 ? `${data.avgTimeToFill.toFixed(0)} يوم وسطياً` : "—"}
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Agencies */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">أفضل 5 وكالات حسب التوظيفات</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الوكالة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التوظيفات</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">معدل الإنجاز</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topAgencies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                      لا توجد بيانات
                    </td>
                  </tr>
                ) : (
                  data.topAgencies.map((agency, i) => (
                    <tr key={agency.id}>
                      <td className="px-5 py-3 text-gray-800">
                        <span className="inline-block w-5 text-gray-400 text-xs ml-1">{i + 1}</span>
                        {agency.name_ar}
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-medium">{agency.total_placements}</td>
                      <td className="px-5 py-3 text-gray-600">{agency.fill_rate.toFixed(0)}%</td>
                      <td className="px-5 py-3 text-amber-500">
                        {agency.rating_avg > 0 ? `★ ${agency.rating_avg.toFixed(1)}` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Top Sectors */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">أفضل 5 قطاعات حسب طلبات التوظيف</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">القطاع</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">عدد الطلبات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topSectors.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-gray-400">
                      لا توجد بيانات
                    </td>
                  </tr>
                ) : (
                  data.topSectors.map((s, i) => (
                    <tr key={s.sector}>
                      <td className="px-5 py-3 text-gray-800">
                        <span className="inline-block w-5 text-gray-400 text-xs ml-1">{i + 1}</span>
                        {s.sector}
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-medium">{s.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Placements */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">التوظيفات الشهرية (آخر 6 أشهر)</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الشهر</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">عدد التوظيفات</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">التوزيع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.monthlyPlacements.map((m) => {
                const maxCount = Math.max(...data.monthlyPlacements.map((x) => x.count), 1);
                const pct = Math.round((m.count / maxCount) * 100);
                return (
                  <tr key={m.label}>
                    <td className="px-5 py-3 text-gray-700">{m.label}</td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{m.count}</td>
                    <td className="px-5 py-3">
                      <div className="w-40 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
