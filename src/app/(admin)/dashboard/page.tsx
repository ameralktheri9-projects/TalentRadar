import Header from "@/components/layout/Header";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <Header
        title="لوحة تحكم الإدارة"
        subtitle="إدارة المنصة والموافقات"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "شركات بانتظار الموافقة", value: "0", icon: "🏭", urgent: true },
            { label: "وكالات بانتظار الموافقة", value: "0", icon: "🏢", urgent: true },
            { label: "طلبات توظيف مفتوحة", value: "0", icon: "📋", urgent: false },
            { label: "توظيفات هذا الشهر", value: "0", icon: "🏆", urgent: false },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-xl border p-5 ${stat.urgent && parseInt(stat.value) > 0 ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Pending Approvals */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">شركات بانتظار الموافقة</h3>
              <Link href="/admin/companies" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="p-6">
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-2">🏭</div>
                <p className="text-sm">لا توجد شركات معلقة</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">وكالات بانتظار الموافقة</h3>
              <Link href="/admin/agencies" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="p-6">
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-2">🏢</div>
                <p className="text-sm">لا توجد وكالات معلقة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">إجراءات سريعة</h3>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/companies" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              إدارة الشركات
            </Link>
            <Link href="/admin/agencies" className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
              إدارة الوكالات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
