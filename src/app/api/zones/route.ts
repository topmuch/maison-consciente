import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold, requireRole } from "@/core/auth/guards";
import { createZoneSchema } from "@/core/validations/schemas";
import crypto from "crypto";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET: List zones for household
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const zones = await db.zone.findMany({
      where: { householdId: householdId! },
      include: {
        _count: {
          select: { interactions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      zones: zones.map((zone) => ({
        ...zone,
        config: parseJson<Record<string, unknown>>(zone.config, {}),
        interactionCount: zone._count.interactions,
      })),
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("List zones error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Create zone (owner or superadmin only)
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const parsed = createZoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, icon, color, config } = parsed.data;

    // Generate unique QR slug
    const shortId = crypto.randomUUID().slice(0, 8);
    const slug = slugify(name);
    const qrCode = `${shortId}-${slug}`;

    const zone = await db.zone.create({
      data: {
        householdId: householdId!,
        name,
        icon: icon || "home",
        color: color || "#d4a853",
        qrCode,
        config: config ? JSON.stringify(config) : "{}",
      },
    });

    return NextResponse.json(
      {
        success: true,
        zone: {
          ...zone,
          config: parseJson<Record<string, unknown>>(zone.config, {}),
        },
      },
      { status: 201 }
    );
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
    console.error("Create zone error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
