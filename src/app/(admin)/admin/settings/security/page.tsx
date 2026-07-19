export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TotpSetup from "./TotpSetup";

export default async function AdminSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { userType?: string }).userType !== "ADMIN") redirect("/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: { totpEnabled: true },
  });

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">الأمان</h1>
        <p className="text-sm text-gray-500 mt-1">إعدادات أمان الحساب</p>
      </div>

      <div className="p-8 max-w-xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">المصادقة الثنائية (2FA)</h2>
          <TotpSetup totpEnabled={admin?.totpEnabled ?? false} />
        </div>
      </div>
    </div>
  );
}
