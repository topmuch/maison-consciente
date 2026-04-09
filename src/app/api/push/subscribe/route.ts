import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   PUSH SUBSCRIPTION API

   POST   /api/push/subscribe  — Register OneSignal player ID
   DELETE /api/push/subscribe  — Remove player ID
   GET    /api/push/subscribe  — Get current subscription status

   Stores the OneSignal player ID in Household.notificationPrefs.
   ═══════════════════════════════════════════════════════ */

// POST: Register player ID
export async function POST(req: NextRequest) {
  try {
    const authData = await getAuthUser();
    const body = await req.json();
    const { playerId } = body as { playerId?: string };

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json(
        { success: false, error: "Player ID manquant" },
        { status: 400 }
      );
    }

    // Get current notification prefs
    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: { notificationPrefs: true },
    });

    const currentPrefs = household?.notificationPrefs as Record<string, unknown> | null || {};

    // Update with OneSignal data
    await prisma.household.update({
      where: { id: authData.householdId },
      data: {
        notificationPrefs: {
          ...currentPrefs,
          pushEnabled: true,
          onesignalPlayerId: playerId,
          subscribedAt: new Date().toISOString(),
          subscribedBy: authData.user.id,
        },
      },
    });

    return NextResponse.json({ success: true, playerId });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Push Subscribe]", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Unsubscribe
export async function DELETE() {
  try {
    const authData = await getAuthUser();

    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: { notificationPrefs: true },
    });

    const currentPrefs = household?.notificationPrefs as Record<string, unknown> | null || {};

    await prisma.household.update({
      where: { id: authData.householdId },
      data: {
        notificationPrefs: {
          ...currentPrefs,
          pushEnabled: false,
          onesignalPlayerId: null,
          subscribedAt: null,
          subscribedBy: null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Push Unsubscribe]", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// GET: Check subscription status
export async function GET() {
  try {
    const authData = await getAuthUser();

    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: { notificationPrefs: true },
    });

    const prefs = household?.notificationPrefs as Record<string, unknown> | null || {};

    return NextResponse.json({
      success: true,
      isSubscribed: prefs.pushEnabled === true,
      playerId: prefs.onesignalPlayerId || null,
      subscribedAt: prefs.subscribedAt || null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[Push Status]", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
