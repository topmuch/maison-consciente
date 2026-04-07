/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Guide API
   CRUD for Points of Interest. Hospitality-only route.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";
import { createPOISchema, updatePOISchema } from "@/core/validations/schemas";

// GET — List POIs for this household
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {
      householdId,
      isActive: true,
    };
    if (category) {
      where.category = category;
    }

    const pois = await db.pointOfInterest.findMany({
      where,
      orderBy: [{ distanceMin: "asc" }],
    });

    return NextResponse.json({ success: true, pois });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Guide GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Create a new POI
export async function POST(request: NextRequest) {
  try {
    const { householdId, user } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const parsed = createPOISchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const poi = await db.pointOfInterest.create({
      data: {
        ...parsed.data,
        householdId,
      },
    });

    return NextResponse.json({ success: true, poi }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Guide POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Update a POI
export async function PATCH(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    const parsed = updatePOISchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.pointOfInterest.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "POI introuvable" }, { status: 404 });
    }

    const poi = await db.pointOfInterest.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, poi });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Guide PATCH error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Soft-delete a POI (set isActive=false)
export async function DELETE(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    const existing = await db.pointOfInterest.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "POI introuvable" }, { status: 404 });
    }

    await db.pointOfInterest.update({
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
    console.error("[HOSPITALITY] Guide DELETE error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
