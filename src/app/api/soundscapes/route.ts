import { NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireAuth } from "@/core/auth/guards";

// GET: List soundscapes (global + household-specific)
export async function GET() {
  try {
    const { user } = await requireAuth();

    const soundscapes = await db.soundscape.findMany({
      where: {
        isActive: true,
        OR: [
          { householdId: null },
          { householdId: user.householdId },
        ],
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      soundscapes,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("List soundscapes error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
