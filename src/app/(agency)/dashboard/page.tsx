import Header from "@/components/layout/Header";
import Link from "next/link";

export default function AgencyDashboardPage() {
  return (
    <div>
      <Header
        title="لوحة تحكم الوكالة"
        subtitle="إدارة الطلبات والمرشحين"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "طلبات مطابقة", value: "0", icon: "🎯", color: "blue" },
            { label: "عروض نشطة", value: "0", icon: "📤", color: "green" },
            { label: "إجمالي التوظيفات", value: "0", icon: "🏆", color: "teal" },
            { label: "عمولات معلقة", value: "٠ ر.س", icon: "💵", color: "orange" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Performance */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "متوسط وقت التوظيف", value: "-- يوم", icon: "⏱️" },
            { label: "معدل الإنجاز", value: "--%", icon: "📊" },
            { label: "معدل الاستجابة", value: "--%", icon: "⚡" },
          ].map((metric) => (
            <div key={metric.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{metric.icon}</span>
                <div>
                  <div className="text-xl font-bold text-gray-800">{metric.value}</div>
                  <div className="text-xs text-gray-500">{metric.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Matched RFPs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">طلبات التوظيف المطابقة</h3>
            <Link href="/agency/rfp-inbox" className="text-sm text-blue-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📥</div>
              <p>لا توجد طلبات مطابقة حالياً</p>
            </div>
          </div>
        </div>

        {/* Active Proposals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">العروض النشطة</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📤</div>
              <p>لا توجد عروض نشطة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
