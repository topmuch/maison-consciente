import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   GET: List all users with pagination, search, role filter (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    await requireRole("superadmin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          householdId: true,
          createdAt: true,
          updatedAt: true,
          household: {
            select: { name: true },
          },
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        householdName: u.household?.name ?? "—",
        sessionCount: u._count.sessions,
      })),
      total,
      page,
      limit,
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
    console.error("Admin users error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PUT: Update user role or suspend (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function PUT(request: NextRequest) {
  try {
    const { session, householdId } = await requireRole("superadmin");
    const body = await request.json();
    const { userId, role, suspended } = body as {
      userId?: string;
      role?: string;
      suspended?: boolean;
    };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requis" },
        { status: 400 }
      );
    }

    // Fetch the target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, householdId: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Prevent changing superadmin role
    if (targetUser.role === "superadmin" && role && role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Impossible de modifier le rôle d'un superadmin" },
        { status: 403 }
      );
    }

    // Validate role if provided
    const validRoles = ["member", "owner", "superadmin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (role) updateData.role = role;

    if (suspended) {
      // Delete all sessions for the user (force logout)
      await db.session.deleteMany({ where: { userId } });
    }

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Log action
    await db.userLog.create({
      data: {
        userId: session.userId,
        householdId: householdId,
        action: "settings_update",
        details: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          ...(role ? { newRole: role } : {}),
          ...(suspended ? { suspended: true } : {}),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: suspended
        ? `Sessions réinitialisées pour ${targetUser.email}`
        : `Rôle mis à jour pour ${targetUser.email}`,
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
    console.error("Admin users PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   DELETE: Reset all sessions for a user (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function DELETE(request: NextRequest) {
  try {
    const { session, householdId } = await requireRole("superadmin");
    const body = await request.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requis" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Delete all sessions
    const deletedCount = await db.session.deleteMany({ where: { userId } });

    // Log action
    await db.userLog.create({
      data: {
        userId: session.userId,
        householdId: householdId,
        action: "settings_update",
        details: JSON.stringify({
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          sessionsDeleted: deletedCount.count,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deletedCount.count} session(s) réinitialisée(s) pour ${targetUser.email}`,
      deletedCount: deletedCount.count,
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
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
