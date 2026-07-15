// Stub — OpenAI CV parsing will be implemented in Sprint 3.
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filename } = body;

    console.log("[cv-parse stub] filename:", filename);

    // Return mock parsed data — Sprint 3 will call OpenAI to extract real data.
    return NextResponse.json({
      data: {
        headline: "",
        experiences: [],
        education: [],
        skills: [],
        languages: [],
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
