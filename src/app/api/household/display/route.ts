/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Household Display API

   GET   → Retrieve display settings (displayEnabled, displayToken, displayConfig)
   PUT   → Update display settings (owner or superadmin only)
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole, requireHousehold } from "@/core/auth/guards";
import crypto from "crypto";

/* ═══════════════════════════════════════════════════════
   GET — Fetch current display settings
   ═══════════════════════════════════════════════════════ */
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const household = await db.household.findUnique({
      where: { id: householdId! },
      select: {
        displayEnabled: true,
        displayToken: true,
        displayConfig: true,
      },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      displayEnabled: household.displayEnabled,
      displayToken: household.displayToken,
      displayConfig: JSON.parse(household.displayConfig || "{}"),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("[Household Display] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PUT — Update display settings (owner or superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function PUT(request: NextRequest) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const {
      displayEnabled,
      displayToken,
      displayConfig,
    }: {
      displayEnabled?: boolean;
      displayToken?: string | null;
      displayConfig?: Record<string, unknown>;
    } = body;

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};

    if (displayEnabled !== undefined) {
      updateData.displayEnabled = displayEnabled;

      // If enabling and no token exists, generate one
      if (displayEnabled && !displayToken) {
        const current = await db.household.findUnique({
          where: { id: householdId! },
          select: { displayToken: true },
        });
        if (!current?.displayToken) {
          updateData.displayToken = crypto.randomUUID();
        }
      }
    }

    if (displayToken !== undefined) {
      updateData.displayToken = displayToken;
    }

    if (displayConfig !== undefined) {
      updateData.displayConfig = JSON.stringify(displayConfig);
    }

    // Skip if nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: "Aucune modification" });
    }

    await db.household.update({
      where: { id: householdId! },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux propriétaires" },
        { status: 403 }
      );
    }
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("[Household Display] PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
