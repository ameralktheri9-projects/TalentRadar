export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // entityId is agencyUser row id
  const agencyUser = await prisma.agencyUser.findUnique({ where: { id: user.entityId } });
  if (!agencyUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const agency = await prisma.agency.findUnique({ where: { id: agencyUser.agency_id } });
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: agency.id,
    name_ar: agency.name_ar,
    name_en: agency.name_en,
    publicSlug: agency.publicSlug,
    bio: agency.bio,
    sector_tags: agency.sector_tags,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as AuthUser;
  if (user.userType !== "AGENCY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const agencyUser = await prisma.agencyUser.findUnique({ where: { id: user.entityId } });
  if (!agencyUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only OWNER can edit
  if (agencyUser.role !== "OWNER") {
    return NextResponse.json({ error: "Only OWNER can edit profile" }, { status: 403 });
  }

  const body = await req.json();
  const { name_ar, name_en, publicSlug, bio, sector_tags } = body;

  if (publicSlug !== undefined) {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(publicSlug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }
    // Check uniqueness
    const existing = await prisma.agency.findUnique({ where: { publicSlug } });
    if (existing && existing.id !== agencyUser.agency_id) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.agency.update({
    where: { id: agencyUser.agency_id },
    data: {
      ...(name_ar !== undefined && { name_ar }),
      ...(name_en !== undefined && { name_en }),
      ...(publicSlug !== undefined && { publicSlug }),
      ...(bio !== undefined && { bio }),
      ...(sector_tags !== undefined && { sector_tags }),
    },
  });

  return NextResponse.json(updated);
}
