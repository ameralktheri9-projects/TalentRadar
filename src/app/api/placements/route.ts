export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, AuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
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

    const placements = await prisma.placement.findMany({
      where,
      include: {
        candidate_submission: {
          select: { full_name: true, current_title: true },
        },
        company: { select: { name_ar: true } },
        agency: { select: { name_ar: true } },
        invoice: true,
        rating: { select: { id: true, overall_score: true } },
      },
      orderBy: { offer_made_at: "desc" },
    });

    return NextResponse.json({ data: placements });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if ((user as AuthUser & { role?: string }).role !== "HR_MANAGER") {
    return NextResponse.json({ error: "Only HR_MANAGER can record hires" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { candidate_submission_id, offer_amount, start_date } = body;

    if (!candidate_submission_id || !offer_amount || !start_date) {
      return NextResponse.json(
        { error: "candidate_submission_id, offer_amount, start_date are required" },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidateSubmission.findUnique({
      where: { id: candidate_submission_id },
      include: {
        proposal: {
          include: {
            job_request: true,
          },
        },
        interviews: true,
        placement: true,
      },
    });

    if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    if (candidate.proposal.job_request.company_id !== user.entityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (candidate.placement) {
      return NextResponse.json({ error: "Placement already exists for this candidate" }, { status: 409 });
    }
    if (candidate.interviews.length === 0) {
      return NextResponse.json({ error: "Candidate must have at least one interview before hire" }, { status: 400 });
    }

    const proposal = candidate.proposal;
    const startDateObj = new Date(start_date);
    const guaranteeEndDate = new Date(startDateObj);
    guaranteeEndDate.setDate(guaranteeEndDate.getDate() + proposal.guarantee_days);

    // Calculate fee
    let grossAmount: number;
    if (proposal.fee_type === "PERCENTAGE") {
      grossAmount = (offer_amount * proposal.fee_value) / 100;
    } else {
      grossAmount = proposal.fee_value;
    }

    const platformCut = grossAmount * 0.12;
    const agencyPayout = grossAmount - platformCut;
    const vatAmount = (grossAmount + platformCut) * 0.15;
    const totalAmount = grossAmount + vatAmount;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [placement] = await prisma.$transaction(async (tx) => {
      const pl = await tx.placement.create({
        data: {
          candidate_submission_id,
          company_id: user.entityId!,
          agency_id: candidate.agency_id,
          offer_amount,
          start_date: startDateObj,
          guarantee_end_date: guaranteeEndDate,
          status: "OFFER_MADE",
        },
      });

      await tx.invoice.create({
        data: {
          placement_id: pl.id,
          company_id: user.entityId!,
          agency_id: candidate.agency_id,
          gross_amount: grossAmount,
          platform_cut: platformCut,
          agency_payout: agencyPayout,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          status: "ISSUED",
          due_date: dueDate,
        },
      });

      await tx.candidateSubmission.update({
        where: { id: candidate_submission_id },
        data: { status: "HIRED" },
      });

      // Check if job request headcount is filled
      const jobRequest = proposal.job_request;
      const hiredCount = await tx.placement.count({
        where: {
          candidate_submission: {
            proposal: { job_request_id: jobRequest.id },
          },
          status: { not: "DECLINED" },
        },
      });

      if (hiredCount >= jobRequest.headcount) {
        await tx.jobRequest.update({
          where: { id: jobRequest.id },
          data: { status: "FILLED" },
        });
      }

      return [pl];
    });

    const result = await prisma.placement.findUnique({
      where: { id: placement.id },
      include: { invoice: true },
    });

    // Notify company and agency about placement
    try {
      const companyUser = await prisma.companyUser.findFirst({
        where: { company_id: user.entityId!, is_primary: true },
      });
      if (companyUser) {
        await createNotification({
          userId: companyUser.id,
          userType: "COMPANY_USER",
          event: "placement_created",
          title: "تم تسجيل التعيين",
          body: "تم تسجيل تعيين جديد بنجاح وسيتم إصدار الفاتورة قريباً",
          referenceId: placement.id,
          referenceType: "Placement",
          channel: "IN_APP",
        });
      }
      const agencyUser = await prisma.agencyUser.findFirst({
        where: { agency_id: candidate.agency_id },
      });
      if (agencyUser) {
        await createNotification({
          userId: agencyUser.id,
          userType: "AGENCY_USER",
          event: "placement_created",
          title: "تم تأكيد التعيين",
          body: "تم تأكيد تعيين مرشحك بنجاح. سيتم صرف العمولة عند سداد الفاتورة",
          referenceId: placement.id,
          referenceType: "Placement",
          channel: "IN_APP",
        });
      }
    } catch (notifError) {
      console.error("[placement notification]", notifError);
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

