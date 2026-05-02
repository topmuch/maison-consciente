import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   GEOFENCES API — List & Create

   GET  /api/geofences             — List geofences
   POST /api/geofences             — Create geofence
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// GET: List all geofences for the authenticated household
export async function GET() {
  try {
    const { householdId } = await getAuthUser();

    const fences = await prisma.geoFence.findMany({
      where: { householdId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, fences });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[GeoFences] List error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Create a new geofence
export async function POST(req: NextRequest) {
  try {
    const { householdId } = await getAuthUser();
    const body = await req.json();
    const {
      name,
      type,
      centerLat,
      centerLng,
      radiusMeters,
      address,
      color,
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
      address?: string;
      color?: string;
      notifyOnEntry?: boolean;
      notifyOnExit?: boolean;
      haSceneOnEntry?: string;
      haSceneOnExit?: string;
    };

    // Validations
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json(
        { success: false, error: "name est requis" },
        { status: 400 },
      );
    }

    if (centerLat == null || centerLng == null) {
      return NextResponse.json(
        { success: false, error: "centerLat et centerLng sont requis" },
        { status: 400 },
      );
    }

    if (centerLat < -90 || centerLat > 90 || centerLng < -180 || centerLng > 180) {
      return NextResponse.json(
        { success: false, error: "Coordonnées GPS invalides" },
        { status: 400 },
      );
    }

    const validTypes = ["home", "school", "work", "custom"];
    const fenceType = type && validTypes.includes(type) ? type : "custom";

    const radius = radiusMeters && radiusMeters >= 50 && radiusMeters <= 50000
      ? radiusMeters
      : 200;

    const fence = await prisma.geoFence.create({
      data: {
        householdId,
        name: name.trim(),
        type: fenceType,
        centerLat,
        centerLng,
        radiusMeters: radius,
        address: address || null,
        color: color || "#22c55e",
        notifyOnEntry: notifyOnEntry !== false,
        notifyOnExit: notifyOnExit === true,
        haSceneOnEntry: haSceneOnEntry || null,
        haSceneOnExit: haSceneOnExit || null,
      },
    });

    return NextResponse.json({ success: true, fence }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[GeoFences] Create error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
