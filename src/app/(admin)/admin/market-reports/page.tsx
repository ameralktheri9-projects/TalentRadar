export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function MarketReportsPage() {
  const jobRequests = await prisma.jobRequest.findMany({
    select: { sector: true, salary_min: true, salary_max: true, status: true, created_at: true },
  });

  // Aggregate salary ranges by sector
  const sectorData: Record<string, { count: number; salaries: number[] }> = {};
  for (const jr of jobRequests) {
    if (!sectorData[jr.sector]) sectorData[jr.sector] = { count: 0, salaries: [] };
    sectorData[jr.sector].count++;
    if (jr.salary_min) sectorData[jr.sector].salaries.push(jr.salary_min);
    if (jr.salary_max) sectorData[jr.sector].salaries.push(jr.salary_max);
  }

  const report = Object.entries(sectorData)
    .map(([sector, data]) => {
      const avg = data.salaries.length > 0
        ? data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length
        : 0;
      return { sector, count: data.count, avgSalary: Math.round(avg) };
    })
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">تقارير السوق</h1>
        <p className="text-sm text-gray-500 mt-1">متوسط الرواتب وحجم الطلب حسب القطاع</p>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="text-start py-3 px-4 type-label text-gray-500">القطاع</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">عدد الطلبات</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">متوسط الراتب (ر.س)</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">التوزيع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map((row) => {
                  const maxCount = Math.max(...report.map((r) => r.count), 1);
                  const pct = Math.round((row.count / maxCount) * 100);
                  return (
                    <tr key={row.sector} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 text-gray-900 font-medium">{row.sector}</td>
                      <td className="py-3.5 px-4 text-gray-700">{row.count}</td>
                      <td className="py-3.5 px-4 text-gray-700 font-mono">
                        {row.avgSalary > 0 ? row.avgSalary.toLocaleString("ar-SA") : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)" }} />
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
    </div>
  );
}
