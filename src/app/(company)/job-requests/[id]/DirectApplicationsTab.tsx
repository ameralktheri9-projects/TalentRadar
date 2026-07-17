"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  coverNote: string | null;
  status: string;
  aiSummary: string | null;
  matchScore: number | null;
  appliedAt: string;
  statusUpdatedAt: string;
  profile: {
    id: string;
    headline: string | null;
    profileScore: number;
    expectedSalaryMin: number | null;
    expectedSalaryMax: number | null;
    availabilityStatus: string;
    skills: string[];
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "مقدم",
  UNDER_REVIEW: "تحت المراجعة",
  INTERVIEW_INVITED: "دعوة مقابلة",
  REJECTED: "رفض",
  OFFER_MADE: "عرض وظيفي",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-600",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-700",
  INTERVIEW_INVITED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-600",
  OFFER_MADE: "bg-green-100 text-green-700",
};

export default function DirectApplicationsTab({ jobRequestId }: { jobRequestId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/company/job-requests/${jobRequestId}/applications`)
      .then((r) => r.json())
      .then((data) => {
        setApplications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobRequestId]);

  async function updateStatus(appId: string, status: string) {
    setUpdatingId(appId);
    await fetch(`/api/company/job-requests/${jobRequestId}/applications/${appId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    setUpdatingId(null);
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-400 text-sm">
        جاري التحميل...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
        <p>لا توجد طلبات مباشرة حتى الآن</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" dir="rtl">
      {applications.map((app) => (
        <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Headline */}
              <p className="font-semibold text-gray-900">
                {app.profile?.headline ?? "مرشح"}
              </p>

              {/* Profile score bar */}
              {app.profile && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">درجة الملف:</span>
                  <div className="flex-1 max-w-xs bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${app.profile.profileScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {app.profile.profileScore}%
                  </span>
                </div>
              )}

              {/* AI Summary */}
              {app.aiSummary && (
                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                  🤖 {app.aiSummary}
                </p>
              )}

              {/* Cover note */}
              {app.coverNote && (
                <p className="text-sm text-gray-500 italic">{app.coverNote}</p>
              )}

              {/* Salary + skills */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {app.profile?.expectedSalaryMin && (
                  <span>
                    الراتب المتوقع: {app.profile.expectedSalaryMin.toLocaleString("ar-SA")}
                    {app.profile.expectedSalaryMax
                      ? ` – ${app.profile.expectedSalaryMax.toLocaleString("ar-SA")}`
                      : ""}
                    {" "}ر.س
                  </span>
                )}
                <span>تاريخ التقديم: {new Date(app.appliedAt).toLocaleDateString("ar-SA")}</span>
              </div>

              {/* Skills */}
              {app.profile?.skills && app.profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {app.profile.skills.slice(0, 5).map((s) => (
                    <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              {/* Status badge */}
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[app.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[app.status] ?? app.status}
              </span>

              {/* Status dropdown */}
              <select
                value={app.status}
                onChange={(e) => updateStatus(app.id, e.target.value)}
                disabled={updatingId === app.id}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="SUBMITTED">مقدم</option>
                <option value="UNDER_REVIEW">تحت المراجعة</option>
                <option value="INTERVIEW_INVITED">دعوة مقابلة</option>
                <option value="REJECTED">رفض</option>
                <option value="OFFER_MADE">عرض وظيفي</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
