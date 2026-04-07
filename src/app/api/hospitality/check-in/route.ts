/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Check-In API
   CRUD for check-in/check-out states. Hospitality-only route.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";

// GET — List check-in states (optional status filter, limit 20)
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { householdId };
    if (status) {
      where.status = status;
    }

    const checkIns = await db.checkInState.findMany({
      where,
      orderBy: [{ checkInAt: "desc" }],
      take: 20,
    });

    return NextResponse.json({ success: true, checkIns });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] CheckIn GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Create a new check-in
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { guestName, notes } = body;

    if (!guestName || typeof guestName !== "string" || guestName.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Nom de l'invité requis" }, { status: 400 });
    }

    const checkIn = await db.checkInState.create({
      data: {
        householdId,
        guestName: guestName.trim(),
        notes: notes || null,
        status: "checked-in",
      },
    });

    return NextResponse.json({ success: true, checkIn }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] CheckIn POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Check-out a guest (sets status="checked-out", checkOutAt=now)
export async function PATCH(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.checkInState.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Enregistrement introuvable" }, { status: 404 });
    }

    if (existing.status === "checked-out") {
      return NextResponse.json({ success: false, error: "L'invité est déjà parti" }, { status: 400 });
    }

    const checkIn = await db.checkInState.update({
      where: { id },
      data: {
        status: "checked-out",
        checkOutAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] CheckIn PATCH error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Remove a check-in record
export async function DELETE(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.checkInState.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Enregistrement introuvable" }, { status: 404 });
    }

    await db.checkInState.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] CheckIn DELETE error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
