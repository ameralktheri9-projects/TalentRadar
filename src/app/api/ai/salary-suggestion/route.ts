export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCompanyTier, COMPANY_LIMITS } from "@/lib/subscription-limits";
import { suggestSalaryRange } from "@/lib/ai-salary";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  }

  try {
    // Get company ID from CompanyUser
    const companyUser = await prisma.companyUser.findUnique({ where: { id: user.entityId } });
    if (!companyUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const tier = await getCompanyTier(companyUser.company_id);
    if (!COMPANY_LIMITS[tier].aiSalary) {
      return NextResponse.json({ error: "يتطلب اشتراك BASIC أو أعلى" }, { status: 402 });
    }

    const { role, sector, seniority } = await req.json();
    if (!role || !sector || !seniority) {
      return NextResponse.json({ error: "role و sector و seniority مطلوبة" }, { status: 400 });
    }

    const result = await suggestSalaryRange(role, sector, seniority);
    const source = process.env.OPENAI_API_KEY ? "ai" : "estimate";

    return NextResponse.json({ ...result, source });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
