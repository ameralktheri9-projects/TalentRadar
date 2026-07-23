export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface PageProps {
  searchParams: { sector?: string; experience_level?: string };
}

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: "مبتدئ",
  MID: "متوسط",
  SENIOR: "أول",
  DIRECTOR: "مدير",
  C_SUITE: "تنفيذي",
};

export default async function CandidateJobsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  const where: Record<string, unknown> = { status: "OPEN" };
  if (searchParams.sector) where.sector = searchParams.sector;
  if (searchParams.experience_level) where.experience_level = searchParams.experience_level;

  const jobs = await prisma.jobRequest.findMany({
    where,
    select: {
      id: true,
      title: true,
      sector: true,
      salary_min: true,
      salary_max: true,
      experience_level: true,
      created_at: true,
      company: { select: { city: true } },
    },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  // Get the set of job IDs the candidate has already applied to
  let appliedJobIds = new Set<string>();
  if (session?.user) {
    const candidateUser = await prisma.candidateUser.findUnique({
      where: { id: (session.user as { id?: string }).id },
      include: { profile: { select: { id: true } } },
    });
    if (candidateUser?.profile?.id) {
      const applications = await prisma.directApplication.findMany({
        where: { profileId: candidateUser.profile.id },
        select: { jobRequestId: true },
      });
      appliedJobIds = new Set(applications.map((a) => a.jobRequestId));
    }
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
          jobs.map((job) => {
            const isApplied = appliedJobIds.has(job.id);
            return (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-800 text-base">{job.title}</h2>
                    {isApplied && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        ✓ تم التقديم
                      </span>
                    )}
                  </div>
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
                {isApplied ? (
                  <Link
                    href={`/candidate/jobs/${job.id}`}
                    className="flex-shrink-0 bg-green-50 text-green-700 border border-green-200 text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    عرض طلبي
                  </Link>
                ) : (
                  <Link
                    href={`/candidate/jobs/${job.id}`}
                    className="flex-shrink-0 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تقديم
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
