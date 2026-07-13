export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import SlaWarningButton from "./SlaWarningButton";

interface BreachEvent {
  id: string;
  agency_name: string;
  job_title: string;
  breach_type: "NO_RESPONSE" | "NO_CANDIDATE";
  hours_overdue: number;
}

async function getSlaBreaches(): Promise<BreachEvent[]> {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const openJobRequests = await prisma.jobRequest.findMany({
    where: { status: "OPEN", opened_at: { lt: fortyEightHoursAgo } },
    include: {
      proposals: { select: { agency_id: true } },
    },
  });

  const acceptedProposals = await prisma.proposal.findMany({
    where: { status: "ACCEPTED" },
    include: {
      agency: { select: { name_ar: true } },
      job_request: { select: { title: true, sla_days: true, opened_at: true } },
      candidate_submissions: { select: { id: true } },
    },
  });

  const breaches: BreachEvent[] = [];

  for (const jr of openJobRequests) {
    if (!jr.opened_at) continue;
    const hoursOpen = (now.getTime() - jr.opened_at.getTime()) / (60 * 60 * 1000);
    if (hoursOpen <= 48) continue;
    if (jr.proposals.length === 0) {
      breaches.push({
        id: `no-response-${jr.id}`,
        agency_name: "لا يوجد ردود",
        job_title: jr.title,
        breach_type: "NO_RESPONSE",
        hours_overdue: Math.round(hoursOpen - 48),
      });
    }
  }

  for (const proposal of acceptedProposals) {
    if (!proposal.job_request.opened_at) continue;
    const slaEnd = new Date(
      proposal.job_request.opened_at.getTime() +
        proposal.job_request.sla_days * 24 * 60 * 60 * 1000
    );
    if (now <= slaEnd) continue;
    if (proposal.candidate_submissions.length > 0) continue;
    const hoursOverdue = (now.getTime() - slaEnd.getTime()) / (60 * 60 * 1000);
    breaches.push({
      id: `no-candidate-${proposal.id}`,
      agency_name: proposal.agency.name_ar,
      job_title: proposal.job_request.title,
      breach_type: "NO_CANDIDATE",
      hours_overdue: Math.round(hoursOverdue),
    });
  }

  return breaches.sort((a, b) => b.hours_overdue - a.hours_overdue);
}

function severityClass(hours: number): string {
  if (hours > 120) return "text-red-600 font-semibold";
  if (hours > 72) return "text-orange-500 font-medium";
  return "text-yellow-600";
}

function severityBadge(hours: number): string {
  if (hours > 120) return "bg-red-100 text-red-700";
  if (hours > 72) return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
}

function severityLabel(hours: number): string {
  if (hours > 120) return "حرج";
  if (hours > 72) return "مرتفع";
  return "متوسط";
}

export default async function SlaPage() {
  const breaches = await getSlaBreaches();

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">مراقبة SLA</h1>
        <p className="text-sm text-gray-500 mt-1">خروقات اتفاقيات مستوى الخدمة</p>
      </div>

      <div className="p-8">
        {breaches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="text-4xl mb-3 text-green-400">✓</div>
            <p className="text-gray-500">لا توجد خروقات SLA حالياً</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                خروقات SLA
                <span className="mr-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {breaches.length}
                </span>
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الوكالة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">المنصب</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">نوع الخرق</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">ساعات التأخير</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">الخطورة</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {breaches.map((breach) => (
                  <tr key={breach.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-800">{breach.agency_name}</td>
                    <td className="px-5 py-4 text-gray-600">{breach.job_title}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {breach.breach_type === "NO_RESPONSE" ? "عدم الاستجابة" : "عدم تقديم مرشح"}
                      </span>
                    </td>
                    <td className={`px-5 py-4 ${severityClass(breach.hours_overdue)}`}>
                      {breach.hours_overdue} ساعة
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityBadge(breach.hours_overdue)}`}>
                        {severityLabel(breach.hours_overdue)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <SlaWarningButton breachId={breach.id} agencyName={breach.agency_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
