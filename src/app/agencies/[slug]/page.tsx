import { notFound } from "next/navigation";
import AgencyProfileCTA from "./AgencyProfileCTA";

interface AgencyData {
  id: string;
  name_en: string;
  name_ar: string;
  publicSlug: string | null;
  bio: string | null;
  sector_tags: string[];
  client_types: string[];
  subscription_tier: string;
  rating_avg: number;
  total_placements: number;
  avg_time_to_fill_days: number;
  fill_rate: number;
  response_rate: number;
  hrsd_verified: boolean;
  founded_year: number | null;
  team_size: number;
  ratings: {
    score_speed: number;
    score_quality: number;
    score_professionalism: number;
    score_outcome: number;
    overall_score: number;
    comment: string | null;
    created_at: string;
  }[];
}

async function getAgency(slug: string): Promise<AgencyData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/agencies/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: "تقنية المعلومات",
  HEALTHCARE: "الرعاية الصحية",
  FINANCE: "المالية",
  EDUCATION: "التعليم",
  RETAIL: "التجزئة",
  MANUFACTURING: "التصنيع",
  CONSTRUCTION: "البناء والتشييد",
  ENERGY: "الطاقة",
  LOGISTICS: "اللوجستيات",
  HOSPITALITY: "الضيافة",
  MEDIA: "الإعلام",
  GOVERNMENT: "الحكومة",
  OTHER: "أخرى",
};

const TAG_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
];

function StarRating({ score }: { score: number }) {
  return (
    <span className="text-yellow-500">
      {"★".repeat(Math.round(score))}{"☆".repeat(5 - Math.round(score))}
    </span>
  );
}

export default async function PublicAgencyProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const agency = await getAgency(params.slug);
  if (!agency) notFound();

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {agency.name_ar.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{agency.name_ar}</h1>
                <span className="text-gray-500 text-lg">{agency.name_en}</span>
                {agency.hrsd_verified && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                    ✓ موثّق
                  </span>
                )}
              </div>
              {agency.bio && (
                <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-2xl">{agency.bio}</p>
              )}
              <p className="text-gray-400 text-xs mt-2">
                {agency.founded_year && `تأسست عام ${agency.founded_year} · `}
                فريق من {agency.team_size} موظف
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "إجمالي التوظيفات", value: agency.total_placements.toString() },
            {
              label: "متوسط وقت الإنجاز",
              value: `${agency.avg_time_to_fill_days.toFixed(1)} يوم`,
            },
            {
              label: "التقييم",
              value: agency.rating_avg > 0 ? `${agency.rating_avg.toFixed(1)} / 5` : "—",
            },
            {
              label: "معدل الإنجاز",
              value: `${Math.round(agency.fill_rate * 100)}%`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center"
            >
              <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Specializations */}
        {agency.sector_tags.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">التخصصات</h2>
            <div className="flex flex-wrap gap-2">
              {agency.sector_tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {SECTOR_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ratings */}
        {agency.ratings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">آخر التقييمات</h2>
            <div className="space-y-4">
              {agency.ratings.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <StarRating score={r.overall_score} />
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>السرعة: {r.score_speed}/5</span>
                    <span>الجودة: {r.score_quality}/5</span>
                    <span>الاحترافية: {r.score_professionalism}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-2">سجل التوظيف</h2>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500 text-sm">سجل توظيف موثّق</p>
            <p className="text-gray-400 text-xs mt-1">
              {agency.total_placements} توظيف مكتمل حتى الآن
            </p>
          </div>
        </div>

        {/* CTA */}
        <AgencyProfileCTA />
      </div>
    </div>
  );
}
