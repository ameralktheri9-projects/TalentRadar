import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyStatus } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

function isAdmin(session: { user?: unknown } | null): boolean {
  if (!session || !session.user) return false;
  return (session.user as AuthUser).userType === "ADMIN";
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const search = searchParams.get("search") ?? "";

  const whereStatus = statusParam && Object.values(CompanyStatus).includes(statusParam as CompanyStatus)
    ? (statusParam as CompanyStatus)
    : undefined;

  const companies = await prisma.company.findMany({
    where: {
      ...(whereStatus ? { status: whereStatus } : {}),
      ...(search
        ? {
            OR: [
              { name_ar: { contains: search, mode: "insensitive" } },
              { name_en: { contains: search, mode: "insensitive" } },
              { cr_number: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      users: {
        select: { id: true, email: true, is_primary: true },
      },
      _count: {
        select: { job_requests: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const result = companies.map((c) => ({
    id: c.id,
    name_ar: c.name_ar,
    name_en: c.name_en,
    cr_number: c.cr_number,
    cr_verified: c.cr_verified,
    status: c.status,
    created_at: c.created_at,
    primary_email: c.users.find((u) => u.is_primary)?.email ?? c.users[0]?.email ?? null,
    user_count: c.users.length,
    job_request_count: c._count.job_requests,
  }));

  return NextResponse.json(result);
}
