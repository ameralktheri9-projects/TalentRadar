export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [transactions, summary] = await Promise.all([
    prisma.escrowTransaction.findMany({
      include: {
        placement: {
          include: {
            company: { select: { name_ar: true } },
            agency: { select: { name_ar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.escrowTransaction.groupBy({
      by: ["payoutStatus"],
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({ data: transactions, summary });
}
