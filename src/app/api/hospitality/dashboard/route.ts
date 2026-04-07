/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Dashboard API
   Aggregated dashboard data in one request. Hospitality-only.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";

// ─── Helper: Safe JSON parse ───
function safeJsonParse<T>(str: unknown, fallback: T): T {
  if (typeof str === "string") {
    try {
      return JSON.parse(str) as T;
    } catch {
      return fallback;
    }
  }
  return typeof str === "object" && str !== null ? str as T : fallback;
}

// GET — Aggregated dashboard data
export async function GET(_request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");

    // Fetch all data in parallel for performance
    const [pois, checkIns, journal, feedbacks, activeGuestCount] = await Promise.all([
      // Active POIs, limit 10
      db.pointOfInterest.findMany({
        where: { householdId, isActive: true },
        orderBy: [{ distanceMin: "asc" }],
        take: 10,
      }),

      // Currently checked-in guests, limit 10
      db.checkInState.findMany({
        where: { householdId, status: "checked-in" },
        orderBy: [{ checkInAt: "desc" }],
        take: 10,
      }),

      // Latest journal entries, limit 5
      db.travelJournal.findMany({
        where: { householdId },
        orderBy: [{ createdAt: "desc" }],
        take: 5,
      }),

      // Latest feedback, limit 5
      db.stayFeedback.findMany({
        where: { householdId },
        orderBy: [{ submittedAt: "desc" }],
        take: 5,
      }),

      // Count of currently checked-in guests
      db.checkInState.count({
        where: { householdId, status: "checked-in" },
      }),
    ]);

    // Parse JSON fields safely
    const parsedJournal = journal.map((entry) => ({
      ...entry,
      photos: safeJsonParse(entry.photos, []),
    }));

    return NextResponse.json({
      success: true,
      data: {
        pois,
        checkIns,
        journal: parsedJournal,
        feedbacks,
        activeGuestCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Dashboard GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
