import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as AuthUser;
  const { searchParams } = new URL(req.url);
  const proposal_id = searchParams.get("proposal_id");

  try {
    const where: Record<string, unknown> = {};
    if (user.userType === "AGENCY") where.agency_id = user.entityId;
    if (proposal_id) where.proposal_id = proposal_id;

    const candidates = await prisma.candidateSubmission.findMany({
      where,
      include: {
        proposal: { include: { job_request: true } },
        agency: { select: { name_ar: true, name_en: true } },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ data: candidates });
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
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      proposal_id,
      anon_summary,
      full_name,
      email,
      phone,
      cv_url,
      current_title,
      years_experience,
      nationality,
      is_saudi,
      current_salary,
      expected_salary,
      consent_given,
    } = body;

    const candidate = await prisma.candidateSubmission.create({
      data: {
        proposal_id,
        agency_id: user.entityId!,
        anon_summary,
        full_name,
        email,
        phone,
        cv_url,
        current_title,
        years_experience: years_experience || 0,
        nationality,
        is_saudi: is_saudi || false,
        current_salary,
        expected_salary,
        status: "SUBMITTED",
        consent_given: consent_given || false,
        consent_at: consent_given ? new Date() : undefined,
      },
    });

    return NextResponse.json({ data: candidate }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
