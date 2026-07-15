export const dynamic = "force-dynamic";

interface JobRequest {
  id: string;
  title: string;
  sector: string;
  salary_min: number;
  salary_max: number;
  experience_level: string;
  created_at: string;
  company?: { city?: string };
}

interface PageProps {
  searchParams: { sector?: string; experience_level?: string; page?: string };
}

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "أول",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

export default async function CandidateJobsPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  params.set("status", "OPEN");
  if (searchParams.sector) params.set("sector", searchParams.sector);
  if (searchParams.page) params.set("page", searchParams.page);
  params.set("limit", "20");

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  let jobs: JobRequest[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/candidate/jobs?${params.toString()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      jobs = data.data ?? [];
    }
  } catch {
    // silently ignore during build
  }

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">الوظائف المتاحة</h1>
        <span className="text-sm text-gray-500">{jobs.length} وظيفة</span>
      </div>

      {/* Filters */}
      <form className="flex gap-3 flex-wrap">
        <select
          name="experience_level"
          defaultValue={searchParams.experience_level ?? ""}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">جميع المستويات</option>
          {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          تصفية
        </button>
      </form>

      {/* Job cards */}
      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
            لا توجد وظائف متاحة حالياً
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-800 text-base">{job.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">{job.sector}</span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {EXPERIENCE_LABELS[job.experience_level] ?? job.experience_level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {job.salary_min?.toLocaleString()} – {job.salary_max?.toLocaleString()} SAR
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(job.created_at).toLocaleDateString("ar-SA")}
                </p>
              </div>
              <a
                href={`/candidate/jobs/${job.id}`}
                className="flex-shrink-0 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                تقديم
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
