import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { AuthUser } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthUser;

  try {
    const where = user.userType === "COMPANY" ? { company_id: user.entityId } : {};
    const jobRequests = await prisma.jobRequest.findMany({
      where,
      include: {
        company: true,
        creator: { select: { full_name: true, email: true } },
        proposals: { select: { id: true, status: true } },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: jobRequests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      sector,
      experience_level,
      salary_min,
      salary_max,
      saudi_national_required,
      headcount,
      sla_days,
      budget_type,
      budget_value,
      proposal_deadline,
    } = body;

    const jobRequest = await prisma.jobRequest.create({
      data: {
        company_id: user.entityId!,
        created_by: user.id,
        title,
        description,
        sector,
        experience_level,
        salary_min,
        salary_max,
        saudi_national_required: saudi_national_required || false,
        headcount: headcount || 1,
        sla_days: sla_days || 30,
        budget_type,
        budget_value,
        proposal_deadline: proposal_deadline ? new Date(proposal_deadline) : undefined,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ data: jobRequest }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
