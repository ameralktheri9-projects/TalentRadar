export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { getLocale } from "@/lib/locale.server";
import { t } from "@/lib/locale.shared";

interface Thread {
  id: string;
  lastActivityAt: string;
  proposal: {
    job_request: { title: string };
    agency: { name_ar: string };
  };
  messages: Array<{ body: string; isInternalNote: boolean; readByCompanyAt: string | null }>;
}

async function getThreads(): Promise<Thread[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    if (!session) return [];
    const user = session.user as { entityId?: string };
    const threads = await prisma.messageThread.findMany({
      where: { companyId: user.entityId },
      include: {
        proposal: { include: { job_request: { select: { title: true } }, agency: { select: { name_ar: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastActivityAt: "desc" },
      take: 50,
    });
    return threads as unknown as Thread[];
  } catch { return []; }
}

export default async function CompanyMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const locale = getLocale();
  const threads = await getThreads();

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"}>
      <Header title={t(locale, "messages.title")} subtitle={t(locale, "messages.subtitle")} />
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        {threads.length === 0 ? (
          <div className="text-center text-gray-400 py-12">{t(locale, "messages.empty")}</div>
        ) : (
          threads.map((thread) => {
            const lastMsg = thread.messages[0];
            const unread = lastMsg && !lastMsg.readByCompanyAt;
            return (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
                className={`block bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow ${
                  unread ? "border-blue-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">{thread.proposal.job_request.title}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(thread.lastActivityAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-1">{thread.proposal.agency.name_ar}</div>
                {lastMsg && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600 truncate flex-1">{lastMsg.body}</p>
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
