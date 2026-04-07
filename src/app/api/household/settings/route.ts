/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Household Settings API (V2)

   GET  → Retrieve identity / SEO / preferences settings
   PATCH → Update settings (owner or superadmin only)
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireRole } from "@/core/auth/guards";
import { updateHouseholdSettingsSchema } from "@/core/validations/schemas";

/* ── Type for the parsed settings response ── */
interface HouseholdSettings {
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  seoOgImage: string | null;
  timezone: string;
  isQuietMode: boolean;
}

/* ── Helpers ── */
function formatSettings(row: Record<string, unknown>): HouseholdSettings {
  return {
    contactPhone: (row.contactPhone as string) || null,
    contactEmail: (row.contactEmail as string) || null,
    contactAddress: (row.contactAddress as string) || null,
    seoTitle: (row.seoTitle as string) || null,
    seoDescription: (row.seoDescription as string) || null,
    seoKeywords: parseJson<string[]>(row.seoKeywords as string, []),
    seoOgImage: (row.seoOgImage as string) || null,
    timezone: (row.timezone as string) || "Europe/Paris",
    isQuietMode: (row.isQuietMode as boolean) || false,
  };
}

/* ═══════════════════════════════════════════════════════
   GET — Fetch current household settings
   ═══════════════════════════════════════════════════════ */
export async function GET() {
  try {
    const { householdId } = await requireRole("owner", "superadmin", "member");

    const household = await db.household.findUnique({
      where: { id: householdId! },
      select: {
        contactPhone: true,
        contactEmail: true,
        contactAddress: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        seoOgImage: true,
        timezone: true,
        isQuietMode: true,
        name: true,
        type: true,
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
      settings: formatSettings(household),
    });
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
    console.error("[SETTINGS] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PATCH — Update household settings (owner/superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function PATCH(request: NextRequest) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const parsed = updateHouseholdSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Build update data — only include fields that were provided
    const data: Record<string, unknown> = {};
    const p = parsed.data;

    // Identity fields (normalize empty strings to null)
    if (p.contactPhone !== undefined) data.contactPhone = p.contactPhone || null;
    if (p.contactEmail !== undefined) data.contactEmail = p.contactEmail || null;
    if (p.contactAddress !== undefined) data.contactAddress = p.contactAddress || null;

    // SEO fields
    if (p.seoTitle !== undefined) data.seoTitle = p.seoTitle || null;
    if (p.seoDescription !== undefined) data.seoDescription = p.seoDescription || null;
    if (p.seoKeywords !== undefined) data.seoKeywords = JSON.stringify(p.seoKeywords);
    if (p.seoOgImage !== undefined) data.seoOgImage = p.seoOgImage || null;

    // Preferences
    if (p.timezone !== undefined) data.timezone = p.timezone;
    if (p.isQuietMode !== undefined) data.isQuietMode = p.isQuietMode;

    // Skip if nothing to update
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: true, message: "Aucune modification" });
    }

    const updated = await db.household.update({
      where: { id: householdId! },
      data,
    });

    return NextResponse.json({
      success: true,
      settings: formatSettings(updated as unknown as Record<string, unknown>),
    });
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
    console.error("[SETTINGS] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
