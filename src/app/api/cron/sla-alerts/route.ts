// Required env vars: CRON_SECRET (set in Vercel project settings and .env.local)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find open job requests whose proposal deadline is within the next 24h and haven't been alerted yet
    const atRiskJobs = await prisma.jobRequest.findMany({
      where: {
        status: "OPEN",
        proposal_deadline: {
          lte: in24h,
          gte: now,
        },
        sla_alert_sent_at: null,
      },
      include: {
        company: {
          include: {
            users: {
              where: { is_primary: true },
              take: 1,
            },
          },
        },
      },
    });

    let processed = 0;

    for (const jr of atRiskJobs) {
      const primaryUser = jr.company.users[0];
      if (!primaryUser) continue;

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: primaryUser.id,
          userType: "COMPANY_USER",
          event: "sla_warning",
          title: "تحذير: اقتراب موعد انتهاء المهلة",
          body: `طلب التوظيف "${jr.title}" سينتهي موعد تقديم العروض خلال 24 ساعة`,
          referenceId: jr.id,
          referenceType: "JobRequest",
          channel: "BOTH",
        },
      });

      // Send email
      await sendEmail(primaryUser.email, EMAIL_TEMPLATES.SLA_WARNING, {
        jobTitle: jr.title,
        deadline: jr.proposal_deadline,
      });

      // Mark alert sent
      await prisma.jobRequest.update({
        where: { id: jr.id },
        data: { sla_alert_sent_at: now },
      });

      processed++;
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error("[cron/sla-alerts]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
