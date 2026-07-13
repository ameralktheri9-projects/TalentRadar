export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  const { searchParams } = new URL(req.url);
  const proposal_id = searchParams.get("proposal_id");

  try {
    if (user.userType === "AGENCY") {
      const candidates = await prisma.candidateSubmission.findMany({
        where: {
          agency_id: user.entityId,
          ...(proposal_id ? { proposal_id } : {}),
        },
        include: {
          proposal: { include: { job_request: { select: { title: true, id: true } } } },
          interviews: { select: { outcome: true, scheduled_at: true, interview_type: true } },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json({ data: candidates });
    }

    if (user.userType === "COMPANY") {
      // Company sees candidates for their accepted proposals
      const candidates = await prisma.candidateSubmission.findMany({
        where: {
          proposal: {
            status: "ACCEPTED",
            job_request: { company_id: user.entityId },
          },
          ...(proposal_id ? { proposal_id } : {}),
        },
        include: {
          proposal: {
            include: {
              job_request: { select: { title: true, id: true } },
              agency: { select: { name_ar: true, name_en: true, id: true } },
            },
          },
          interviews: { select: { outcome: true, scheduled_at: true, interview_type: true } },
        },
        orderBy: { created_at: "desc" },
      });
      return NextResponse.json({ data: candidates });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      proposal_id,
      anon_summary,
      full_name,
      email,
      phone,
      current_title,
      years_experience,
      nationality,
      is_saudi,
      current_salary,
      expected_salary,
      consent_given,
    } = body;

    if (!proposal_id || !full_name || !email) {
      return NextResponse.json({ error: "proposal_id, full_name, email are required" }, { status: 400 });
    }

    if (!consent_given) {
      return NextResponse.json({ error: "consent_given must be true" }, { status: 400 });
    }

    // Validate proposal belongs to agency and is ACCEPTED
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposal_id, agency_id: user.entityId },
    });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status !== "ACCEPTED") {
      return NextResponse.json({ error: "Proposal must be ACCEPTED to submit candidates" }, { status: 400 });
    }

    const candidate = await prisma.candidateSubmission.create({
      data: {
        proposal_id,
        agency_id: user.entityId!,
        anon_summary,
        full_name,
        email,
        phone,
        cv_url: "STUB_CV_URL",
        current_title,
        years_experience: years_experience || 0,
        nationality,
        is_saudi: is_saudi || false,
        current_salary,
        expected_salary,
        status: "SUBMITTED",
        consent_given: true,
        consent_at: new Date(),
      },
    });

    return NextResponse.json({ data: candidate }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
