export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    if (user.userType === "COMPANY") {
      const users = await prisma.companyUser.findMany({
        where: { company_id: user.entityId },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          is_primary: true,
          status: true,
          company_id: true,
        },
      });
      return NextResponse.json({ data: users });
    }

    if (user.userType === "AGENCY") {
      const agencyUser = await prisma.agencyUser.findUnique({
        where: { id: (user as AuthUser & { id: string }).id },
      });
      if (!agencyUser || agencyUser.role !== "OWNER") {
        return NextResponse.json({ error: "يتطلب صلاحيات المالك" }, { status: 403 });
      }

      const users = await prisma.agencyUser.findMany({
        where: { agency_id: user.entityId },
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          status: true,
          agency_id: true,
        },
      });
      return NextResponse.json({ data: users });
    }

    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
