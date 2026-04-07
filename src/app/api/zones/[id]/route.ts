import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold, requireRole } from "@/core/auth/guards";
import { updateZoneSchema } from "@/core/validations/schemas";

// GET: Get zone with interaction count
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await requireHousehold();
    const { id } = await params;

    const zone = await db.zone.findFirst({
      where: { id, householdId: householdId! },
      include: {
        _count: {
          select: { interactions: true },
        },
        interactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!zone) {
      return NextResponse.json(
        { success: false, error: "Zone introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      zone: {
        ...zone,
        config: parseJson<Record<string, unknown>>(zone.config, {}),
        interactionCount: zone._count.interactions,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Get zone error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT: Update zone (owner or superadmin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");
    const { id } = await params;

    // Verify zone belongs to user's household
    const existingZone = await db.zone.findFirst({
      where: { id, householdId: householdId! },
    });

    if (!existingZone) {
      return NextResponse.json(
        { success: false, error: "Zone introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateZoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.icon !== undefined) updateData.icon = parsed.data.icon;
    if (parsed.data.color !== undefined) updateData.color = parsed.data.color;
    if (parsed.data.config !== undefined) updateData.config = JSON.stringify(parsed.data.config);

    const zone = await db.zone.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      zone: {
        ...zone,
        config: parseJson<Record<string, unknown>>(zone.config, {}),
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
    console.error("Update zone error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE: Delete zone (owner or superadmin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");
    const { id } = await params;

    const existingZone = await db.zone.findFirst({
      where: { id, householdId: householdId! },
    });

    if (!existingZone) {
      return NextResponse.json(
        { success: false, error: "Zone introuvable" },
        { status: 404 }
      );
    }

    await db.zone.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Zone supprimée" });
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
    console.error("Delete zone error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
