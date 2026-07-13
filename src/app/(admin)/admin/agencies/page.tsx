export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AgencyStatus, SubscriptionTier } from "@prisma/client";
import AgencyActions from "./AgencyActions";

const STATUS_LABELS: Record<AgencyStatus, string> = {
  PENDING: "معلق",
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  REJECTED: "مرفوض",
};

const STATUS_COLORS: Record<AgencyStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  REJECTED: "bg-red-100 text-red-700",
};

const TIER_COLORS: Record<SubscriptionTier, string> = {
  FREE: "bg-gray-100 text-gray-600",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  ELITE: "bg-amber-100 text-amber-700",
};

interface Props {
  searchParams: { status?: string; search?: string };
}

export default async function AdminAgenciesPage({ searchParams }: Props) {
  const statusFilter = searchParams.status as AgencyStatus | undefined;
  const search = searchParams.search ?? "";

  const validStatus =
    statusFilter && Object.values(AgencyStatus).includes(statusFilter)
      ? statusFilter
      : undefined;

  const agencies = await prisma.agency.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
      ...(search
        ? {
            OR: [
              { name_ar: { contains: search, mode: "insensitive" } },
              { name_en: { contains: search, mode: "insensitive" } },
              { hrsd_licence: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { created_at: "desc" },
  });

  const tabs: Array<{ label: string; value: string }> = [
    { label: "الكل", value: "" },
    { label: "معلق", value: "PENDING" },
    { label: "نشط", value: "ACTIVE" },
    { label: "موقوف", value: "SUSPENDED" },
    { label: "مرفوض", value: "REJECTED" },
  ];

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الوكالات</h1>
        <p className="text-sm text-gray-500 mt-1">الموافقة على الوكالات وإدارة حالاتها</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/agencies${tab.value ? `?status=${tab.value}` : ""}`}
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
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">اسم الوكالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">ترخيص HRSD</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الباقة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التقييم</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">التوظيفات</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">معدل الإنجاز</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">معدل الاستجابة</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">تاريخ التسجيل</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agencies.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-gray-400">
                    لا توجد وكالات
                  </td>
                </tr>
              ) : (
                agencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/agencies/${agency.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {agency.name_ar}
                      </Link>
                      <div className="text-xs text-gray-400">{agency.name_en}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{agency.hrsd_licence}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIER_COLORS[agency.subscription_tier]}`}>
                        {agency.subscription_tier}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[agency.status]}`}>
                        {STATUS_LABELS[agency.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {agency.rating_avg > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          {agency.rating_avg.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{agency.total_placements}</td>
                    <td className="px-5 py-4 text-gray-600">{agency.fill_rate.toFixed(0)}%</td>
                    <td className="px-5 py-4 text-gray-600">{agency.response_rate.toFixed(0)}%</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(agency.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-5 py-4">
                      <AgencyActions agency={{ id: agency.id, status: agency.status }} />
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
