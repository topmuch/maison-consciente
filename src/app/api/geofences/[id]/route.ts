import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   GEOFENCES API — Update & Delete

   PATCH   /api/geofences/:id  — Update geofence
   DELETE  /api/geofences/:id  — Delete geofence
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// PATCH: Update a geofence
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      type,
      centerLat,
      centerLng,
      radiusMeters,
      address,
      color,
      isActive,
      notifyOnEntry,
      notifyOnExit,
      haSceneOnEntry,
      haSceneOnExit,
    } = body as {
      name?: string;
      type?: string;
      centerLat?: number;
      centerLng?: number;
      radiusMeters?: number;
      address?: string | null;
      color?: string;
      isActive?: boolean;
      notifyOnEntry?: boolean;
      notifyOnExit?: boolean;
      haSceneOnEntry?: string | null;
      haSceneOnExit?: string | null;
    };

    // Validate ownership
    const existing = await prisma.geoFence.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Zone non trouvée" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }
    if (type && ["home", "school", "work", "custom"].includes(type)) {
      updateData.type = type;
    }
    if (centerLat != null) updateData.centerLat = centerLat;
    if (centerLng != null) updateData.centerLng = centerLng;
    if (radiusMeters != null && radiusMeters >= 50 && radiusMeters <= 50000) {
      updateData.radiusMeters = radiusMeters;
    }
    if (address !== undefined) updateData.address = address;
    if (color) updateData.color = color;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notifyOnEntry !== undefined) updateData.notifyOnEntry = notifyOnEntry;
    if (notifyOnExit !== undefined) updateData.notifyOnExit = notifyOnExit;
    if (haSceneOnEntry !== undefined) updateData.haSceneOnEntry = haSceneOnEntry;
    if (haSceneOnExit !== undefined) updateData.haSceneOnExit = haSceneOnExit;

    const fence = await prisma.geoFence.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, fence });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[GeoFences] Update error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Delete a geofence
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;

    const existing = await prisma.geoFence.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Zone non trouvée" },
        { status: 404 },
      );
    }

    // Clear any member references to this fence
    await prisma.familyMember.updateMany({
      where: { currentGeoFenceId: id },
      data: { currentGeoFenceId: null },
    });

    await prisma.geoFence.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: id,
      message: `Zone "${existing.name}" supprimée`,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[GeoFences] Delete error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
