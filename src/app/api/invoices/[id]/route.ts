import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        placement: {
          include: {
            candidate_submission: { select: { full_name: true, current_title: true } },
          },
        },
        company: { select: { name_ar: true, name_en: true } },
        agency: { select: { name_ar: true, name_en: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.userType === "COMPANY" && invoice.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.userType === "AGENCY" && invoice.agency_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: invoice });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
