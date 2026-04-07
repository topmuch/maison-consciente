import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold, requireRole } from "@/core/auth/guards";
import { createRecipeSchema } from "@/core/validations/schemas";

// GET: List recipes (global + household-specific), active only
export async function GET() {
  try {
    const { householdId } = await requireHousehold();

    const recipes = await db.recipe.findMany({
      where: {
        isActive: true,
        OR: [
          { householdId: null },
          { householdId: householdId! },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      recipes: recipes.map((r) => ({
        ...r,
        tags: parseJson<string[]>(r.tags, []),
        ingredients: parseJson<string[]>(r.ingredients, []),
        steps: parseJson<string[]>(r.steps, []),
      })),
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("List recipes error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST: Create recipe (owner or superadmin only)
export async function POST(request: NextRequest) {
  try {
    const { householdId } = await requireRole("owner", "superadmin");

    const body = await request.json();
    const parsed = createRecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, prepTimeMin, tags, ingredients, steps, imageUrl } = parsed.data;

    const recipe = await db.recipe.create({
      data: {
        householdId: householdId!,
        title,
        description: description || "",
        prepTimeMin: prepTimeMin || 0,
        tags: JSON.stringify(tags || []),
        ingredients: JSON.stringify(ingredients || []),
        steps: JSON.stringify(steps || []),
        imageUrl: imageUrl || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        recipe: {
          ...recipe,
          tags: parseJson<string[]>(recipe.tags, []),
          ingredients: parseJson<string[]>(recipe.ingredients, []),
          steps: parseJson<string[]>(recipe.steps, []),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 }
      );
    }
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Create recipe error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
