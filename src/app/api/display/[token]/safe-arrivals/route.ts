import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   DISPLAY SAFE ARRIVALS API — Tablet Token-based

   GET /api/display/:token/safe-arrivals — List active arrivals
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const household = await prisma.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

    // Fetch all arrivals for the last 24 hours (active window)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const arrivals = await prisma.safeArrival.findMany({
      where: {
        householdId: household.id,
        createdAt: { gte: since },
      },
      orderBy: [{ isLate: "desc" }, { expectedBefore: "asc" }],
    });

    return NextResponse.json({ success: true, arrivals });
  } catch (error) {
    console.error("[Display SafeArrival] List error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
