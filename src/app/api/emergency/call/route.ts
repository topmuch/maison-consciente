import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { triggerHouseholdEmergency, isRetellConfigured } from "@/lib/retell-client";

/* ═══════════════════════════════════════════════════════
   EMERGENCY CALL API

   POST /api/emergency/call — Trigger emergency voice call
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { householdId, user } = await getAuthUser();
    const body = await req.json();
    const { reason, safeArrivalId } = body as {
      reason?: string;
      safeArrivalId?: string;
    };

    // Build reason string
    let callReason = reason || "Appel d'urgence depuis la maison";

    if (safeArrivalId) {
      // Look up the safe arrival record for context
      const arrival = await prisma.safeArrival.findUnique({
        where: { id: safeArrivalId },
      });

      if (arrival && arrival.householdId === householdId) {
        callReason = `Safe Arrival: ${arrival.memberName} non rentré(e) depuis ${arrival.lateMinutes} minutes`;
      }
    }

    // Trigger the emergency call
    const result = await triggerHouseholdEmergency(householdId, callReason);

    // Log the emergency call in UserLog regardless of success
    await prisma.userLog.create({
      data: {
        userId: user.id,
        householdId,
        action: "emergency_call",
        details: JSON.stringify({
          reason: callReason,
          success: result.success,
          callId: result.callId || null,
          error: result.error || null,
          safeArrivalId: safeArrivalId || null,
        }),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Impossible de lancer l'appel d'urgence",
          configured: isRetellConfigured(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      reason: callReason,
      configured: true,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Emergency Call] Error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
