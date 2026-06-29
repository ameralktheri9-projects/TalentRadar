import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CompanyStatus } from "@prisma/client";
import CompanyActions from "./CompanyActions";

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

interface Props {
  searchParams: { status?: string; search?: string };
}

export default async function AdminCompaniesPage({ searchParams }: Props) {
  const statusFilter = searchParams.status as CompanyStatus | undefined;
  const search = searchParams.search ?? "";

  const validStatus =
    statusFilter && Object.values(CompanyStatus).includes(statusFilter)
      ? statusFilter
      : undefined;

  const companies = await prisma.company.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
      ...(search
        ? {
            OR: [
              { name_ar: { contains: search, mode: "insensitive" } },
              { name_en: { contains: search, mode: "insensitive" } },
              { cr_number: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      users: { select: { id: true, email: true, is_primary: true } },
      _count: { select: { job_requests: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const tabs: Array<{ label: string; value: string }> = [
    { label: "الكل", value: "" },
    { label: "معلق", value: "PENDING" },
    { label: "نشط", value: "ACTIVE" },
    { label: "موقوف", value: "SUSPENDED" },
  ];

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الشركات</h1>
        <p className="text-sm text-gray-500 mt-1">الموافقة على الشركات وإدارة حالاتها</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/companies${tab.value ? `?status=${tab.value}` : ""}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                (tab.value === "" && !statusFilter) || tab.value === statusFilter
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">اسم الشركة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">رقم السجل التجاري</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التحقق</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المستخدمون</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">طلبات التوظيف</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">تاريخ التسجيل</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                    لا توجد شركات
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/companies/${company.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {company.name_ar}
                      </Link>
                      <div className="text-xs text-gray-400">{company.name_en}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{company.cr_number}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[company.status]}`}>
                        {STATUS_LABELS[company.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {company.cr_verified ? (
                        <span className="text-green-600 font-medium text-xs">محقق</span>
                      ) : (
                        <span className="text-gray-400 text-xs">غير محقق</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{company.users.length}</td>
                    <td className="px-5 py-4 text-gray-600">{company._count.job_requests}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(company.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-5 py-4">
                      <CompanyActions company={{ id: company.id, status: company.status }} />
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
