import { NextRequest, NextResponse } from "next/server";
import { db } from "@/core/db";
import { requireRole } from "@/core/auth/guards";

/* ═══════════════════════════════════════════════════════
   Plan definitions (hardcoded — source of truth)
   ═══════════════════════════════════════════════════════ */
interface PlanDefinition {
  slug: string;
  name: string;
  price: number; // in cents (EUR)
  features: string[];
  description: string;
}

const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    slug: "free",
    name: "Gratuit",
    price: 0,
    features: [
      "1 foyer",
      "2 utilisateurs",
      "3 zones QR",
    ],
    description: "Découverte de la Maison Consciente",
  },
  {
    slug: "starter",
    name: "Starter",
    price: 1900,
    features: [
      "1 foyer",
      "5 utilisateurs",
      "10 zones QR",
      "Assistance email",
    ],
    description: "Idéal pour les petits foyers",
  },
  {
    slug: "comfort",
    name: "Confort",
    price: 4900,
    features: [
      "1 foyer",
      "Utilisateurs illimités",
      "Zones illimitées",
      "Assistance prioritaire",
      "IA vocale",
      "Tablette affichage",
    ],
    description: "L'expérience complète pour votre foyer",
  },
  {
    slug: "prestige",
    name: "Prestige",
    price: 9900,
    features: [
      "Foyers multiples",
      "Tout illimité",
      "Conciergerie IA",
      "API complète",
      "Support dédié",
      "Modules hospitalité",
    ],
    description: "Pour les professionnels de l'hospitalité",
  },
];

// Helper to get the full plan info with slug
function getPlanDef(slug: string): PlanDefinition | undefined {
  return PLAN_DEFINITIONS.find((p) => p.slug === slug);
}

/* ═══════════════════════════════════════════════════════
   GET: List all subscription plans with real counts
   ═══════════════════════════════════════════════════════ */
export async function GET() {
  try {
    await requireRole("superadmin");

    // Count households per plan and status
    const planGroups = await db.household.groupBy({
      by: ["subscriptionPlan", "subscriptionStatus"],
      _count: { id: true },
    });

    // Build counts per plan
    const planCounts: Record<string, { total: number; active: number; trialing: number; past_due: number; canceled: number; inactive: number }> = {
      free: { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0, inactive: 0 },
      starter: { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0, inactive: 0 },
      comfort: { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0, inactive: 0 },
      prestige: { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0, inactive: 0 },
      pro: { total: 0, active: 0, trialing: 0, past_due: 0, canceled: 0, inactive: 0 },
    };

    for (const group of planGroups) {
      const plan = planCounts[group.subscriptionPlan];
      if (plan) {
        plan.total += group._count.id;
        const status = group.subscriptionStatus as keyof typeof plan;
        if (status in plan) {
          (plan[status] as number) += group._count.id;
        }
      }
    }

    const plans = PLAN_DEFINITIONS.map((def) => {
      const counts = planCounts[def.slug] ?? planCounts.free;
      return {
        ...def,
        priceFormatted: def.price === 0
          ? "Gratuit"
          : `${(def.price / 100).toFixed(2)} €/mois`,
        counts,
      };
    });

    return NextResponse.json({
      success: true,
      plans,
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
    console.error("Admin subscriptions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════
   PUT: Update a household's subscription
   ═══════════════════════════════════════════════════════ */
export async function PUT(request: NextRequest) {
  try {
    const { session, householdId: adminHouseholdId } = await requireRole("superadmin");
    const body = await request.json();
    const { householdId, plan, action, months } = body as {
      householdId?: string;
      plan?: string;
      action?: "upgrade" | "downgrade" | "cancel" | "extend";
      months?: number;
    };

    if (!householdId || !plan || !action) {
      return NextResponse.json(
        { success: false, error: "householdId, plan et action sont requis" },
        { status: 400 }
      );
    }

    const validPlans = PLAN_DEFINITIONS.map((p) => p.slug);
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { success: false, error: `Plan invalide. Plans disponibles : ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    const validActions = ["upgrade", "downgrade", "cancel", "extend"] as const;
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Action invalide. Actions disponibles : ${validActions.join(", ")}` },
        { status: 400 }
      );
    }

    // Find the household
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!household) {
      return NextResponse.json(
        { success: false, error: "Foyer introuvable" },
        { status: 404 }
      );
    }

    // Plan ordering for upgrade/downgrade validation
    const planOrder = ["free", "starter", "comfort", "prestige"];
    const currentIdx = planOrder.indexOf(household.subscriptionPlan);
    const newIdx = planOrder.indexOf(plan);

    // Build update data
    const updateData: Record<string, unknown> = {};
    let logAction = "subscription_change";
    let logDetails: Record<string, unknown> = {};

    switch (action) {
      case "upgrade":
      case "downgrade": {
        // Validate direction
        if (action === "upgrade" && newIdx <= currentIdx) {
          return NextResponse.json(
            { success: false, error: `Impossible de faire un upgrade vers ${plan} (même niveau ou inférieur)` },
            { status: 400 }
          );
        }
        if (action === "downgrade" && newIdx >= currentIdx) {
          return NextResponse.json(
            { success: false, error: `Impossible de faire un downgrade vers ${plan} (même niveau ou supérieur)` },
            { status: 400 }
          );
        }

        const newPlan = getPlanDef(plan)!;
        updateData.subscriptionPlan = plan;
        updateData.subscriptionStatus = "active";

        // Set subscription end date (1 month from now)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        updateData.subscriptionEndsAt = endDate;

        logDetails = {
          type: action,
          fromPlan: household.subscriptionPlan,
          toPlan: plan,
          newPlanName: newPlan.name,
          newPrice: newPlan.price,
          householdName: household.name,
          householdId: household.id,
        };
        break;
      }

      case "cancel": {
        updateData.subscriptionStatus = "canceled";
        updateData.subscriptionPlan = "free";

        logDetails = {
          type: "cancel",
          fromPlan: household.subscriptionPlan,
          householdName: household.name,
          householdId: household.id,
        };
        break;
      }

      case "extend": {
        const extendMonths = months && months > 0 ? Math.min(months, 24) : 1;
        const currentEnd = household.subscriptionEndsAt ?? new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + extendMonths);

        updateData.subscriptionEndsAt = newEnd;
        updateData.subscriptionStatus = "active";

        logDetails = {
          type: "extend",
          months: extendMonths,
          previousEnd: currentEnd.toISOString(),
          newEnd: newEnd.toISOString(),
          householdName: household.name,
          householdId: household.id,
        };
        break;
      }
    }

    // Apply update
    const updated = await db.household.update({
      where: { id: householdId },
      data: updateData,
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    // Audit log
    await db.userLog.create({
      data: {
        userId: session.userId,
        householdId: adminHouseholdId,
        action: logAction,
        details: JSON.stringify(logDetails),
      },
    });

    return NextResponse.json({
      success: true,
      household: {
        id: updated.id,
        name: updated.name,
        subscriptionPlan: updated.subscriptionPlan,
        subscriptionStatus: updated.subscriptionStatus,
        subscriptionEndsAt: updated.subscriptionEndsAt?.toISOString() ?? null,
      },
      message: `Abonnement ${action === "upgrade" ? "mis à niveau" : action === "downgrade" ? "rétrogradé" : action === "cancel" ? "annulé" : "prolongé"} avec succès`,
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
    console.error("Admin subscriptions PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
