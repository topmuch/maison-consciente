/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Smart Review Google API
   Submit internal feedback, manage review settings.
   Routes high-rating users to Google Review, low-rating to contact.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHousehold, requireRole } from "@/core/auth/guards";
import { z } from "zod";

// ─── Zod Schemas ───

const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const updateReviewSettingsSchema = z.object({
  googlePlaceId: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  expiryHours: z.number().int().min(1).max(720).optional(),
  maskLowRating: z.boolean().optional(),
});

// ─── Helper: Parse JSON safely ───

function parseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ─── Helper: Fetch Google Place rating ───

async function fetchGoogleRating(placeId: string): Promise<number | null> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return null;

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating&key=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return null;

    const data = await response.json() as { result?: { rating?: number }; status?: string };
    return data.result?.rating ?? null;
  } catch {
    return null;
  }
}

// ─── POST: Submit internal review ───

export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const body = await request.json();
    const parsed = submitReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { rating, comment } = parsed.data;

    // Create internal feedback
    const feedback = await db.internalFeedback.create({
      data: {
        householdId,
        rating,
        comment: comment ?? null,
      },
    });

    // Get household review settings
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        googlePlaceId: true,
        googleRating: true,
        reviewSettings: true,
      },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    const reviewSettings = parseJson<Record<string, unknown>>(household.reviewSettings, {});
    const isEnabled = reviewSettings.enabled !== false;

    if (!isEnabled) {
      return NextResponse.json({ success: true, feedback });
    }

    // High rating (>= 4) → redirect to Google Review
    if (rating >= 4 && household.googlePlaceId) {
      return NextResponse.json({
        success: true,
        feedback,
        googleReviewUrl: `https://search.google.com/local/writereview?placeid=${household.googlePlaceId}`,
      });
    }

    // Low rating (<= 3) → redirect to contact
    if (rating <= 3) {
      return NextResponse.json({
        success: true,
        feedback,
        showContact: true,
      });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[REVIEW] POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET: Get review status + recent feedbacks ───

export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    // Get household review config
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        googlePlaceId: true,
        googleRating: true,
        reviewSettings: true,
      },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    const reviewSettings = parseJson<Record<string, unknown>>(household.reviewSettings, {});
    const expiryHours = (reviewSettings.expiryHours as number) ?? 168; // Default 7 days

    // Mark expired feedbacks
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() - expiryHours);

    await db.internalFeedback.updateMany({
      where: {
        householdId,
        isExpired: false,
        createdAt: { lt: expiryDate },
      },
      data: { isExpired: true },
    });

    // Get recent feedbacks
    const recentFeedbacks = await db.internalFeedback.findMany({
      where: { householdId },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
    });

    return NextResponse.json({
      success: true,
      googleRating: household.googleRating,
      googlePlaceId: household.googlePlaceId,
      reviewSettings,
      recentFeedbacks,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[REVIEW] GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── PUT: Update review settings (owner/admin only) ───

export async function PUT(request: NextRequest) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const parsed = updateReviewSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { googlePlaceId, enabled, expiryHours, maskLowRating } = parsed.data;

    // Get current review settings
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        googlePlaceId: true,
        reviewSettings: true,
      },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    const currentSettings = parseJson<Record<string, unknown>>(household.reviewSettings, {});
    const newSettings: Record<string, unknown> = { ...currentSettings };

    if (enabled !== undefined) newSettings.enabled = enabled;
    if (expiryHours !== undefined) newSettings.expiryHours = expiryHours;
    if (maskLowRating !== undefined) newSettings.maskLowRating = maskLowRating;

    const updateData: Record<string, unknown> = {
      reviewSettings: JSON.stringify(newSettings),
    };

    // If googlePlaceId changed, fetch new rating from Google Places API
    if (googlePlaceId !== undefined && googlePlaceId !== household.googlePlaceId) {
      updateData.googlePlaceId = googlePlaceId;

      const newRating = await fetchGoogleRating(googlePlaceId);
      if (newRating !== null) {
        updateData.googleRating = newRating;
      }
    }

    await db.household.update({
      where: { id: householdId },
      data: updateData,
    });

    // Return updated household review info
    const updated = await db.household.findUnique({
      where: { id: householdId },
      select: {
        googlePlaceId: true,
        googleRating: true,
        reviewSettings: true,
      },
    });

    return NextResponse.json({
      success: true,
      reviewSettings: updated!.reviewSettings,
      googlePlaceId: updated!.googlePlaceId,
      googleRating: updated!.googleRating,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Accès réservé aux propriétaires" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "NO_HOUSEHOLD") {
      return NextResponse.json({ success: false, error: "Aucun foyer associé" }, { status: 401 });
    }
    console.error("[REVIEW] PUT error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
