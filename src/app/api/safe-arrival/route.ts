import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   SAFE ARRIVAL API — List & Create

   GET  /api/safe-arrival?status=pending  — List arrivals
   POST /api/safe-arrival                  — Create arrival
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// GET: List all safe arrival records for the authenticated household
export async function GET(req: NextRequest) {
  try {
    const { householdId } = await getAuthUser();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { householdId };
    if (status && ["pending", "arrived", "late", "emergency"].includes(status)) {
      where.status = status;
    }

    const arrivals = await prisma.safeArrival.findMany({
      where,
      orderBy: [{ isLate: "desc" }, { expectedBefore: "asc" }],
    });

    return NextResponse.json({ success: true, arrivals });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[SafeArrival] List error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Create a new safe arrival record
export async function POST(req: NextRequest) {
  try {
    const { householdId, user } = await getAuthUser();
    const body = await req.json();
    const { memberId, memberName, expectedBefore, notes } = body as {
      memberId?: string;
      memberName?: string;
      expectedBefore?: string;
      notes?: string;
    };

    if (!memberName || !expectedBefore) {
      return NextResponse.json(
        { success: false, error: "memberName et expectedBefore sont requis" },
        { status: 400 }
      );
    }

    const expectedDate = new Date(expectedBefore);
    if (isNaN(expectedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "expectedBefore doit être une date valide (ISO 8601)" },
        { status: 400 }
      );
    }

    const arrival = await prisma.safeArrival.create({
      data: {
        householdId,
        memberId: memberId || user.id,
        memberName,
        expectedBefore: expectedDate,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, arrival }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[SafeArrival] Create error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
