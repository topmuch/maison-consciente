/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Guest Access API
   CRUD for GuestAccess tokens. Hospitality-only route.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";
import { createGuestAccessSchema, updateGuestAccessSchema } from "@/core/validations/schemas";

// GET — List guest access tokens
export async function GET() {
  try {
    const { householdId } = await requireHouseholdType("hospitality");

    const accesses = await db.guestAccess.findMany({
      where: { householdId },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, accesses });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] GuestAccess GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Create a guest access token
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const parsed = createGuestAccessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Generate a secure random token
    const token = crypto.randomBytes(16).toString("hex");

    const access = await db.guestAccess.create({
      data: {
        ...parsed.data,
        token,
        householdId,
      },
    });

    return NextResponse.json({ success: true, access }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] GuestAccess POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Revoke a guest access
export async function DELETE(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    const existing = await db.guestAccess.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Accès introuvable" }, { status: 404 });
    }

    await db.guestAccess.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] GuestAccess DELETE error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
