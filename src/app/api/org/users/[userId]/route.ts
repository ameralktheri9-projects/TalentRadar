export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const user = session.user as AuthUser;
  const callerId = (user as AuthUser & { id: string }).id;

  try {
    if (user.userType === "COMPANY") {
      const caller = await prisma.companyUser.findUnique({ where: { id: callerId } });
      if (!caller || caller.role !== "HR_MANAGER") {
        return NextResponse.json({ error: "يتطلب صلاحيات HR Manager" }, { status: 403 });
      }

      const count = await prisma.companyUser.count({ where: { company_id: user.entityId } });
      if (count <= 1) {
        return NextResponse.json({ error: "لا يمكن حذف المستخدم الأخير في المنظمة" }, { status: 400 });
      }

      await prisma.companyUser.delete({ where: { id: params.userId, company_id: user.entityId } });
      return NextResponse.json({ message: "User removed" });
    }

    if (user.userType === "AGENCY") {
      const caller = await prisma.agencyUser.findUnique({ where: { id: callerId } });
      if (!caller || caller.role !== "OWNER") {
        return NextResponse.json({ error: "يتطلب صلاحيات المالك" }, { status: 403 });
      }

      const count = await prisma.agencyUser.count({ where: { agency_id: user.entityId } });
      if (count <= 1) {
        return NextResponse.json({ error: "لا يمكن حذف المستخدم الأخير في المنظمة" }, { status: 400 });
      }

      await prisma.agencyUser.delete({ where: { id: params.userId, agency_id: user.entityId } });
      return NextResponse.json({ message: "User removed" });
    }

    return NextResponse.json({ error: "غير مسموح" }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
