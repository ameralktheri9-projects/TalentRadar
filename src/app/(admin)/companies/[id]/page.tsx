import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CompanyStatus } from "@prisma/client";
import CompanyDetailActions from "./CompanyDetailActions";

const STATUS_LABELS: Record<CompanyStatus, string> = {
  PENDING: "معلق",
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
};

const STATUS_COLORS: Record<CompanyStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "تقنية المعلومات",
  HEALTHCARE: "الرعاية الصحية",
  FINANCE: "المالية",
  EDUCATION: "التعليم",
  RETAIL: "تجزئة",
  MANUFACTURING: "التصنيع",
  CONSTRUCTION: "البناء",
  ENERGY: "الطاقة",
  LOGISTICS: "اللوجستيات",
  HOSPITALITY: "الضيافة",
  MEDIA: "الإعلام",
  GOVERNMENT: "الحكومة",
  OTHER: "أخرى",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  OPEN: "مفتوح",
  CLOSED: "مغلق",
  FILLED: "ممتلئ",
  CANCELLED: "ملغي",
};

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      users: { orderBy: { is_primary: "desc" } },
      job_requests: {
        select: { id: true, title: true, status: true, created_at: true },
        orderBy: { created_at: "desc" },
      },
      _count: { select: { job_requests: true, placements: true } },
    },
  });

  if (!company) notFound();

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/companies" className="text-sm text-gray-400 hover:text-gray-600">
                الشركات
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-sm text-gray-600">{company.name_ar}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name_ar}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-gray-500">{company.cr_number}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[company.status]}`}>
                {STATUS_LABELS[company.status]}
              </span>
              {company.cr_verified && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  سجل تجاري محقق
                </span>
              )}
            </div>
          </div>
          <CompanyDetailActions companyId={company.id} status={company.status} />
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Overview Grid */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">نظرة عامة</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "الاسم بالعربية", value: company.name_ar },
              { label: "الاسم بالإنجليزية", value: company.name_en },
              { label: "رقم السجل التجاري", value: company.cr_number },
              { label: "القطاع", value: SECTOR_LABELS[company.industry_sector] ?? company.industry_sector },
              { label: "المدينة", value: company.city },
              { label: "عدد الموظفين السعوديين", value: company.saudi_employee_count.toString() },
              { label: "إجمالي الموظفين", value: company.total_employee_count.toString() },
              { label: "تاريخ التسجيل", value: new Date(company.created_at).toLocaleDateString("ar-SA") },
              { label: "طلبات التوظيف", value: company._count.job_requests.toString() },
              { label: "التوظيفات", value: company._count.placements.toString() },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">المستخدمون ({company.users.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الاسم</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">البريد الإلكتروني</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الدور</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">رئيسي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {company.users.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-3 text-gray-800">{user.full_name}</td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3 text-gray-500">{user.role}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.is_primary && <span className="text-xs text-blue-600">رئيسي</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Job Requests */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">طلبات التوظيف ({company.job_requests.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">العنوان</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {company.job_requests.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    لا توجد طلبات توظيف
                  </td>
                </tr>
              ) : (
                company.job_requests.map((jr) => (
                  <tr key={jr.id}>
                    <td className="px-5 py-3 text-gray-800">{jr.title}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {JOB_STATUS_LABELS[jr.status] ?? jr.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(jr.created_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
