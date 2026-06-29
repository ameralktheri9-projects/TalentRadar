import Header from "@/components/layout/Header";
import Link from "next/link";

export default function CompanyDashboardPage() {
  return (
    <div>
      <Header
        title="لوحة تحكم الشركة"
        subtitle="مرحباً بك في منصة صيد المواهب"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "طلبات التوظيف المفتوحة", value: "0", icon: "📋", color: "blue" },
            { label: "العروض المستلمة", value: "0", icon: "📨", color: "green" },
            { label: "التوظيفات النشطة", value: "0", icon: "✅", color: "teal" },
            { label: "فواتير معلقة", value: "0", icon: "💰", color: "orange" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">إجراءات سريعة</h3>
          <div className="flex gap-3">
            <Link
              href="/job-requests/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              + إنشاء طلب توظيف جديد
            </Link>
            <Link
              href="/agencies"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              استعراض الوكالات
            </Link>
          </div>
        </div>

        {/* Recent Job Requests */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">طلبات التوظيف الأخيرة</h3>
            <Link href="/job-requests" className="text-sm text-blue-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>لا توجد طلبات توظيف بعد</p>
              <Link href="/job-requests/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                أنشئ أول طلب توظيف
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">أحدث العروض</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📨</div>
              <p>لا توجد عروض بعد</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
