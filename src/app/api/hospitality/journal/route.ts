/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Hospitality Journal API
   CRUD for travel journal entries. Hospitality-only route.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireHouseholdType } from "@/core/auth/guards";

// GET — List journal entries (limit 10, ordered by createdAt desc)
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");

    const entries = await db.travelJournal.findMany({
      where: { householdId },
      orderBy: [{ createdAt: "desc" }],
      take: 10,
    });

    // Parse JSON fields for each entry
    const parsed = entries.map((entry) => ({
      ...entry,
      photos: JSON.parse(entry.photos),
    }));

    return NextResponse.json({ success: true, journal: parsed });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Journal GET error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Create a new journal entry
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const body = await request.json();
    const { title, content, photoUrls } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Titre requis" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Contenu requis" }, { status: 400 });
    }

    const entry = await db.travelJournal.create({
      data: {
        householdId,
        title: title.trim(),
        content: content.trim(),
        photos: Array.isArray(photoUrls) ? JSON.stringify(photoUrls) : "[]",
      },
    });

    return NextResponse.json({
      success: true,
      journal: {
        ...entry,
        photos: JSON.parse(entry.photos),
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN_TYPE") {
      return NextResponse.json({ success: false, error: "Accès réservé au mode hospitalité" }, { status: 403 });
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }
    console.error("[HOSPITALITY] Journal POST error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Delete a journal entry (query param id)
export async function DELETE(request: NextRequest) {
  try {
    const { householdId } = await requireHouseholdType("hospitality");
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requis" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.travelJournal.findFirst({
      where: { id, householdId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Entrée introuvable" }, { status: 404 });
    }

    await db.travelJournal.delete({
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
    console.error("[HOSPITALITY] Journal DELETE error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
