import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

// GET: List/search clients (households) with pagination and filtering (superadmin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole("superadmin");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const type = searchParams.get("type") || "";
    const subscriptionPlan = searchParams.get("subscriptionPlan") || "";
    const subscriptionStatus = searchParams.get("subscriptionStatus") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactEmail: { contains: search } },
        { users: { some: { email: { contains: search } } } },
      ];
    }

    if (type && ["home", "hospitality"].includes(type)) {
      where.type = type;
    }

    if (
      subscriptionPlan &&
      ["free", "starter", "comfort", "prestige", "pro"].includes(subscriptionPlan)
    ) {
      where.subscriptionPlan = subscriptionPlan;
    }

    if (
      subscriptionStatus &&
      ["active", "trialing", "past_due", "canceled", "inactive"].includes(subscriptionStatus)
    ) {
      where.subscriptionStatus = subscriptionStatus;
    }

    // Validate sort fields
    const allowedSortFields = ["createdAt", "name", "subscriptionPlan", "subscriptionStatus"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

    const [clients, total] = await Promise.all([
      db.household.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          contactEmail: true,
          contactPhone: true,
          contactAddress: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              zones: true,
            },
          },
          userLogs: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { [safeSortBy]: safeSortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.household.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subscriptionPlan: c.subscriptionPlan,
        subscriptionStatus: c.subscriptionStatus,
        subscriptionEndsAt: c.subscriptionEndsAt?.toISOString() ?? null,
        contactEmail: c.contactEmail,
        contactPhone: c.contactPhone,
        contactAddress: c.contactAddress,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        memberCount: c._count.users,
        zoneCount: c._count.zones,
        lastActivity: c.userLogs[0]?.createdAt.toISOString() ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
    console.error("Admin clients error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
