/* ═══════════════════════════════════════════════════════
   MAELLIS — Hospitality Cron Endpoint

   GET /api/cron/hospitality-check?secret=<CRON_SECRET>

   Triggered by Vercel Cron (or any scheduler) to:
   - Run daily concierge checks at 22h (if module active)
   - Run safe departure checks at 09h on checkout day (if module active)
   - Generate StayReviewReports for completed stays

   Authentication: CRON_SECRET environment variable
   Vercel Cron config (vercel.json):
     {
       "crons": [
         { "path": "/api/cron/hospitality-check", "schedule": "0 * * * *" }
       ]
     }
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import {
  runHospitalityCron,
  generateReportsForCompletedStays,
} from "@/lib/cron-hospitality-check";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate via CRON_SECRET
    const { searchParams } = req.nextUrl;
    const secret = searchParams.get("secret");

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Run the main hospitality cron
    const cronResult = await runHospitalityCron();

    // 3. Also generate reports for stays that completed today
    const reportResult = await generateReportsForCompletedStays();

    // 4. Return summary
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dailyChecksTriggered: cronResult.dailyChecksTriggered,
      departureChecksTriggered: cronResult.departureChecksTriggered,
      reportsGenerated: reportResult.generated,
      skippedNoPhone: cronResult.skippedNoPhone,
      skippedNoModule: cronResult.skippedNoModule,
      errors: [
        ...cronResult.errors,
        ...reportResult.errors,
      ],
    });
  } catch (error) {
    console.error("[Hospitality Cron API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
