import { NextRequest, NextResponse } from "next/server";
import { locationEngine } from "@/lib/location-engine";
import { isValidCoordinates } from "@/lib/geo-utils";
import { prisma } from "@/lib/db";
import { logActionSync } from "@/lib/audit";

/* ═══════════════════════════════════════════════════════
   LOCATION UPDATE API — GPS Tracking Endpoint

   POST /api/location/update

   Sécurité : Auth via trackingToken (UUID unique par membre)
   + validation du consentement avant traitement.

   Body:
   {
     "trackingToken": "uuid",
     "lat": 48.8566,
     "lng": 2.3522,
     "accuracy": 10,
     "speed": 1.5,
     "heading": 180,
     "battery": 85
   }
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trackingToken,
      lat,
      lng,
      accuracy,
      speed,
      heading,
      battery,
    } = body as {
      trackingToken?: string;
      lat?: number;
      lng?: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      battery?: number;
    };

    // ── Validation tracking token ──
    if (!trackingToken || typeof trackingToken !== "string") {
      return NextResponse.json(
        { success: false, error: "trackingToken requis" },
        { status: 400 },
      );
    }

    // ── Validation coordonnées GPS ──
    if (lat == null || lng == null) {
      return NextResponse.json(
        { success: false, error: "lat et lng sont requis" },
        { status: 400 },
      );
    }

    if (!isValidCoordinates(lat, lng)) {
      return NextResponse.json(
        { success: false, error: "Coordonnées GPS invalides (lat: -90 à 90, lng: -180 à 180)" },
        { status: 400 },
      );
    }

    // ── Validation précision GPS max 1000m ──
    if (accuracy != null && (accuracy < 0 || accuracy > 1000)) {
      return NextResponse.json(
        { success: false, error: "Précision GPS invalide (0-1000m)" },
        { status: 400 },
      );
    }

    // ── Vérifier que le membre existe et a consenti ──
    const member = await prisma.familyMember.findUnique({
      where: { trackingToken },
      select: {
        id: true,
        name: true,
        consentGiven: true,
        isActive: true,
        householdId: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Membre non trouvé" },
        { status: 404 },
      );
    }

    if (!member.consentGiven || !member.isActive) {
      logActionSync({
        householdId: member.householdId,
        action: "location_update",
        details: `Tentative de tracking refusée: consentGiven=${member.consentGiven}, isActive=${member.isActive}`,
        status: "failure",
      });
      return NextResponse.json(
        { success: false, error: "Tracking désactivé — consentement non donné" },
        { status: 403 },
      );
    }

    // ── Traiter la mise à jour de position ──
    const result = await locationEngine.processLocationUpdate({
      trackingToken,
      lat,
      lng,
      accuracy,
      speed,
      heading,
      battery,
    });

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      memberName: result.memberName,
      newStatus: result.newStatus,
      events: result.events,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "MEMBER_NOT_FOUND") {
        return NextResponse.json(
          { success: false, error: "Membre non trouvé" },
          { status: 404 },
        );
      }
      if (err.message === "TRACKING_DISABLED") {
        return NextResponse.json(
          { success: false, error: "Tracking désactivé" },
          { status: 403 },
        );
      }
    }
    console.error("[LocationAPI] Update error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
