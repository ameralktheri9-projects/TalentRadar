export const dynamic = "force-dynamic";
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
    const placement = await prisma.placement.findUnique({
      where: { id: params.id },
      include: {
        candidate_submission: {
          select: { full_name: true, current_title: true, expected_salary: true },
        },
        company: { select: { name_ar: true } },
        agency: { select: { name_ar: true } },
        invoice: true,
        rating: true,
      },
    });

    if (!placement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.userType === "COMPANY" && placement.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.userType === "AGENCY" && placement.agency_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: placement });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;

  try {
    const body = await req.json();
    const { status } = body;

    const placement = await prisma.placement.findUnique({ where: { id: params.id } });
    if (!placement) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.userType === "COMPANY" && placement.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.userType === "AGENCY" && placement.agency_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validStatuses = ["ACCEPTED", "DECLINED", "STARTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `status must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "ACCEPTED") updateData.offer_accepted_at = new Date();

    const updated = await prisma.placement.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
