import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StatusBadge from "@/components/ui/StatusBadge";
import StarRating from "@/components/ui/StarRating";
import { Prisma } from "@prisma/client";

const SECTOR_OPTIONS = [
  { value: "TECHNOLOGY", label: "تقنية المعلومات" },
  { value: "HEALTHCARE", label: "الرعاية الصحية" },
  { value: "FINANCE", label: "المالية" },
  { value: "EDUCATION", label: "التعليم" },
  { value: "RETAIL", label: "التجزئة" },
  { value: "MANUFACTURING", label: "التصنيع" },
  { value: "CONSTRUCTION", label: "البناء والتشييد" },
  { value: "ENERGY", label: "الطاقة" },
  { value: "LOGISTICS", label: "اللوجستيات" },
  { value: "HOSPITALITY", label: "الضيافة" },
  { value: "MEDIA", label: "الإعلام" },
  { value: "GOVERNMENT", label: "الحكومة" },
  { value: "OTHER", label: "أخرى" },
];

const SECTOR_LABELS: Record<string, string> = Object.fromEntries(
  SECTOR_OPTIONS.map((o) => [o.value, o.label])
);

const TIER_LABELS: Record<string, string> = {
  FREE: "مجاني",
  BASIC: "أساسي",
  PRO: "احترافي",
  ELITE: "متميز",
};

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  ELITE: "bg-yellow-100 text-yellow-800",
};

const SORT_OPTIONS = [
  { value: "rating", label: "التقييم" },
  { value: "placements", label: "إجمالي التوظيفات" },
  { value: "time_to_fill", label: "سرعة الإنجاز" },
];

interface PageProps {
  searchParams: {
    sector?: string | string[];
    min_rating?: string;
    verified_only?: string;
    sort?: string;
  };
}

export default async function AgenciesPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sectors = Array.isArray(searchParams.sector)
    ? searchParams.sector
    : searchParams.sector
    ? [searchParams.sector]
    : [];
  const minRating = searchParams.min_rating ? Number(searchParams.min_rating) : 0;
  const verifiedOnly = searchParams.verified_only === "true";
  const sort = searchParams.sort ?? "rating";

  const where: Prisma.AgencyWhereInput = { status: "ACTIVE" };
  if (sectors.length > 0) {
    where.sector_tags = { hasSome: sectors };
  }
  if (minRating > 0) {
    where.rating_avg = { gte: minRating };
  }
  if (verifiedOnly) {
    where.hrsd_verified = true;
  }

  const orderBy: Prisma.AgencyOrderByWithRelationInput =
    sort === "placements"
      ? { total_placements: "desc" }
      : sort === "time_to_fill"
      ? { avg_time_to_fill_days: "asc" }
      : { rating_avg: "desc" };

  const agencies = await prisma.agency.findMany({
    where,
    orderBy,
  });

  const buildUrl = (params: Record<string, string | string[] | undefined>) => {
    const sp = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (!val) continue;
      if (Array.isArray(val)) {
        val.forEach((v) => sp.append(key, v));
      } else {
        sp.set(key, val);
      }
    }
    const qs = sp.toString();
    return `/agencies${qs ? `?${qs}` : ""}`;
  };

  return (
    <div>
      <Header title="الوكالات" subtitle="استعراض وكالات التوظيف المعتمدة" />
      <div className="p-6 flex gap-6" dir="rtl">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">تصفية النتائج</h3>

            {/* Sector filter */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">القطاع</p>
              <div className="space-y-1.5">
                {SECTOR_OPTIONS.map((s) => {
                  const isChecked = sectors.includes(s.value);
                  const newSectors = isChecked
                    ? sectors.filter((x) => x !== s.value)
                    : [...sectors, s.value];
                  return (
                    <Link
                      key={s.value}
                      href={buildUrl({
                        sector: newSectors,
                        min_rating: searchParams.min_rating,
                        verified_only: searchParams.verified_only,
                        sort,
                      })}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isChecked && "✓"}
                      </span>
                      {s.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Min rating */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">الحد الأدنى للتقييم</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <Link
                    key={r}
                    href={buildUrl({
                      sector: sectors,
                      min_rating: minRating === r ? undefined : String(r),
                      verified_only: searchParams.verified_only,
                      sort,
                    })}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      minRating === r
                        ? "bg-yellow-400 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-yellow-100"
                    }`}
                  >
                    {r}
                  </Link>
                ))}
              </div>
            </div>

            {/* Verified only */}
            <div>
              <Link
                href={buildUrl({
                  sector: sectors,
                  min_rating: searchParams.min_rating,
                  verified_only: verifiedOnly ? undefined : "true",
                  sort,
                })}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    verifiedOnly
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300"
                  }`}
                >
                  {verifiedOnly && "✓"}
                </span>
                معتمدة من هيئة الموارد البشرية فقط
              </Link>
            </div>

            {/* Sort */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">الترتيب حسب</p>
              <div className="space-y-1">
                {SORT_OPTIONS.map((s) => (
                  <Link
                    key={s.value}
                    href={buildUrl({
                      sector: sectors,
                      min_rating: searchParams.min_rating,
                      verified_only: searchParams.verified_only,
                      sort: s.value,
                    })}
                    className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sort === s.value
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Agency cards */}
        <div className="flex-1">
          {agencies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
              <div className="text-5xl mb-3">🏢</div>
              <p className="text-lg font-medium">لا توجد وكالات مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{agency.name_ar}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{agency.name_en}</p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        TIER_COLORS[agency.subscription_tier] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {TIER_LABELS[agency.subscription_tier] ?? agency.subscription_tier}
                    </span>
                  </div>

                  <div className="mb-3">
                    <StarRating rating={agency.rating_avg} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>
                      <span className="text-gray-400">إجمالي التوظيفات</span>
                      <p className="font-medium text-gray-800 mt-0.5">{agency.total_placements}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">متوسط وقت الإنجاز</span>
                      <p className="font-medium text-gray-800 mt-0.5">
                        {agency.avg_time_to_fill_days > 0
                          ? `${agency.avg_time_to_fill_days} يوم`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Sector tags */}
                  {agency.sector_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agency.sector_tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                        >
                          {SECTOR_LABELS[tag] ?? tag}
                        </span>
                      ))}
                      {agency.sector_tags.length > 4 && (
                        <span className="text-gray-400 text-xs py-0.5">
                          +{agency.sector_tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {agency.hrsd_verified && (
                      <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                        ✓ معتمدة هيئة الموارد البشرية
                      </span>
                    )}
                    <StatusBadge status={agency.status} variant="agency" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
