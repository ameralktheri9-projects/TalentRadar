import Header from "@/components/layout/Header";
import Link from "next/link";

export default function JobRequestsPage() {
  return (
    <div>
      <Header title="طلبات التوظيف" subtitle="إدارة جميع طلبات التوظيف" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">جميع الطلبات</h3>
          <Link
            href="/job-requests/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            + طلب جديد
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg font-medium">لا توجد طلبات توظيف</p>
          <Link href="/job-requests/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            أنشئ أول طلب
          </Link>
        </div>
      </div>
    </div>
  );
}
