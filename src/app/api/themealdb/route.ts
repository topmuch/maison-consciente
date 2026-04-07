import { NextRequest, NextResponse } from 'next/server';
import {
  searchHybridRecipes,
  suggestHybridRecipe,
  getMealDetailsExternal,
  getCategories,
  browseByCategory,
  browseByArea,
  discoverRandom,
} from '@/actions/themealdb-recipes';

/* ═══════════════════════════════════════════════════════
   API ROUTE — /api/themealdb
   
   REST endpoints for TheMealDB integration.
   All calls go through server actions (cached).
   ═══════════════════════════════════════════════════════ */

// GET /api/themealdb?action=search&query=chicken
// GET /api/themealdb?action=suggest&hour=19
// GET /api/themealdb?action=detail&id=52772
// GET /api/themealdb?action=categories
// GET /api/themealdb?action=browse&category=Chicken&page=1
// GET /api/themealdb?action=browse&area=French&page=1
// GET /api/themealdb?action=discover
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'search': {
        const query = searchParams.get('query') || '';
        const limit = Math.min(parseInt(searchParams.get('limit') || '12', 10), 50);
        const householdId = searchParams.get('householdId') || undefined;

        const result = await searchHybridRecipes(query, limit, householdId);
        return NextResponse.json({ success: true, ...result });
      }

      case 'suggest': {
        const hour = parseInt(searchParams.get('hour') || String(new Date().getHours()), 10);
        const season = searchParams.get('season') || undefined;

        const suggestions = await suggestHybridRecipe(hour, season);
        return NextResponse.json({ success: true, suggestions });
      }

      case 'detail': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Paramètre id requis' },
            { status: 400 }
          );
        }

        const meal = await getMealDetailsExternal(id);
        if (!meal) {
          return NextResponse.json(
            { success: false, error: 'Recette non trouvée' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, meal });
      }

      case 'categories': {
        const categories = await getCategories();
        return NextResponse.json({ success: true, categories });
      }

      case 'browse': {
        const category = searchParams.get('category');
        const area = searchParams.get('area');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const perPage = Math.min(parseInt(searchParams.get('perPage') || '12', 10), 50);

        if (category) {
          const result = await browseByCategory(category, page, perPage);
          return NextResponse.json({ success: true, ...result });
        }
        if (area) {
          const result = await browseByArea(area, page, perPage);
          return NextResponse.json({ success: true, ...result });
        }

        return NextResponse.json(
          { success: false, error: 'Paramètre category ou area requis' },
          { status: 400 }
        );
      }

      case 'discover': {
        const count = Math.min(parseInt(searchParams.get('count') || '6', 10), 20);
        const meals = await discoverRandom(count);
        return NextResponse.json({ success: true, meals });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Action non reconnue. Actions: search, suggest, detail, categories, browse, discover' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[TheMealDB API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
