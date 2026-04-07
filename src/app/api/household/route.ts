import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold, requireRole, sanitizeHouseholdSettings } from "@/core/auth/guards";
import { updateHouseholdSchema } from "@/core/validations/schemas";
import crypto from "crypto";

// GET: Return household with member list and counts
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const household = await db.household.findUnique({
      where: { id: householdId! },
      include: {
        _count: {
          select: {
            users: true,
            zones: true,
            messages: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
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
      household: {
        ...household,
        settings: sanitizeHouseholdSettings(
          parseJson<Record<string, unknown>>(household.settings, {})
        ),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Get household error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT: Update household name/settings (owner or superadmin only)
export async function PUT(request: NextRequest) {
  try {
    const { user, householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const parsed = updateHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.settings !== undefined) {
      // Merge with existing settings
      const current = await db.household.findUnique({ where: { id: householdId! } });
      const currentSettings = current ? parseJson<Record<string, unknown>>(current.settings, {}) : {};
      const merged = { ...currentSettings, ...parsed.data.settings };
      updateData.settings = JSON.stringify(merged);
    }

    const household = await db.household.update({
      where: { id: householdId! },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      household: {
        ...household,
        settings: sanitizeHouseholdSettings(
          parseJson<Record<string, unknown>>(household.settings, {})
        ),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Update household error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Generate invite code (owner or superadmin only)
export async function POST() {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const household = await db.household.findUnique({
      where: { id: householdId! },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    const settings = parseJson<Record<string, unknown>>(household.settings, {});
    settings.inviteCode = inviteCode;

    await db.household.update({
      where: { id: householdId! },
      data: { settings: JSON.stringify(settings) },
    });

    return NextResponse.json({ success: true, inviteCode }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Generate invite code error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
