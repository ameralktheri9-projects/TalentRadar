export const dynamic = "force-dynamic";

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  jobRequest?: {
    title: string;
    sector: string;
  };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "مُقدَّم", className: "bg-blue-50 text-blue-700" },
  UNDER_REVIEW: { label: "قيد المراجعة", className: "bg-yellow-50 text-yellow-700" },
  INTERVIEW_INVITED: { label: "دعوة مقابلة", className: "bg-purple-50 text-purple-700" },
  OFFER_MADE: { label: "عرض وظيفي", className: "bg-green-50 text-green-700" },
  REJECTED: { label: "مرفوض", className: "bg-red-50 text-red-600" },
};

// TODO (Sprint 4): Read profileId from real candidate session
export default async function ApplicationsPage({ searchParams }: { searchParams: { profileId?: string } }) {
  let applications: Application[] = [];
  if (searchParams.profileId) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/candidate/applications?profileId=${searchParams.profileId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        applications = data.data ?? [];
      }
    } catch {
      // ignore
    }
  }

  return (
    <div dir="rtl" className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">طلباتي</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {applications.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            لم تتقدم لأي وظيفة بعد.{" "}
            <a href="/candidate/jobs" className="text-blue-600 hover:underline">استعرض الوظائف</a>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الوظيفة</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">القطاع</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">تاريخ التقديم</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map((app) => {
                const status = STATUS_LABELS[app.status] ?? { label: app.status, className: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{app.jobRequest?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{app.jobRequest?.sector ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(app.appliedAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
