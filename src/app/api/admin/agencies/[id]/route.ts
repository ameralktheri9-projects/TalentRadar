export const dynamic = "force-dynamic";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agency = await prisma.agency.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      proposals: {
        select: {
          id: true,
          status: true,
          submitted_at: true,
          fee_type: true,
          fee_value: true,
          job_request: { select: { title: true, company: { select: { name_ar: true } } } },
        },
        orderBy: { submitted_at: "desc" },
        take: 20,
      },
      subscriptions: {
        orderBy: { started_at: "desc" },
        take: 5,
      },
      _count: { select: { placements: true, proposals: true } },
    },
  });

  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(agency);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { action: "APPROVE" | "SUSPEND" | "REJECT" };

  let status: AgencyStatus;
  let hrsd_verified: boolean | undefined;

  if (body.action === "APPROVE") {
    status = AgencyStatus.ACTIVE;
    hrsd_verified = true;
  } else if (body.action === "SUSPEND") {
    status = AgencyStatus.SUSPENDED;
  } else if (body.action === "REJECT") {
    status = AgencyStatus.REJECTED;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.agency.update({
    where: { id: params.id },
    data: {
      status,
      ...(hrsd_verified !== undefined ? { hrsd_verified } : {}),
    },
  });

  return NextResponse.json(updated);
}
