// TODO (Sprint 4): Replace X-Candidate-ID header with proper next-auth session.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const candidateId = req.headers.get("x-candidate-id");
  if (!candidateId) {
    return NextResponse.json({ error: "X-Candidate-ID header required" }, { status: 401 });
  }

  try {
    // Find user and profile
    const user = await prisma.candidateUser.findUnique({
      where: { id: candidateId },
      include: {
        profile: {
          include: {
            applications: true,
            experiences: true,
            education: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (user.profile) {
        // Delete applications
        await tx.directApplication.deleteMany({ where: { profileId: user.profile!.id } });
        // Delete experiences
        await tx.workExperience.deleteMany({ where: { profileId: user.profile!.id } });
        // Delete education
        await tx.education.deleteMany({ where: { profileId: user.profile!.id } });
        // Delete profile
        await tx.candidateProfile.delete({ where: { id: user.profile!.id } });
      }
      // Delete user
      await tx.candidateUser.delete({ where: { id: candidateId } });
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
