export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatShortDate } from "@/lib/format";

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">سجل الإشعارات</h1>
        <p className="text-sm text-gray-500 mt-1">آخر 100 إشعار في المنصة</p>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="table-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/60">
                  <th className="text-start py-3 px-4 type-label text-gray-500">الحدث</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">العنوان</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">المستخدم</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">القناة</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">التاريخ</th>
                  <th className="text-start py-3 px-4 type-label text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">لا توجد إشعارات</td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">{n.event}</td>
                      <td className="py-3.5 px-4 text-gray-900">{n.title}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-mono text-xs">{n.userId.slice(0, 8)}…</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{n.channel}</span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">{formatShortDate(n.createdAt, "ar")}</td>
                      <td className="py-3.5 px-4">
                        {n.readAt ? (
                          <span className="text-emerald-600 text-xs">مقروء</span>
                        ) : (
                          <span className="text-amber-600 text-xs">غير مقروء</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
