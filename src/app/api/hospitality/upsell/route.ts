/* ═══════════════════════════════════════════════════════
   MAELLIS — Auto Upsell Intelligent API

   POST /api/hospitality/upsell
   Triggers the upsell service presentation to a guest
   2 hours after check-in. Uses the household's paid
   partner services to generate a personalised script.
   ═══════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

/* ── Types ── */

interface UpsellServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  icon: string;
}

interface UpsellRequestBody {
  householdId: string;
  checkInStateId: string;
}

interface ModuleEntry {
  active?: boolean;
  status?: string;
  [key: string]: unknown;
}

interface ModulesConfig {
  [moduleId: string]: ModuleEntry;
}

/* ═══════════════════════════════════════════════════════
   Helper: checkModuleActive
   Parses the household's modulesConfig JSON and checks
   if the given module ID exists and is active.
   ═══════════════════════════════════════════════════════ */

function checkModuleActive(
  modulesConfig: unknown,
  moduleId: string
): boolean {
  if (!modulesConfig || typeof modulesConfig !== "object") {
    return false;
  }

  const config = modulesConfig as ModulesConfig;
  const mod = config[moduleId];

  if (!mod || typeof mod !== "object") {
    return false;
  }

  return mod.active === true;
}

/* ═══════════════════════════════════════════════════════
   Helper: generateUpsellScript
   Produces a mock upsell script personalised with the
   guest name and available services. In production,
   this would call Gemini via ai-core.ts.
   ═══════════════════════════════════════════════════════ */

function generateUpsellScript(
  guestName: string,
  services: UpsellServiceItem[]
): string {
  const serviceList =
    services.length > 0
      ? services
          .map(
            (s) =>
              `— ${s.name} (${s.price > 0 ? `${s.price}€` : "Gratuit"}) : ${s.description}`
          )
          .join("\n")
      : "— Aucun service partenaire disponible pour le moment.";

  return `Bonjour ${guestName} ! J'espère que votre installation se passe bien.\n\n` +
    `Je voulais vous présenter quelques services exclusifs disponibles pendant votre séjour :\n\n` +
    `${serviceList}\n\n` +
    `N'hésitez pas à me dire si l'un de ces services vous intéresse, je peux vous aider à les réserver immédiatement.`;
}

/* ═══════════════════════════════════════════════════════
   POST — Trigger Auto Upsell
   ═══════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const { householdId } = await getAuthUser();

    const body: UpsellRequestBody = await req.json();
    const { checkInStateId } = body;

    if (!checkInStateId || typeof checkInStateId !== "string") {
      return NextResponse.json(
        { success: false, error: "checkInStateId est requis" },
        { status: 400 }
      );
    }

    // ── 1. Fetch household with modulesConfig ──
    const household = await db.household.findUnique({
      where: { id: householdId },
      select: {
        id: true,
        type: true,
        modulesConfig: true,
        timezone: true,
      },
    });

    if (!household || household.type !== "hospitality") {
      return NextResponse.json(
        { success: false, error: "Foyer hospitalier introuvable" },
        { status: 404 }
      );
    }

    // ── 2. Verify the check-in state belongs to this household ──
    const checkInState = await db.checkInState.findFirst({
      where: {
        id: checkInStateId,
        householdId,
        status: "checked-in",
      },
    });

    if (!checkInState) {
      return NextResponse.json(
        { success: false, error: "Séjour actif introuvable" },
        { status: 404 }
      );
    }

    // ── 3. Verify check-in happened > 2 hours ago ──
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    if (checkInState.checkInAt > twoHoursAgo) {
      const elapsedMs = Date.now() - checkInState.checkInAt.getTime();
      const remainingMs = 2 * 60 * 60 * 1000 - elapsedMs;
      const remainingMin = Math.ceil(remainingMs / 60_000);
      return NextResponse.json(
        {
          success: false,
          error: `L'upsell ne peut être déclenché que 2h après le check-in (reste ~${remainingMin} min)`,
          canRetryAt: new Date(Date.now() + remainingMs).toISOString(),
        },
        { status: 425 }
      );
    }

    // ── 4. Check if auto_upsell module is active ──
    if (!checkModuleActive(household.modulesConfig, "auto_upsell")) {
      return NextResponse.json(
        {
          success: false,
          error: "Le module Auto Upsell Intelligent n'est pas activé",
          moduleRequired: "auto_upsell",
        },
        { status: 403 }
      );
    }

    // ── 5. Fetch available partner services ──
    const partnerActivities = await db.activity.findMany({
      where: {
        householdId,
        isPartner: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        priceHint: true,
        category: true,
        image: true,
      },
      orderBy: { title: "asc" },
    });

    const services: UpsellServiceItem[] = partnerActivities.map((activity) => {
      // Parse a numeric price from priceHint (e.g. "~15€", "20-50€", "Gratuit")
      let price = 0;
      const hint = activity.priceHint || "";
      if (hint.toLowerCase().includes("gratuit") || hint.toLowerCase().includes("free")) {
        price = 0;
      } else {
        const match = hint.match(/(\d+)/);
        if (match) {
          price = parseInt(match[1], 10);
        }
      }

      // Map category to icon
      const categoryIcons: Record<string, string> = {
        culture: "Palette",
        sport: "Dumbbell",
        nature: "Trees",
        gastronomie: "UtensilsCrossed",
        "bien-être": "Heart",
        shopping: "ShoppingBag",
        transport: "Car",
        loisir: "Gamepad2",
      };

      return {
        id: activity.id,
        name: activity.title,
        description: activity.description || "",
        price,
        currency: "EUR",
        icon: categoryIcons[activity.category.toLowerCase()] || "Star",
      };
    });

    // ── 6. Get guest profile (MVP: use guestName from CheckInState) ──
    // In production this would import from @/lib/guest-memory
    // to fetch language preferences, past stays, etc.
    const guestName = checkInState.guestName;

    // ── 7. Generate upsell script ──
    // In production this would call Gemini via ai-core.ts
    const script = generateUpsellScript(guestName, services);

    // ── 8. Log the upsell trigger ──
    await db.userLog.create({
      data: {
        householdId,
        action: "upsell_triggered",
        details: JSON.stringify({
          checkInStateId,
          guestName,
          serviceCount: services.length,
          serviceIds: services.map((s) => s.id),
        }),
        status: "success",
      },
    });

    // ── 9. Return success with script and services ──
    return NextResponse.json({
      success: true,
      script,
      services,
      guestName,
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")
    ) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("[MAELLIS] Auto Upsell POST error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
