import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   GET: List user logs with filters (superadmin only)
   ═══════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  try {
    await requireRole("superadmin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const action = searchParams.get("action") || "";
    const householdId = searchParams.get("householdId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (householdId) {
      where.householdId = householdId;
    }

    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) {
        dateFilter.gte = new Date(from);
      }
      if (to) {
        dateFilter.lte = new Date(to);
      }
      where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      db.userLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          household: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ip: log.ip,
        createdAt: log.createdAt.toISOString(),
        user: log.user
          ? { id: log.user.id, email: log.user.email, name: log.user.name }
          : null,
        householdName: log.household?.name ?? "—",
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
    console.error("Admin logs error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
