import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/core/auth/lucia";

/**
 * API Routes — Smart Grocery + Suggestions
 * POST /api/smart-grocery
 *   - add-item: Add a grocery with auto-category detection + history recording
 *   - get-suggestions: Get frequently bought items not in current list
 *   - record-purchase: Record a purchase for history
 */

export const dynamic = "force-dynamic";

// Category auto-detection mapping
const CATEGORY_MAP: Record<string, string> = {
  lait: "dairy",
  yaourt: "dairy",
  fromage: "dairy",
  crème: "dairy",
  beurre: "dairy",
  pain: "bakery",
  baguette: "bakery",
  croissant: "bakery",
  biscuit: "bakery",
  gâteau: "bakery",
  poulet: "meat",
  boeuf: "meat",
  porc: "meat",
  viande: "meat",
  saucisse: "meat",
  jambon: "meat",
  poisson: "meat",
  saumon: "meat",
  pomme: "produce",
  banane: "produce",
  tomate: "produce",
  salade: "produce",
  carotte: "produce",
  oignon: "produce",
  ail: "produce",
  "pomme de terre": "produce",
  fruit: "produce",
  légume: "produce",
  eau: "beverages",
  jus: "beverages",
  soda: "beverages",
  bière: "beverages",
  vin: "beverages",
  café: "beverages",
  thé: "beverages",
  laitue: "produce",
  congelé: "frozen",
  surgelé: "frozen",
  glace: "frozen",
  pizza: "frozen",
  savon: "hygiene",
  dentifrice: "hygiene",
  lessive: "hygiene",
  essuie: "hygiene",
  shampooing: "hygiene",
  "gel douche": "hygiene",
};

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return "food";
}

const CATEGORY_LABELS: Record<string, { emoji: string; label: string }> = {
  dairy: { emoji: "🥛", label: "Produits laitiers" },
  bakery: { emoji: "🥖", label: "Boulangerie" },
  meat: { emoji: "🥩", label: "Viandes & Poissons" },
  produce: { emoji: "🥬", label: "Fruits & Légumes" },
  beverages: { emoji: "🥤", label: "Boissons" },
  frozen: { emoji: "🧊", label: "Surgelés" },
  food: { emoji: "🍽️", label: "Alimentaire" },
  hygiene: { emoji: "🧼", label: "Hygiène" },
  other: { emoji: "📦", label: "Autre" },
};

async function getAuthenticatedHouseholdId(): Promise<string | null> {
  try {
    const { session, user } = await getSession();
    if (!session || !user?.householdId) return null;
    return user.householdId as string;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const householdId = await getAuthenticatedHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "add-item") {
      const { name, barcode, category: forcedCategory } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: "Nom requis" }, { status: 400 });
      }

      const category = forcedCategory || detectCategory(name.trim());

      const item = await db.groceryItem.create({
        data: {
          householdId,
          name: name.trim(),
          category,
          barcode: barcode || null,
          isBought: false,
        },
      });

      return NextResponse.json({
        success: true,
        item,
        categoryInfo: CATEGORY_LABELS[category] || CATEGORY_LABELS.food,
      });
    }

    if (action === "get-suggestions") {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const frequent = await db.purchaseHistory.groupBy({
        by: ["itemName"],
        where: {
          householdId,
          boughtAt: { gte: lastWeek },
        },
        _count: { itemName: true },
        orderBy: { _count: { itemName: "desc" } },
        take: 8,
      });

      const currentList = await db.groceryItem.findMany({
        where: { householdId, isBought: false },
        select: { name: true },
      });
      const currentNames = new Set(
        currentList.map((i) => i.name.toLowerCase())
      );

      const suggestions = frequent
        .filter((f) => !currentNames.has(f.itemName.toLowerCase()))
        .map((f) => ({
          name: f.itemName,
          count: f._count.itemName,
        }));

      return NextResponse.json({ success: true, suggestions });
    }

    if (action === "record-purchase") {
      const { itemName, category } = body;
      if (!itemName?.trim()) {
        return NextResponse.json({ error: "Nom requis" }, { status: 400 });
      }

      await db.purchaseHistory.create({
        data: {
          householdId,
          itemName: itemName.trim(),
          category: category || detectCategory(itemName.trim()),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "get-categories") {
      return NextResponse.json({ success: true, categories: CATEGORY_LABELS });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error) {
    console.error("[Smart Grocery] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
