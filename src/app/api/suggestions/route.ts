import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/core/auth/guards";
import { generateSuggestion } from "@/core/conscious-engine";
import type { InteractionContext } from "@/core/types";

// GET: Generate suggestion for a given zone
export async function GET(request: NextRequest) {
  try {
    const { householdId } = await requireHousehold();

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");

    if (!zoneId) {
      return NextResponse.json(
        { success: false, error: "Paramètre zoneId requis" },
        { status: 400 }
      );
    }

    const now = new Date();
    const weekdays = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

    const context: InteractionContext = {
      hour: now.getHours(),
      weekday: weekdays[now.getDay()],
    };

    const suggestion = await generateSuggestion(zoneId, context);

    return NextResponse.json({ success: true, suggestion });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Get suggestions error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
