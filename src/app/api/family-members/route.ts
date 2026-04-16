import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/* ═══════════════════════════════════════════════════════
   FAMILY MEMBERS API — List & Create

   GET  /api/family-members             — List members
   POST /api/family-members             — Create member
   ═══════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

// GET: List all family members for the authenticated household
export async function GET() {
  try {
    const { householdId } = await getAuthUser();

    const members = await prisma.familyMember.findMany({
      where: { householdId },
      select: {
        id: true,
        name: true,
        role: true,
        avatarColor: true,
        consentGiven: true,
        consentGivenAt: true,
        isActive: true,
        lastKnownLat: true,
        lastKnownLng: true,
        lastKnownAt: true,
        lastKnownAccuracy: true,
        currentGeoFenceId: true,
        status: true,
        batteryLevel: true,
        expectedHomeBefore: true,
        autoDeleteDays: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        // trackingToken is intentionally EXCLUDED from list for security
        locationLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { locationLogs: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, members });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[FamilyMembers] List error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Create a new family member
export async function POST(req: NextRequest) {
  try {
    const { householdId, user } = await getAuthUser();
    const body = await req.json();
    const {
      name,
      role,
      avatarColor,
      userId: linkedUserId,
      consentGiven,
      expectedHomeBefore,
      autoDeleteDays,
    } = body as {
      name?: string;
      role?: string;
      avatarColor?: string;
      userId?: string;
      consentGiven?: boolean;
      expectedHomeBefore?: string;
      autoDeleteDays?: number;
    };

    if (!name || typeof name !== "string" || name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: "name est requis (1-100 caractères)" },
        { status: 400 },
      );
    }

    const validRoles = ["Parent", "Child", "Elderly", "Other"];
    const memberRole = role && validRoles.includes(role) ? role : "Parent";

    // Validate avatarColor is hex format
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    const safeAvatarColor = avatarColor && hexColorRegex.test(avatarColor) ? avatarColor : "#d4a853";

    // Validate linkedUserId belongs to the same household (IDOR prevention)
    if (linkedUserId) {
      const linkedUser = await prisma.user.findFirst({
        where: { id: linkedUserId, householdId },
        select: { id: true },
      });
      if (!linkedUser) {
        return NextResponse.json(
          { success: false, error: "userId n'appartient pas à ce foyer" },
          { status: 400 },
        );
      }
    }

    // Validate autoDeleteDays
    const safeAutoDelete = typeof autoDeleteDays === "number" && autoDeleteDays >= 1 && autoDeleteDays <= 365
      ? autoDeleteDays : 7;

    // Generate a unique tracking token
    const trackingToken = randomUUID();

    const member = await prisma.familyMember.create({
      data: {
        householdId,
        name: name.trim(),
        role: memberRole,
        avatarColor: safeAvatarColor,
        trackingToken,
        consentGiven: consentGiven === true,
        consentGivenAt: consentGiven === true ? new Date() : null,
        userId: linkedUserId || null,
        expectedHomeBefore: expectedHomeBefore ? new Date(expectedHomeBefore) : null,
        autoDeleteDays: safeAutoDelete,
      },
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }
    console.error("[FamilyMembers] Create error:", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}
