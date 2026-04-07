import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";

export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Get zone IDs for this household
    const householdZones = await db.zone.findMany({
      where: { householdId: householdId! },
      select: { id: true },
    });
    const zoneIds = householdZones.map((z) => z.id);

    if (zoneIds.length === 0) {
      return NextResponse.json({
        success: true,
        interactions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const [interactions, total] = await Promise.all([
      db.interaction.findMany({
        where: { zoneId: { in: zoneIds } },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          zone: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.interaction.count({
        where: { zoneId: { in: zoneIds } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      interactions: interactions.map((i) => ({
        ...i,
        context: parseJson<Record<string, unknown>>(i.context, {}),
        response: parseJson<Record<string, unknown> | null>(i.response, null),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("List interactions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
