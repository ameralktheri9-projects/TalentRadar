export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function AdminSubscriptionsPage() {
  const [agencySubs, companySubs] = await Promise.all([
    prisma.agencySubscription.findMany({
      include: { agency: { select: { name_ar: true } } } as Record<string, unknown>,
      orderBy: { createdAt: "desc" },
      take: 50,
    }) as unknown as Array<{ id: string; agency: { name_ar: string }; tier: string; status: string; currentPeriodEnd: Date | null }>,
    prisma.companySubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const activeAgency = agencySubs.filter((s) => s.status === "ACTIVE").length;
  const activeCompany = companySubs.filter((s) => s.status === "ACTIVE").length;

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">الاشتراكات</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة اشتراكات الوكالات والشركات</p>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "اشتراكات وكالات نشطة", value: activeAgency },
            { label: "اشتراكات شركات نشطة", value: activeCompany },
            { label: "إجمالي الاشتراكات", value: agencySubs.length + companySubs.length },
            { label: "نشط الآن", value: activeAgency + activeCompany },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
              <div className="absolute start-0 top-0 bottom-0 w-[3px] rounded-s-xl"
                   style={{ background: "linear-gradient(180deg, #00FFD1 0%, #7B61FF 100%)" }} />
              <p className="type-label text-gray-500 ps-3">{card.label}</p>
              <p className="text-3xl font-bold text-gray-950 leading-none mt-2 ps-3">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Agency subscriptions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">اشتراكات الوكالات</h2>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="text-start py-3 px-4 type-label text-gray-500">الوكالة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">الخطة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">الحالة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agencySubs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 text-gray-900">{s.agency.name_ar}</td>
                    <td className="py-3.5 px-4 text-gray-600">{s.tier}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>{s.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("ar-SA") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company subscriptions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">اشتراكات الشركات</h2>
          </div>
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="text-start py-3 px-4 type-label text-gray-500">معرّف الشركة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">الخطة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">الحالة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">تاريخ الانتهاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companySubs.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">{s.companyId}</td>
                    <td className="py-3.5 px-4 text-gray-600">{s.tier}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}>{s.status}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {new Date(s.currentPeriodEnd).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
