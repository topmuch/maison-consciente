import { NextResponse } from "next/server";
import { requireHousehold, sanitizeHouseholdSettings } from "@/core/auth/guards";
import { db, parseJson } from "@/core/db";

/* ═══════════════════════════════════════════════════════
   GET /api/household/config
   
   Returns lightweight household config (type, name, settings).
   Used by the client to decide which dashboard to render
   (home vs hospitality mode).
   ═══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const config = await db.household.findUnique({
      where: { id: householdId! },
      select: {
        id: true,
        name: true,
        type: true,
        settings: true,
      },
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        settings: sanitizeHouseholdSettings(
          parseJson<Record<string, unknown>>(config.settings, {})
        ),
      },
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
    console.error("Get household config error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
