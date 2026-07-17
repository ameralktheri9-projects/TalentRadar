export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  // Get candidateUserId from custom header (set by candidate auth flow)
  const candidateUserId = req.headers.get("x-candidate-user-id");
  if (!candidateUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const candidateUser = await prisma.candidateUser.findUnique({ where: { id: candidateUserId } });
  if (!candidateUser) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(currentPassword, candidateUser.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.candidateUser.update({
    where: { id: candidateUserId },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true });
}
