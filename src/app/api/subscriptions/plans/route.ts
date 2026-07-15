export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { AGENCY_LIMITS, COMPANY_LIMITS } from "@/lib/subscription-limits"

export async function GET() {
  return NextResponse.json({
    agency: AGENCY_LIMITS,
    company: COMPANY_LIMITS,
  })
}
