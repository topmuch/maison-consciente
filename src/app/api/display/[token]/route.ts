import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const household = await db.household.findUnique({
      where: { displayToken: token },
    });

    if (!household?.displayEnabled) {
      return NextResponse.json(
        { success: false, error: "Display désactivé ou token invalide" },
        { status: 403 }
      );
    }

    const config = JSON.parse(household.displayConfig || "{}") as {
      widgets?: Record<string, boolean>;
      guestMode?: { maskPresence?: boolean; maskMessages?: boolean };
    };

    const data: Record<string, unknown> = { householdId: household.id, config, householdName: household.name, whatsappNumber: household.whatsappNumber ?? null };

    // Weather
    if (config.widgets?.weather) {
      try {
        const weatherRes = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&current_weather=true"
        );
        data.weather = await weatherRes.json();
      } catch {
        data.weather = null;
      }
    }

    // Presence
    if (config.widgets?.presence && !config.guestMode?.maskPresence) {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
      data.presenceCount = await db.interaction.count({
        where: {
          zone: { householdId: household.id },
          createdAt: { gte: twoHoursAgo },
        },
      });
    }

    // Groceries
    if (config.widgets?.groceries) {
      data.groceries = await db.groceryItem.findMany({
        where: { householdId: household.id },
        orderBy: { isBought: "asc" },
      });
    }

    // Messages (public only)
    if (config.widgets?.messages && !config.guestMode?.maskMessages) {
      data.messages = await db.message.findMany({
        where: { householdId: household.id, isPublic: true },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          sender: { select: { name: true, email: true } },
        },
      });
    }

    // Featured recipe
    if (config.widgets?.recipe) {
      const recipes = await db.recipe.findMany({
        where: {
          isActive: true,
          OR: [{ householdId: household.id }, { householdId: null }],
        },
        take: 5,
      });
      if (recipes.length > 0) {
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];
        data.featuredRecipe = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          prepTimeMin: recipe.prepTimeMin,
          tags: JSON.parse(recipe.tags || "[]"),
          imageUrl: recipe.imageUrl,
        };
      }
    }

    // Public vault secrets (for tablet display)
    if (config.widgets?.vault) {
      const publicSecrets = await db.secretVault.findMany({
        where: { householdId: household.id, isPublic: true },
        select: { id: true, title: true, type: true },
        take: 5,
      });
      data.publicSecrets = publicSecrets;
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error("[Display API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
