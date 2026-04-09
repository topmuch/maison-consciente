import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   SAFE ARRIVAL API — Update & Delete

   PATCH   /api/safe-arrival/:id  — Update arrival status
   DELETE  /api/safe-arrival/:id  — Cancel arrival
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// PATCH: Update a safe arrival (mark arrived, acknowledge late, or set emergency)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();
    const { status, notes } = body as { status?: string; notes?: string };

    // Validate the arrival belongs to this household
    const existing = await prisma.safeArrival.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }

    const validStatuses = ["arrived", "late", "emergency"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `status doit être l'un de: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "arrived") {
        updateData.arrivedAt = new Date();
      }
      if (status === "late" || status === "emergency") {
        updateData.acknowledgedAt = new Date();
        updateData.isLate = true;
        if (status === "emergency" && !existing.isLate) {
          updateData.lateMinutes = Math.floor(
            (Date.now() - existing.expectedBefore.getTime()) / 60000
          );
        }
      }
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const arrival = await prisma.safeArrival.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, arrival });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[SafeArrival] Update error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Cancel a safe arrival record
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;

    // Validate the arrival belongs to this household
    const existing = await prisma.safeArrival.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Enregistrement introuvable" },
        { status: 404 }
      );
    }

    await prisma.safeArrival.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted: id });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[SafeArrival] Delete error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
