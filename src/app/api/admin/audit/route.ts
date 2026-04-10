import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireAuth } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   GET /api/admin/audit — Paginated security audit logs
   Supports: filtering, pagination, CSV export
   Auth: superadmin only
   ═══════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth();

    if (user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Pagination
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(200, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));

    // Filters
    const action = searchParams.get("action") || "";
    const status = searchParams.get("status") || "";
    const userId = searchParams.get("userId") || "";
    const country = searchParams.get("country") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Export mode
    const exportMode = searchParams.get("export") || "";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (country) {
      where.country = country;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) dateFilter.gte = d;
      }
      if (endDate) {
        const d = new Date(endDate);
        // Include the full end day
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          dateFilter.lte = d;
        }
      }
      where.createdAt = dateFilter;
    }

    const includeUser = {
      user: {
        select: { name: true, email: true, role: true },
      },
    };

    // ── CSV Export ──
    if (exportMode === "csv") {
      const logs = await db.userLog.findMany({
        where,
        include: includeUser,
        orderBy: { createdAt: "desc" },
        take: 10000, // Safety cap for export
      });

      const csvHeader = [
        "Date",
        "User Name",
        "User Email",
        "User Role",
        "Action",
        "Status",
        "Details",
        "IP",
        "Country",
        "City",
        "User-Agent",
      ].join(",");

      const csvRows = logs.map((log) => {
        const esc = (v: string | null | undefined) => {
          if (!v) return '""';
          const escaped = v.replace(/"/g, '""');
          return `"${escaped}"`;
        };
        return [
          esc(new Date(log.createdAt).toISOString()),
          esc(log.user?.name),
          esc(log.user?.email),
          esc(log.user?.role),
          esc(log.action),
          esc(log.status),
          esc(log.details),
          esc(log.ip),
          esc(log.country),
          esc(log.city),
          esc(log.userAgent),
        ].join(",");
      });

      const csv = [csvHeader, ...csvRows].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // ── Paginated JSON ──
    const [logs, total] = await Promise.all([
      db.userLog.findMany({
        where,
        include: includeUser,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.userLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      logs: logs.map((log) => ({
        id: log.id,
        userId: log.userId,
        action: log.action,
        details: log.details,
        ip: log.ip,
        country: log.country,
        city: log.city,
        userAgent: log.userAgent,
        status: log.status,
        createdAt: log.createdAt.toISOString(),
        user: log.user
          ? {
              name: log.user.name,
              email: log.user.email,
              role: log.user.role,
            }
          : null,
      })),
      total,
      page,
      totalPages,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Admin audit error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
