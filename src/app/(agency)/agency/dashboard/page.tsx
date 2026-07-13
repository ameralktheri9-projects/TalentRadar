export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default async function AgencyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;
  const agencyId = user.entityId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [matchedRFPs, activeProposals, placementsThisMonth, pendingCommission, agency, recentProposals] =
    await Promise.all([
      prisma.jobRequest.count({ where: { status: "OPEN" } }),
      prisma.proposal.count({
        where: {
          agency_id: agencyId,
          status: { in: ["SUBMITTED", "SHORTLISTED", "ACCEPTED"] },
        },
      }),
      prisma.placement.count({
        where: {
          agency_id: agencyId,
          offer_made_at: { gte: startOfMonth },
        },
      }),
      prisma.invoice.aggregate({
        where: { agency_id: agencyId, status: "ISSUED" },
        _sum: { agency_payout: true },
      }),
      prisma.agency.findUnique({
        where: { id: agencyId },
        select: { rating_avg: true, name_ar: true },
      }),
      prisma.proposal.findMany({
        where: { agency_id: agencyId },
        include: {
          job_request: { select: { title: true } },
        },
        orderBy: { submitted_at: "desc" },
        take: 5,
      }),
    ]);

  const pendingSAR = pendingCommission._sum.agency_payout ?? 0;
  const ratingAvg = agency?.rating_avg ?? 0;

  function renderStars(rating: number) {
    return [1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ));
  }

  return (
    <div>
      <Header title="لوحة تحكم الوكالة" subtitle="إدارة الطلبات والمرشحين" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">طلبات مطابقة</div>
            <div className="text-2xl font-bold text-gray-800">{matchedRFPs}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">عروض نشطة</div>
            <div className="text-2xl font-bold text-gray-800">{activeProposals}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">توظيفات هذا الشهر</div>
            <div className="text-2xl font-bold text-teal-600">{placementsThisMonth}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">عمولات معلقة</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingSAR.toLocaleString()} ر.س</div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">تقييمك الحالي</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-gray-800">
                {ratingAvg > 0 ? ratingAvg.toFixed(1) : "—"}
              </div>
              <div className="text-lg">{renderStars(ratingAvg)}</div>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">أحدث العروض</h3>
            <Link href="/rfp-inbox" className="text-sm text-blue-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          {recentProposals.length === 0 ? (
            <div className="p-6 text-center text-gray-400 py-8">لا توجد عروض بعد</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {recentProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{p.job_request.title}</td>
                    <td className="p-4">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {new Date(p.submitted_at).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
