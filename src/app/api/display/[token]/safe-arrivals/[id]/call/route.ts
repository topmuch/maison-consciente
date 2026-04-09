import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerHouseholdEmergency, isRetellConfigured } from "@/lib/retell-client";

/* ═══════════════════════════════════════════════════════
   DISPLAY SAFE ARRIVAL CALL — Tablet Emergency Call

   POST /api/display/:token/safe-arrivals/:id/call
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;

    // Validate display token
    const household = await prisma.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 403 }
      );
    }

    // Validate the arrival exists and belongs to this household
    const arrival = await prisma.safeArrival.findUnique({
      where: { id },
    });

    if (!arrival || arrival.householdId !== household.id) {
      return NextResponse.json(
        { success: false, error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }

    // Build reason
    const lateMinutes = Math.floor(
      (Date.now() - arrival.expectedBefore.getTime()) / 60000
    );
    const reason = `Safe Arrival: ${arrival.memberName} non rentré(e) depuis ${lateMinutes} minutes`;

    // Trigger emergency call
    const result = await triggerHouseholdEmergency(household.id, reason);

    // Log the call
    await prisma.userLog.create({
      data: {
        householdId: household.id,
        action: "emergency_call_tablet",
        details: JSON.stringify({
          reason,
          success: result.success,
          callId: result.callId || null,
          safeArrivalId: id,
        }),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Impossible de lancer l'appel",
          configured: isRetellConfigured(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      callId: result.callId,
      reason,
    });
  } catch (error) {
    console.error("[Display SafeArrival] Call error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
