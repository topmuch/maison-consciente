/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Cron Sync Endpoint

   GET /api/cron/sync-calendars?secret=<CRON_SECRET>

   Triggered by Vercel Cron (or any scheduler) to:
   - Sync all active calendar sources (iCal URLs)
   - Run automation engine (arrival/departure triggers)

   Recommended schedule: every 30 minutes
   Vercel Cron config (cron expression: every 30 min)
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { calendarSyncService } from "@/lib/calendar-sync";
import { calendarAutomationEngine } from "@/lib/calendar-automations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate via CRON_SECRET
    const { searchParams } = req.nextUrl;
    const secret = searchParams.get("secret");

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    // 2. Run calendar sync for all active sources
    console.log("[Cron Sync Calendars] Starting...");
    const syncResult = await calendarSyncService.syncAllActiveSources();

    // 3. Run automation engine
    console.log("[Cron Sync Calendars] Running automations...");
    await calendarAutomationEngine.processAllHouseholds();

    // 4. Return summary
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: {
        totalSources: syncResult.totalSources,
        totalFetched: syncResult.totalFetched,
        totalCreated: syncResult.totalCreated,
        totalUpdated: syncResult.totalUpdated,
        totalCancelled: syncResult.totalCancelled,
      },
      errors: syncResult.errors,
    });
  } catch (error) {
    console.error("[Cron Sync Calendars] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
