"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";

interface AnalyticsData {
  winRate: number;
  avgDaysToFill: number;
  revenueByMonth: unknown[];
  clientRetentionRate: number;
  proposalsThisMonth: number;
  activeJobRequests: number;
}

export default function AgencyAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/agency")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json.data);
      })
      .catch(() => setError("حدث خطأ في الاتصال"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div dir="rtl">
      <Header title="التحليلات" subtitle="إحصائيات الوكالة والأداء" />
      <div className="p-6 space-y-6">
        {loading && (
          <div className="text-center text-gray-400 py-12">جاري التحميل...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {data && (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">معدل الفوز</div>
              <div className="text-3xl font-bold text-blue-600">{data.winRate}%</div>
              <div className="text-xs text-gray-400 mt-1">العروض المقبولة من الإجمالي</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">متوسط أيام الإنجاز</div>
              <div className="text-3xl font-bold text-gray-800">
                {data.avgDaysToFill > 0 ? data.avgDaysToFill : "—"}
              </div>
              <div className="text-xs text-gray-400 mt-1">يوم وسطياً لكل توظيف</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">عروض هذا الشهر</div>
              <div className="text-3xl font-bold text-gray-800">{data.proposalsThisMonth}</div>
              <div className="text-xs text-gray-400 mt-1">من أصل الحد المتاح في الاشتراك</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">طلبات التوظيف النشطة</div>
              <div className="text-3xl font-bold text-green-600">{data.activeJobRequests}</div>
              <div className="text-xs text-gray-400 mt-1">الطلبات المفتوحة التي لديكم عروض عليها</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-500 mb-1">معدل الاحتفاظ بالعملاء</div>
              <div className="text-3xl font-bold text-gray-800">
                {data.clientRetentionRate > 0 ? `${data.clientRetentionRate}%` : "—"}
              </div>
              <div className="text-xs text-gray-400 mt-1">قريباً في الإصدار القادم</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
