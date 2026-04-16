/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Guest Voice Session Validation

   GET /api/guest/voice-session?token=XXX

   Valide un token d'accès invité et retourne les infos
   nécessaires pour initialiser l'interface vocale mobile.

   Public route (no auth cookie required).
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";

/* ─── Types de réponse ─── */

interface VoiceSessionSuccess {
  success: true;
  sessionId: string;
  householdId: string;
  guestName: string;
  householdName: string;
  stayInfo: {
    checkInDate: string | null;
    checkOutDate: string | null;
    stayDayNumber: number;
    expiresAt: string;
  };
}

interface VoiceSessionError {
  success: false;
  error: string;
}

type VoiceSessionResponse = VoiceSessionSuccess | VoiceSessionError;

/* ═══════════════════════════════════════════════════════
   GET — Valider le token invité
   ═══════════════════════════════════════════════════════ */

export async function GET(request: NextRequest): Promise<NextResponse<VoiceSessionResponse>> {
  try {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get("token");

    // Validation du paramètre
    if (!token || token.length < 16) {
      console.log("[GUEST-VOICE] Token manquant ou invalide (trop court)");
      return NextResponse.json<VoiceSessionError>(
        { success: false, error: "Token invalide" },
        { status: 400 }
      );
    }

    // Recherche du token dans la base
    const access = await db.guestAccess.findUnique({
      where: { token },
      include: {
        household: {
          select: {
            name: true,
          },
        },
      },
    });

    // Token introuvable
    if (!access) {
      console.log("[GUEST-VOICE] Token non trouvé:", token.slice(0, 8) + "...");
      return NextResponse.json<VoiceSessionError>(
        { success: false, error: "Token invalide" },
        { status: 401 }
      );
    }

    // Accès désactivé
    if (!access.isActive) {
      console.log("[GUEST-VOICE] Accès désactivé pour:", access.name);
      return NextResponse.json<VoiceSessionError>(
        { success: false, error: "Accès désactivé" },
        { status: 403 }
      );
    }

    // Token expiré
    const now = new Date();
    if (access.expiresAt < now) {
      console.log("[GUEST-VOICE] Token expiré pour:", access.name, "— exp:", access.expiresAt.toISOString());
      return NextResponse.json<VoiceSessionError>(
        { success: false, error: "Token expiré" },
        { status: 403 }
      );
    }

    // Calcul du numéro du jour de séjour
    const checkInMs = access.createdAt.getTime();
    const nowMs = now.getTime();
    const stayDayNumber = Math.max(1, Math.floor((nowMs - checkInMs) / (1000 * 60 * 60 * 24)) + 1);

    const response: VoiceSessionSuccess = {
      success: true,
      sessionId: access.id,
      householdId: access.householdId,
      guestName: access.name,
      householdName: access.household.name,
      stayInfo: {
        checkInDate: access.createdAt.toISOString(),
        checkOutDate: access.expiresAt.toISOString(),
        stayDayNumber,
        expiresAt: access.expiresAt.toISOString(),
      },
    };

    console.log("[GUEST-VOICE] Session validée:", access.name, "— jour", stayDayNumber);

    return NextResponse.json<VoiceSessionSuccess>(response);
  } catch (error) {
    console.error("[GUEST-VOICE] Erreur lors de la validation:", error);
    return NextResponse.json<VoiceSessionError>(
      { success: false, error: "Erreur serveur — veuillez réessayer" },
      { status: 500 }
    );
  }
}
