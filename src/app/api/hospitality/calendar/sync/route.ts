/* ═══════════════════════════════════════════════════════
   MAELLIS — Calendrier Intelligent — Force Sync Endpoint

   GET /api/hospitality/calendar/sync?sourceId=<uuid>

   Force-synchronize a specific calendar source.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { calendarSyncService } from "@/lib/calendar-sync";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();
    const { searchParams } = request.nextUrl;
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { success: false, error: "sourceId requis" },
        { status: 400 }
      );
    }

    // Verify ownership
    const source = await db.calendarSource.findFirst({
      where: { id: sourceId, householdId },
    });

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Source introuvable" },
        { status: 404 }
      );
    }

    // Run sync
    const result = await calendarSyncService.syncSource(sourceId);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "NO_HOUSEHOLD") {
      return NextResponse.json(
        { success: false, error: "Aucun foyer associé" },
        { status: 401 }
      );
    }
    console.error("[CALENDAR SYNC] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
