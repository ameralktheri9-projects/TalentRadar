import { prisma } from "./prisma";

export async function createNotification(params: {
  userId: string;
  userType: "COMPANY_USER" | "AGENCY_USER" | "ADMIN" | "CANDIDATE";
  event: string;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
  channel?: "IN_APP" | "EMAIL" | "BOTH";
}) {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      userType: params.userType,
      event: params.event,
      title: params.title,
      body: params.body,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
      channel: params.channel ?? "IN_APP",
    },
  });
}
