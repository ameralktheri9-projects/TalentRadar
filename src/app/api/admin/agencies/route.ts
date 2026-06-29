import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgencyStatus } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as AuthUser).userType !== "ADMIN") return null;
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const whereStatus = statusParam && Object.values(AgencyStatus).includes(statusParam as AgencyStatus)
    ? (statusParam as AgencyStatus)
    : undefined;

  const agencies = await prisma.agency.findMany({
    where: {
      ...(whereStatus ? { status: whereStatus } : {}),
      ...(search
        ? {
            OR: [
              { name_ar: { contains: search, mode: "insensitive" } },
              { name_en: { contains: search, mode: "insensitive" } },
              { hrsd_licence: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name_ar: true,
      name_en: true,
      hrsd_licence: true,
      hrsd_verified: true,
      subscription_tier: true,
      status: true,
      rating_avg: true,
      total_placements: true,
      fill_rate: true,
      response_rate: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(agencies);
}
