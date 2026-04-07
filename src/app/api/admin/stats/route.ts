import { NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

// GET: Global stats (superadmin only)
export async function GET() {
  try {
    await requireRole("superadmin");

    const [totalHouseholds, totalUsers, totalZones, totalInteractions] = await Promise.all([
      db.household.count(),
      db.user.count(),
      db.zone.count(),
      db.interaction.count(),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalHouseholds,
        totalUsers,
        totalZones,
        totalInteractions,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
