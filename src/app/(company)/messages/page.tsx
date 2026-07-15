export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";

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
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/messages/threads`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default async function CompanyMessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const threads = await getThreads();

  return (
    <div dir="rtl">
      <Header title="الرسائل" subtitle="محادثاتك مع الوكالات" />
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        {threads.length === 0 ? (
          <div className="text-center text-gray-400 py-12">لا توجد محادثات بعد</div>
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
                    {new Date(thread.lastActivityAt).toLocaleDateString("ar-SA")}
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
