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
    let threads;

    if (user.userType === "COMPANY") {
      threads = await prisma.messageThread.findMany({
        where: { companyId: user.entityId },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          proposal: {
            include: {
              job_request: { select: { title: true } },
              agency: { select: { name_ar: true } },
            },
          },
        },
        orderBy: { lastActivityAt: "desc" },
      });
    } else if (user.userType === "AGENCY") {
      threads = await prisma.messageThread.findMany({
        where: { agencyId: user.entityId },
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
          proposal: {
            include: {
              job_request: { select: { title: true, company: { select: { name_ar: true } } } },
              agency: { select: { name_ar: true } },
            },
          },
        },
        orderBy: { lastActivityAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
    }

    return NextResponse.json({ data: threads });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
