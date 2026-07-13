export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions, AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import RatingForm from "./RatingForm";

export default async function RatePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as AuthUser;

  const placement = await prisma.placement.findUnique({
    where: { id: params.id },
    include: {
      agency: { select: { name_ar: true } },
      candidate_submission: { select: { full_name: true } },
      rating: { select: { id: true } },
    },
  });

  if (!placement) notFound();
  if (placement.company_id !== user.entityId) redirect("/placements");
  if (placement.status !== "STARTED") redirect("/placements");
  if (placement.rating) redirect("/placements");

  return (
    <div>
      <Header
        title="تقييم الوكالة"
        subtitle={`تقييم ${placement.agency.name_ar} — ${placement.candidate_submission.full_name}`}
      />

      <div className="p-6 max-w-xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <RatingForm placementId={placement.id} />
        </div>
      </div>
    </div>
  );
}
