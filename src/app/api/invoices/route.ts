import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const where =
      user.userType === "COMPANY"
        ? { company_id: user.entityId }
        : user.userType === "AGENCY"
        ? { agency_id: user.entityId }
        : null;

    if (!where) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        placement: {
          include: {
            candidate_submission: { select: { full_name: true, current_title: true } },
          },
        },
        company: { select: { name_ar: true } },
        agency: { select: { name_ar: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: invoices });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
