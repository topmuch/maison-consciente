import { NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

// GET: Comprehensive global stats (superadmin only)
export async function GET() {
  try {
    await requireRole("superadmin");

    const now = new Date();

    // ── Core counts ──
    const [
      totalHouseholds,
      totalUsers,
      totalZones,
      totalInteractions,
      totalInvoices,
      paidInvoices,
      pastDueInvoices,
      activeSubscriptions,
    ] = await Promise.all([
      db.household.count(),
      db.user.count(),
      db.zone.count(),
      db.interaction.count(),
      db.invoice.count(),
      db.invoice.count({ where: { status: "paid" } }),
      db.invoice.count({ where: { status: "past_due" } }),
      db.household.count({
        where: { subscriptionStatus: { in: ["active", "trialing"] } },
      }),
    ]);

    // ── Total revenue (paid invoices) ──
    const revenueResult = await db.invoice.aggregate({
      _sum: { amountCents: true },
      where: { status: "paid" },
    });
    const totalRevenueCents = revenueResult._sum.amountCents ?? 0;

    // ── Subscription breakdown (count per plan) ──
    const subscriptionBreakdownRaw = await db.household.groupBy({
      by: ["subscriptionPlan"],
      _count: { id: true },
    });
    const subscriptionBreakdown: Record<string, number> = {
      free: 0,
      starter: 0,
      comfort: 0,
      prestige: 0,
      pro: 0,
    };
    for (const row of subscriptionBreakdownRaw) {
      subscriptionBreakdown[row.subscriptionPlan] = row._count.id;
    }

    // ── Recent activity (last 10 UserLog entries) ──
    const recentActivity = await db.userLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatar: true },
        },
        household: {
          select: { id: true, name: true },
        },
      },
    });

    // ── Monthly growth (last 6 months of new households) ──
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const householdsCreated = await db.household.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const monthlyGrowth: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthStart.toLocaleDateString("fr-FR", {
        year: "2-digit",
        month: "short",
      });
      const count = householdsCreated.filter(
        (h) => h.createdAt >= monthStart && h.createdAt < monthEnd
      ).length;
      monthlyGrowth.push({ month: monthLabel, count });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalHouseholds,
        totalUsers,
        totalZones,
        totalInteractions,
        totalInvoices,
        paidInvoices,
        pastDueInvoices,
        totalRevenueCents,
        activeSubscriptions,
        subscriptionBreakdown,
        recentActivity: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          details: log.details,
          status: log.status,
          ip: log.ip,
          country: log.country,
          createdAt: log.createdAt.toISOString(),
          user: log.user
            ? { id: log.user.id, email: log.user.email, name: log.user.name, avatar: log.user.avatar }
            : null,
          household: log.household
            ? { id: log.household.id, name: log.household.name }
            : null,
        })),
        monthlyGrowth,
      },
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
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
