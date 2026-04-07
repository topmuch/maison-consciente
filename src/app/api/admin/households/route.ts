import { NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireRole, sanitizeHouseholdSettings } from "@/core/auth/guards";

// GET: List all households (superadmin only)
export async function GET() {
  try {
    await requireRole("superadmin");

    const households = await db.household.findMany({
      include: {
        _count: {
          select: {
            users: true,
            zones: true,
            messages: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      households: households.map((h) => {
        const settings = parseJson<Record<string, unknown>>(h.settings, {});
        return {
          ...h,
          settings: sanitizeHouseholdSettings(settings),
        };
      }),
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
    console.error("Admin households error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
