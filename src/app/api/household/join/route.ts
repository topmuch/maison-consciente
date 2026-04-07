import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireAuth } from "@/core/auth/guards";
import { joinHouseholdSchema } from "@/core/validations/schemas";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    // Check user doesn't already have a household
    if (user.householdId) {
      return NextResponse.json(
        { success: false, error: "Vous appartenez déjà à un foyer" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = joinHouseholdSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { inviteCode } = parsed.data;

    // Search all households for matching invite code
    const households = await db.household.findMany({
      select: { id: true, settings: true },
    });

    let targetHouseholdId: string | null = null;

    for (const household of households) {
      try {
        const settings = JSON.parse(household.settings);
        if (settings.inviteCode === inviteCode) {
          targetHouseholdId = household.id;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!targetHouseholdId) {
      return NextResponse.json(
        { success: false, error: "Code d'invitation invalide" },
        { status: 404 }
      );
    }

    // Join household
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        householdId: targetHouseholdId,
        role: "member",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        householdId: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Join household error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
