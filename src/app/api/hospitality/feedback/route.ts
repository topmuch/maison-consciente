/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Feedback API
   Submit and list stay feedback. Hospitality-only route.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";

/** Validate that a value is an integer between 1 and 5 */
function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

// GET — List feedback entries (limit 10, ordered by submittedAt desc)
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");

    const feedbacks = await db.stayFeedback.findMany({
      where: { householdId },
      orderBy: [{ submittedAt: "desc" }],
      take: 10,
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Feedback GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Submit feedback
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { stayRef, rating, cleanliness, comfort, location, comment } = body;

    // Validate required fields
    if (!stayRef || typeof stayRef !== "string" || stayRef.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Référence de séjour requise" }, { status: 400 });
    }

    if (!isValidRating(rating)) {
      return NextResponse.json({ success: false, error: "Note globale invalide (1-5 requise)" }, { status: 400 });
    }

    if (!isValidRating(cleanliness)) {
      return NextResponse.json({ success: false, error: "Note de propreté invalide (1-5 requise)" }, { status: 400 });
    }

    if (!isValidRating(comfort)) {
      return NextResponse.json({ success: false, error: "Note de confort invalide (1-5 requise)" }, { status: 400 });
    }

    if (!isValidRating(location)) {
      return NextResponse.json({ success: false, error: "Note d'emplacement invalide (1-5 requise)" }, { status: 400 });
    }

    const feedback = await db.stayFeedback.create({
      data: {
        householdId,
        stayRef: stayRef.trim(),
        rating,
        cleanliness,
        comfort,
        location,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Feedback POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
