export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { getLocale } from "@/lib/locale.server";
import { t } from "@/lib/locale.shared";

export default async function CompanyDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const locale = getLocale();
  const user = session.user as AuthUser;
  const companyId = user.entityId;

  const [openJobRequests, activeProposals, pendingInvoices, candidatesToReview, recentProposals] =
    await Promise.all([
      prisma.jobRequest.count({ where: { company_id: companyId, status: "OPEN" } }),
      prisma.proposal.count({
        where: {
          job_request: { company_id: companyId },
          status: { in: ["SUBMITTED", "SHORTLISTED", "ACCEPTED"] },
        },
      }),
      prisma.invoice.findMany({
        where: { company_id: companyId, status: "ISSUED" },
        select: { total_amount: true },
      }),
      prisma.candidateSubmission.count({
        where: {
          proposal: {
            status: "ACCEPTED",
            job_request: { company_id: companyId },
          },
          status: { in: ["SUBMITTED", "VIEWED"] },
        },
      }),
      prisma.proposal.findMany({
        where: { job_request: { company_id: companyId } },
        include: {
          job_request: { select: { title: true } },
          agency: { select: { name_ar: true } },
        },
        orderBy: { submitted_at: "desc" },
        take: 5,
      }),
    ]);

  const pendingInvoiceTotal = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div>
      <Header title={t(locale, "dashboard.title")} subtitle={t(locale, "dashboard.subtitle")} />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">{t(locale, "dashboard.openJobs")}</div>
            <div className="text-2xl font-bold text-gray-800">{openJobRequests}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">{t(locale, "dashboard.activeProposals")}</div>
            <div className="text-2xl font-bold text-gray-800">{activeProposals}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">{t(locale, "dashboard.pendingInvoices")}</div>
            <div className="text-2xl font-bold text-yellow-600">{pendingInvoices.length}</div>
            <div className="text-xs text-gray-400 mt-1">{pendingInvoiceTotal.toFixed(0)} {locale === "ar" ? "ر.س" : "SAR"}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">{t(locale, "dashboard.candidates")}</div>
            <div className="text-2xl font-bold text-blue-600">{candidatesToReview}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t(locale, "dashboard.quickActions")}</h3>
          <div className="flex gap-3">
            <Link
              href="/job-requests/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {t(locale, "dashboard.newJobRequest")}
            </Link>
            <Link
              href="/invoices"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {t(locale, "dashboard.viewInvoices")}
            </Link>
            <Link
              href="/candidates"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {t(locale, "dashboard.reviewCandidates")}
            </Link>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">{t(locale, "dashboard.recentProposals")}</h3>
          </div>
          {recentProposals.length === 0 ? (
            <div className="p-6 text-center text-gray-400 py-8">{t(locale, "dashboard.noProposals")}</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {recentProposals.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{p.agency.name_ar}</td>
                    <td className="p-4 text-gray-500">{p.job_request.title}</td>
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
