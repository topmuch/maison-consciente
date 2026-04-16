import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   FAMILY MEMBERS API — Update & Delete

   PATCH   /api/family-members/:id  — Update member
   DELETE  /api/family-members/:id  — Delete member + logs (RGPD)
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// PATCH: Update a family member
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      role,
      avatarColor,
      consentGiven,
      isActive,
      expectedHomeBefore,
      autoDeleteDays,
    } = body as {
      name?: string;
      role?: string;
      avatarColor?: string;
      consentGiven?: boolean;
      isActive?: boolean;
      expectedHomeBefore?: string | null;
      autoDeleteDays?: number;
    };

    // Validate ownership
    const existing = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Membre non trouvé" },
        { status: 404 },
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined && typeof name === "string" && name.trim().length > 0) {
      updateData.name = name.trim();
    }
    if (role && ["Parent", "Child", "Elderly", "Other"].includes(role)) {
      updateData.role = role;
    }
    if (avatarColor) {
      updateData.avatarColor = avatarColor;
    }
    if (consentGiven !== undefined) {
      updateData.consentGiven = consentGiven;
      if (consentGiven) {
        updateData.consentGivenAt = new Date();
        updateData.consentRevokedAt = null;
      } else {
        updateData.consentRevokedAt = new Date();
        // Désactiver le tracking et effacer la position
        updateData.isActive = false;
        updateData.lastKnownLat = null;
        updateData.lastKnownLng = null;
        updateData.lastKnownAt = null;
        updateData.status = "offline";
      }
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      if (!isActive) {
        updateData.lastKnownLat = null;
        updateData.lastKnownLng = null;
        updateData.lastKnownAt = null;
        updateData.status = "offline";
      }
    }
    if (expectedHomeBefore !== undefined) {
      updateData.expectedHomeBefore = expectedHomeBefore ? new Date(expectedHomeBefore) : null;
    }
    if (autoDeleteDays !== undefined && autoDeleteDays >= 1 && autoDeleteDays <= 365) {
      updateData.autoDeleteDays = autoDeleteDays;
    }

    const member = await prisma.familyMember.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, member });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[FamilyMembers] Update error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE: Delete a family member and all associated location logs (RGPD right to be forgotten)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { householdId } = await getAuthUser();
    const { id } = await params;

    const existing = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!existing || existing.householdId !== householdId) {
      return NextResponse.json(
        { success: false, error: "Membre non trouvé" },
        { status: 404 },
      );
    }

    // Delete member + cascade deletes location logs
    await prisma.familyMember.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      deleted: id,
      message: `Membre "${existing.name}" et tous ses logs de localisation supprimés (RGPD)`,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[FamilyMembers] Delete error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
