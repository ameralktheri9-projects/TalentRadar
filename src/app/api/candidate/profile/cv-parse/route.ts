export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        data: {
          headline: "",
          experiences: [],
          education: [],
          skills: [],
          languages: [],
        },
      });
    }

    const prompt = `Extract structured data from this CV text. Return JSON only with this exact structure:
{
  "headline": "string — professional headline/summary",
  "experiences": [{"company": "string", "title": "string", "startDate": "string|null", "endDate": "string|null", "isCurrent": boolean, "description": "string"}],
  "education": [{"institution": "string", "degree": "string", "fieldOfStudy": "string", "startYear": number|null, "endYear": number|null}],
  "skills": ["string"],
  "languages": ["string"]
}

CV text:
${text.slice(0, 4000)}`;

    const res = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    let parsed;
    try {
      parsed = JSON.parse(res.choices[0].message.content ?? "{}");
    } catch {
      parsed = { headline: "", experiences: [], education: [], skills: [], languages: [] };
    }

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
