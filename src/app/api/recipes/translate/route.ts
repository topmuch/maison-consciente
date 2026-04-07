import { NextRequest, NextResponse } from "next/server";
import { db, parseJson } from "@/core/db";
import { requireHousehold } from "@/core/auth/guards";
import { translateRecipeSchema } from "@/core/validations/schemas";

/**
 * Determines the DeepL API base URL based on the API key.
 * Free API keys end with ":fx" → use api-free.deepl.com
 * All other keys → use api.deepl.com (paid/pro)
 */
function getDeeplBaseUrl(apiKey: string): string {
  if (apiKey.endsWith(":fx")) {
    return "https://api-free.deepl.com/v2/translate";
  }
  return "https://api.deepl.com/v2/translate";
}

/**
 * Calls the DeepL translate API with a list of texts.
 * Returns the array of translated strings in the same order.
 */
async function deeplTranslate(
  texts: string[],
  targetLang: string,
  apiKey: string
): Promise<string[]> {
  if (texts.length === 0) return [];

  const baseUrl = getDeeplBaseUrl(apiKey);

  const body = new URLSearchParams();
  body.append("auth_key", apiKey);
  body.append("target_lang", targetLang.toUpperCase());
  body.append("source_lang", "FR"); // source language is always French in this app
  for (const text of texts) {
    body.append("text", text);
  }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("DeepL API error:", res.status, errBody);
    throw new Error(`DeepL API error: ${res.status}`);
  }

  const data = await res.json();

  return (data.translations as Array<{ text: string }>).map((t) => t.text);
}

// POST /api/recipes/translate
export async function POST(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();

    const body = await request.json();
    const parsed = translateRecipeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation échouée", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { recipeId, targetLang } = parsed.data;

    // ── Check if translation is already cached ──
    const cached = await db.recipeTranslation.findUnique({
      where: { recipeId_targetLang: { recipeId, targetLang } },
    });

    if (cached) {
      return NextResponse.json({
        success: true,
        translatedTitle: cached.title,
        translatedIngredients: cached.ingredients,
        translatedSteps: cached.steps,
        targetLang,
      });
    }

    // ── Fetch the recipe ──
    const recipe = await db.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: "Recette non trouvée" },
        { status: 404 }
      );
    }

    // ── Check DeepL API key ──
    const deeplKey = process.env.DEEPL_API_KEY;
    if (!deeplKey) {
      return NextResponse.json(
        { success: false, error: "Clé API DeepL non configurée" },
        { status: 503 }
      );
    }

    // ── Parse recipe fields ──
    const ingredients: string[] = parseJson<string[]>(recipe.ingredients, []);
    const steps: string[] = parseJson<string[]>(recipe.steps, []);

    // ── Build texts array: [title, ...ingredients, ...steps] ──
    const allTexts: string[] = [recipe.title, ...ingredients, ...steps];

    if (allTexts.every((t) => !t.trim())) {
      return NextResponse.json(
        { success: false, error: "Aucun contenu à traduire" },
        { status: 400 }
      );
    }

    // ── Call DeepL API ──
    const translated = await deeplTranslate(allTexts, targetLang, deeplKey);

    const translatedTitle = translated[0];
    const translatedIngredients = translated.slice(1, 1 + ingredients.length);
    const translatedSteps = translated.slice(1 + ingredients.length);

    // ── Store in RecipeTranslation cache ──
    await db.recipeTranslation.create({
      data: {
        recipeId,
        targetLang,
        title: translatedTitle,
        ingredients: JSON.stringify(translatedIngredients),
        steps: JSON.stringify(translatedSteps),
      },
    });

    // ── Log the action ──
    await db.userLog.create({
      data: {
        userId: user.id,
        householdId,
        action: "recipe_translate",
        details: `Traduction "${recipe.title}" → ${targetLang.toUpperCase()}`,
      },
    });

    return NextResponse.json({
      success: true,
      translatedTitle,
      translatedIngredients: JSON.stringify(translatedIngredients),
      translatedSteps: JSON.stringify(translatedSteps),
      targetLang,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "NO_HOUSEHOLD")) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      );
    }
    console.error("Recipe translation error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la traduction" },
      { status: 500 }
    );
  }
}
