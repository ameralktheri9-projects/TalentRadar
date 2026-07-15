export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { scoreAllAgenciesForJob } from "@/lib/matching";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobRequestId } = await req.json();
    if (!jobRequestId) {
      return NextResponse.json({ error: "jobRequestId is required" }, { status: 400 });
    }
    await scoreAllAgenciesForJob(jobRequestId);
    return NextResponse.json({ message: "Matching complete" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
