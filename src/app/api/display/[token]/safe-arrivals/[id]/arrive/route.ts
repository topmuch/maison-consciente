import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   DISPLAY SAFE ARRIVAL ARRIVE — Tablet Mark as Arrived

   POST /api/display/:token/safe-arrivals/:id/arrive
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;

    // Validate display token
    const household = await prisma.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 403 }
      );
    }

    // Validate the arrival exists and belongs to this household
    const arrival = await prisma.safeArrival.findUnique({
      where: { id },
    });

    if (!arrival || arrival.householdId !== household.id) {
      return NextResponse.json(
        { success: false, error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }

    if (arrival.status === "arrived") {
      return NextResponse.json({ success: true, arrival });
    }

    const updated = await prisma.safeArrival.update({
      where: { id },
      data: {
        status: "arrived",
        arrivedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, arrival: updated });
  } catch (error) {
    console.error("[Display SafeArrival] Arrive error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
