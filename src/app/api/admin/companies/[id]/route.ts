export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyStatus } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as AuthUser).userType !== "ADMIN") return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      job_requests: {
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          opened_at: true,
        },
        orderBy: { created_at: "desc" },
      },
      _count: { select: { job_requests: true, placements: true } },
    },
  });

  if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(company);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { action: "APPROVE" | "SUSPEND" | "REJECT" };

  let status: CompanyStatus;
  let cr_verified: boolean | undefined;

  if (body.action === "APPROVE") {
    status = CompanyStatus.ACTIVE;
    cr_verified = true;
  } else if (body.action === "SUSPEND") {
    status = CompanyStatus.SUSPENDED;
  } else if (body.action === "REJECT") {
    status = CompanyStatus.SUSPENDED; // REJECTED not in enum, using SUSPENDED
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: params.id },
    data: {
      status,
      ...(cr_verified !== undefined ? { cr_verified } : {}),
    },
  });

  return NextResponse.json(updated);
}
