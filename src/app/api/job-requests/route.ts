export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { JobRequestStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

  try {
    if (user.userType === "AGENCY") {
      // Agency users see only OPEN requests
      const where: Record<string, unknown> = { status: "OPEN" };
      if (statusParam && statusParam !== "ALL") where.status = statusParam;

      const jobRequests = await prisma.jobRequest.findMany({
        where,
        include: {
          _count: { select: { proposals: true } },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json({ data: jobRequests });
    }

    // Company users see their own job requests
    const where: Record<string, unknown> = { company_id: user.entityId };
    if (statusParam && statusParam !== "ALL") where.status = statusParam as JobRequestStatus;

    const jobRequests = await prisma.jobRequest.findMany({
      where,
      include: {
        creator: { select: { full_name: true, email: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: jobRequests });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

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

    // Validate required fields
    if (!title || !description || !sector || !experience_level || salary_min == null || salary_max == null || !budget_type || budget_value == null) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب تعبئتها" }, { status: 400 });
    }

    // Validate salary range
    if (Number(salary_min) >= Number(salary_max)) {
      return NextResponse.json({ error: "يجب أن يكون الراتب الأدنى أقل من الراتب الأقصى" }, { status: 400 });
    }

    const jobRequest = await prisma.jobRequest.create({
      data: {
        company_id: user.entityId!,
        created_by: user.id,
        title,
        description,
        sector,
        experience_level,
        salary_min: Number(salary_min),
        salary_max: Number(salary_max),
        saudi_national_required: saudi_national_required || false,
        headcount: Number(headcount) || 1,
        sla_days: Number(sla_days) || 30,
        budget_type,
        budget_value: Number(budget_value),
        proposal_deadline: proposal_deadline ? new Date(proposal_deadline) : undefined,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ data: jobRequest }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
