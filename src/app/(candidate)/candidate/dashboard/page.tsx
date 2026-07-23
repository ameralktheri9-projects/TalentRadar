"use client";
export const dynamic = "force-dynamic";

import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/locale.shared";

// TODO (Sprint 3): Replace placeholder data with real API calls using session-based candidate ID.

interface Application {
  id: string;
  jobRequestId: string;
  status: string;
  appliedAt: string;
}

interface Profile {
  profileScore: number;
  headline: string | null;
  aboutMe: string | null;
  photoUrl: string | null;
  cvUrl: string | null;
  skills: string[];
  expectedSalaryMin: number | null;
  availabilityStatus: string;
  location: string | null;
  experiences: unknown[];
  education: unknown[];
}

const CHECKLIST_ITEMS_AR = [
  { label: "أضف المسمى الوظيفي", field: "headline" },
  { label: "أضف نبذة عنك", field: "aboutMe" },
  { label: "أضف صورة شخصية", field: "photoUrl" },
  { label: "ارفع سيرتك الذاتية", field: "cvUrl" },
  { label: "أضف مهاراتك", field: "skills" },
  { label: "أضف الراتب المتوقع", field: "expectedSalaryMin" },
  { label: "أضف مدينتك", field: "location" },
];

const CHECKLIST_ITEMS_EN = [
  { label: "Add job title", field: "headline" },
  { label: "Add a bio", field: "aboutMe" },
  { label: "Add a profile photo", field: "photoUrl" },
  { label: "Upload your CV", field: "cvUrl" },
  { label: "Add your skills", field: "skills" },
  { label: "Add expected salary", field: "expectedSalaryMin" },
  { label: "Add your city", field: "location" },
];

function ProfileRing({ score, label }: { score: number; label: string }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-2xl font-bold text-blue-600" style={{ marginTop: "-70px", position: "relative", top: "-20px" }}>
        {score}%
      </span>
      <p className="text-sm text-gray-500 mt-4">{label}</p>
    </div>
  );
}

export default function CandidateDashboard() {
  const locale = useLocale();
  // Placeholder data — Sprint 3 will wire real auth + data fetching
  const profile: Partial<Profile> = { profileScore: 40, headline: null, skills: [], experiences: [], education: [] };
  const score = profile.profileScore ?? 0;

  const recentApplications: Application[] = [];
  const CHECKLIST_ITEMS = locale === "en" ? CHECKLIST_ITEMS_EN : CHECKLIST_ITEMS_AR;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        {locale === "ar" ? "مرحباً بك" : "Welcome"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile completeness */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center col-span-1">
          <ProfileRing score={score} label={locale === "ar" ? "اكتمال الملف الشخصي" : "Profile completion"} />
        </div>

        {/* Checklist */}
        {score < 80 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-2">
            <h2 className="font-semibold text-gray-700 mb-3">
              {locale === "ar" ? "أكمل ملفك الشخصي" : "Complete your profile"}
            </h2>
            <ul className="space-y-2">
              {CHECKLIST_ITEMS.map((item) => {
                const val = profile[item.field as keyof typeof profile];
                const done = Array.isArray(val) ? (val as unknown[]).length > 0 : !!val;
                return (
                  <li key={item.field} className="flex items-center gap-2 text-sm">
                    <span className={done ? "text-green-500" : "text-gray-300"}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className={done ? "line-through text-gray-400" : "text-gray-700"}>
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
            <a
              href="/candidate/onboarding"
              className="mt-4 inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === "ar" ? "أكمل ملفك الشخصي" : "Complete your profile"}
            </a>
          </div>
        )}
      </div>

      {/* Recommended jobs - placeholder for Sprint 3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          {locale === "ar" ? "وظائف مقترحة لك" : "Recommended Jobs"}
        </h2>
        <p className="text-sm text-gray-400 text-center py-6">
          {locale === "ar"
            ? "ستظهر الوظائف المقترحة بناءً على ملفك الشخصي في الإصدار القادم"
            : "Recommended jobs based on your profile will appear in the next release"}
        </p>
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          {locale === "ar" ? "آخر طلباتي" : "Recent Applications"}
        </h2>
        {recentApplications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            {locale === "ar" ? "لم تتقدم لأي وظيفة بعد" : "You haven't applied to any job yet"}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentApplications.slice(0, 3).map((app) => (
              <li key={app.id} className="py-3 flex justify-between text-sm">
                <span className="text-gray-700">{app.jobRequestId}</span>
                <span className="text-gray-500">{app.status}</span>
              </li>
            ))}
          </ul>
        )}
        <a href="/candidate/applications" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          {locale === "ar" ? "عرض جميع الطلبات" : "View all applications"}
        </a>
      </div>
    </div>
  );
}
