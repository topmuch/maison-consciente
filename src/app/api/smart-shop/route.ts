import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/core/db';
import { getSession } from '@/core/auth/lucia';
import { LOCAL_RECIPES } from '@/lib/constants';
import { searchRecipes } from '@/lib/recipe-engine';
import { broadcastEvent } from '@/lib/sse';

/**
 * API Routes — Smart Shop
 *
 * POST /api/smart-shop with action-based routing:
 *
 *   List actions:
 *     create-list         — Create a new ShoppingList
 *     get-lists           — List all lists for household
 *     get-list            — Get single list with items
 *     complete-list       — Mark list completed
 *     archive-list        — Mark list archived
 *     delete-list         — Delete list (cascade items)
 *
 *   Item actions:
 *     add-item            — Add item to list + recalc spent
 *     update-item         — Update item fields + recalc spent
 *     toggle-item         — Toggle isChecked + recalc spent
 *     delete-item         — Delete item + recalc spent
 *
 *   Stats:
 *     get-stats           — Monthly stats with category breakdown
 *
 *   Partner stores:
 *     add-partner-store   — Create a partner store
 *     get-partner-stores  — List active partner stores
 *
 *   Phase 2 — Recipe Matcher:
 *     recipe-search       — Search local recipes by query
 *     recipe-match        — Match recipe ingredients against shopping list
 *     recipe-inject       — Inject missing recipe items into shopping list
 *
 *   Phase 2 — Stock Alerts:
 *     stock-alerts        — Get frequent items missing from active list
 */

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────

async function getAuthenticatedHouseholdId(): Promise<string | null> {
  try {
    const { session, user } = await getSession();
    if (!session || !user?.householdId) return null;
    return user.householdId as string;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// RECALC HELPER
// ─────────────────────────────────────────────────────────

/**
 * Recalculate spentCents on a ShoppingList.
 * Only checked items contribute: Σ(priceCents × quantity) where isChecked.
 */
async function recalcSpentCents(listId: string): Promise<number> {
  // FIX C-2: Atomic transaction to prevent race conditions
  return db.$transaction(async (tx) => {
    const checkedItems = await tx.shoppingListItem.findMany({
      where: { listId, isChecked: true },
      select: { priceCents: true, quantity: true },
    });
    const total = checkedItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
    await tx.shoppingList.update({
      where: { id: listId },
      data: { spentCents: total },
    });
    return total;
  });
}

// ─────────────────────────────────────────────────────────
// PHASE 2 HELPERS — Ingredient parsing
// ─────────────────────────────────────────────────────────

function normalizeIngredient(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

function extractIngredientName(ingredient: string): string {
  let cleaned = ingredient.trim();
  cleaned = cleaned.replace(/^\d+(\.\d+)?\s*(g|kg|ml|cl|l|cuillères?|cuillère|c\.?\s?a\s*s\.?|sachet|botte|tronçon|tranches?|morceaux?|branches?|feuilles?|tiges?|gousses?|pinch|pincée|verre|tasse|noix|dose)\b\.?\s*(de\s+|d')?/i, '');
  cleaned = cleaned.replace(/^(de\s+d[eu]\s+|d')/i, '');
  return cleaned.trim() || ingredient.trim();
}

function extractIngredientQty(ingredient: string): { quantity: number; unit: string } {
  const qtyMatch = ingredient.match(/^(\d+(\.\d+)?)\s*(g|kg|ml|cl|l)/i);
  if (qtyMatch) {
    const num = parseFloat(qtyMatch[1]);
    const u = qtyMatch[3].toLowerCase();
    const unitMap: Record<string, string> = { g: 'pièce', kg: 'kg', ml: 'litre', cl: 'litre', l: 'litre' };
    return { quantity: Math.round(num), unit: unitMap[u] || 'pièce' };
  }
  const simpleMatch = ingredient.match(/^(\d+)/);
  return { quantity: simpleMatch ? parseInt(simpleMatch[1]) : 1, unit: 'pièce' };
}

function guessIngredientCategory(name: string): string {
  const n = name.toLowerCase();
  const rules: Array<{ kw: string[]; cat: string }> = [
    { kw: ['poulet', 'bœuf', 'veau', 'agneau', 'porc', 'steak', 'saumon', 'poisson', 'thon', 'crevette', 'merguez', 'lardons', 'jambon'], cat: 'viande' },
    { kw: ['lait', 'crème', 'fromage', 'beurre', 'yaourt', 'gruyère', 'reblochon', 'emmental'], cat: 'produits laitiers' },
    { kw: ['pain', 'pâte', 'farine', 'riz', 'semoule', 'spaghetti', 'pâtes'], cat: 'boulangerie' },
    { kw: ['oignon', 'ail', 'tomate', 'carotte', 'courgette', 'aubergine', 'poivron', 'pomme de terre', 'champignon', 'persil', 'basilic', 'citron'], cat: 'légumes' },
    { kw: ['vin', 'bouillon', 'huile', 'vinaigre', 'sauce', 'moutarde'], cat: 'boissons' },
    { kw: ['sucre', 'sel', 'poivre', 'muscade', 'cannelle', 'épices', 'miel', 'chocolat'], cat: 'condiments' },
  ];
  for (const r of rules) {
    if (r.kw.some(k => n.includes(k))) return r.cat;
  }
  return 'alimentaire';
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = normalizeIngredient(a);
  const nb = normalizeIngredient(b);
  if (na === nb) return true;
  if (na.length > 3 && nb.length > 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
    const wa = na.split(/\s+/).filter(w => w.length > 2);
    const wb = nb.split(/\s+/).filter(w => w.length > 2);
    return wa.some(a2 => wb.some(b2 => a2 === b2 || a2.includes(b2) || b2.includes(a2)));
  }
  return false;
}

// ─────────────────────────────────────────────────────────
// MAIN ROUTE HANDLER
// ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const householdId = await getAuthenticatedHouseholdId();
    if (!householdId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // ═══════════════════════════════════════════════════
    // CREATE LIST
    // ═══════════════════════════════════════════════════
    if (action === 'create-list') {
      const { name, budgetCents, storeName } = body;

      const list = await db.shoppingList.create({
        data: {
          householdId,
          name: name?.trim() || 'Mes courses',
          budgetCents: budgetCents ?? 0,
          storeName: storeName?.trim() || null,
        },
      });

      return NextResponse.json({ success: true, list });
    }

    // ═══════════════════════════════════════════════════
    // GET LISTS
    // ═══════════════════════════════════════════════════
    if (action === 'get-lists') {
      const { status } = body;

      const where: Record<string, unknown> = { householdId };
      if (status) where.status = status;

      const lists = await db.shoppingList.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: 30,
        include: {
          _count: { select: { items: true },
          },
        },
      });

      return NextResponse.json({ success: true, lists });
    }

    // ═══════════════════════════════════════════════════
    // GET SINGLE LIST
    // ═══════════════════════════════════════════════════
    if (action === 'get-list') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      const list = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' },
            include: { linkedStore: { select: { id: true, name: true, logo: true } } },
          },
        },
      });

      if (!list) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      return NextResponse.json({ success: true, list });
    }

    // ═══════════════════════════════════════════════════
    // ADD ITEM
    // ═══════════════════════════════════════════════════
    if (action === 'add-item') {
      const {
        listId, barcode, productName, brand, priceCents,
        quantity, unit, category, imageUrl, suggestedBy,
        linkedStoreId, notes,
      } = body;

      if (!listId || !productName?.trim()) {
        return NextResponse.json({ error: 'listId et productName requis' }, { status: 400 });
      }

      // Verify list ownership
      const list = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
      });
      if (!list) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      // Verify linked store if provided
      if (linkedStoreId) {
        const store = await db.partnerStore.findFirst({
          where: { id: linkedStoreId, householdId },
        });
        if (!store) {
          return NextResponse.json({ error: 'Magasin partenaire introuvable' }, { status: 404 });
        }
      }

      const item = await db.shoppingListItem.create({
        data: {
          householdId,
          listId,
          barcode: barcode || null,
          productName: productName.trim(),
          brand: brand || null,
          priceCents: priceCents ?? 0,
          quantity: quantity ?? 1,
          unit: unit || 'pièce',
          category: category || null,
          imageUrl: imageUrl || null,
          suggestedBy: suggestedBy || 'user',
          linkedStoreId: linkedStoreId || null,
          notes: notes || null,
        },
      });

      const newSpent = await recalcSpentCents(listId);

      // Record price history if barcode + price
      if (barcode && priceCents > 0) {
        try {
          await db.priceHistory.create({
            data: {
              householdId,
              barcode,
              productName: productName.trim(),
              priceCents: priceCents ?? 0,
              storeName: null,
            },
          });
        } catch { /* silent */ }
      }

      // SSE broadcast
      try { broadcastEvent(householdId, 'smart-shop-update', { action: 'item-added', listId }); } catch { /* silent */ }

      return NextResponse.json({ success: true, item, spentCents: newSpent });
    }

    // ═══════════════════════════════════════════════════
    // UPDATE ITEM
    // ═══════════════════════════════════════════════════
    if (action === 'update-item') {
      const { itemId, listId, priceCents, quantity, unit, notes } = body;
      if (!itemId || !listId) {
        return NextResponse.json({ error: 'itemId et listId requis' }, { status: 400 });
      }

      // Ownership check + FIX C-1: listId cross-check
      const existingItem = await db.shoppingListItem.findFirst({
        where: { id: itemId, householdId },
      });
      if (!existingItem) {
        return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
      }
      if (existingItem.listId !== listId) {
        return NextResponse.json({ error: "Article n'appartient pas a cette liste" }, { status: 400 });
      }

      // Build update payload — only include provided fields
      const updateData: Record<string, unknown> = {};
      if (priceCents !== undefined) updateData.priceCents = priceCents;
      if (quantity !== undefined) updateData.quantity = quantity;
      if (unit !== undefined) updateData.unit = unit;
      if (notes !== undefined) updateData.notes = notes;

      await db.shoppingListItem.update({
        where: { id: itemId },
        data: updateData,
      });

      const newSpent = await recalcSpentCents(listId);

      return NextResponse.json({ success: true, spentCents: newSpent });
    }

    // ═══════════════════════════════════════════════════
    // TOGGLE ITEM
    // ═══════════════════════════════════════════════════
    if (action === 'toggle-item') {
      const { itemId, listId } = body;
      if (!itemId || !listId) {
        return NextResponse.json({ error: 'itemId et listId requis' }, { status: 400 });
      }

      // Ownership check + FIX C-1: listId cross-check
      const existing = await db.shoppingListItem.findFirst({
        where: { id: itemId, householdId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
      }
      if (existing.listId !== listId) {
        return NextResponse.json({ error: "Article n'appartient pas a cette liste" }, { status: 400 });
      }

      const nowChecked = !existing.isChecked;

      await db.shoppingListItem.update({
        where: { id: itemId },
        data: {
          isChecked: nowChecked,
          checkedAt: nowChecked ? new Date() : null,
        },
      });

      const newSpent = await recalcSpentCents(listId);

      // SSE broadcast
      try { broadcastEvent(householdId, 'smart-shop-update', { action: 'item-toggled', listId, itemId, isChecked: nowChecked }); } catch { /* silent */ }

      return NextResponse.json({ success: true, isChecked: nowChecked, spentCents: newSpent });
    }

    // ═══════════════════════════════════════════════════
    // DELETE ITEM
    // ═══════════════════════════════════════════════════
    if (action === 'delete-item') {
      const { itemId, listId } = body;
      if (!itemId || !listId) {
        return NextResponse.json({ error: 'itemId et listId requis' }, { status: 400 });
      }

      // Ownership check + FIX C-1: listId cross-check
      const existing = await db.shoppingListItem.findFirst({
        where: { id: itemId, householdId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Article introuvable' }, { status: 404 });
      }
      if (existing.listId !== listId) {
        return NextResponse.json({ error: "Article n'appartient pas a cette liste" }, { status: 400 });
      }

      await db.shoppingListItem.delete({
        where: { id: itemId },
      });

      const newSpent = await recalcSpentCents(listId);

      // SSE broadcast
      try { broadcastEvent(householdId, 'smart-shop-update', { action: 'item-deleted', listId, itemId }); } catch { /* silent */ }

      return NextResponse.json({ success: true, spentCents: newSpent });
    }

    // ═══════════════════════════════════════════════════
    // COMPLETE LIST
    // ═══════════════════════════════════════════════════
    if (action === 'complete-list') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      // Ownership check
      const existing = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      // FIX C-3: Single atomic transaction — recalc spentCents + update status
      const spentCents = await recalcSpentCents(listId);

      const list = await db.shoppingList.update({
        where: { id: listId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          // spentCents already persisted by recalcSpentCents
        },
      });

      return NextResponse.json({ success: true, list });
    }

    // ═══════════════════════════════════════════════════
    // ARCHIVE LIST
    // ═══════════════════════════════════════════════════
    if (action === 'archive-list') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      // Ownership check
      const existing = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      const list = await db.shoppingList.update({
        where: { id: listId },
        data: { status: 'archived' },
      });

      return NextResponse.json({ success: true, list });
    }

    // ═══════════════════════════════════════════════════
    // DELETE LIST
    // ═══════════════════════════════════════════════════
    if (action === 'delete-list') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      // Ownership check
      const existing = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      await db.shoppingList.delete({
        where: { id: listId },
      });

      return NextResponse.json({ success: true });
    }

    // ═══════════════════════════════════════════════════
    // GET STATS
    // ═══════════════════════════════════════════════════
    if (action === 'get-stats') {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const lists = await db.shoppingList.findMany({
        where: {
          householdId,
          startedAt: { gte: monthStart },
        },
        include: { items: true },
      });

      const totalLists = lists.length;
      const totalSpent = lists.reduce((s, l) => s + l.spentCents, 0);
      const avgPerList = totalLists > 0 ? Math.round(totalSpent / totalLists) : 0;
      const completedLists = lists.filter((l) => l.status === 'completed').length;

      // Category breakdown — only CHECKED items (FIX M-3)
      const catMap = new Map<string, number>();
      for (const list of lists) {
        for (const item of list.items) {
          if (!item.isChecked) continue; // FIX M-3: skip unchecked
          const cat = item.category || 'autre';
          catMap.set(cat, (catMap.get(cat) || 0) + item.priceCents * item.quantity);
        }
      }

      const categoryBreakdown = Array.from(catMap.entries())
        .map(([category, amountCents]) => ({ category, amountCents }))
        .sort((a, b) => b.amountCents - a.amountCents)
        .slice(0, 10);

      return NextResponse.json({
        success: true,
        stats: {
          totalLists,
          completedLists,
          totalSpent,
          avgPerList,
          categoryBreakdown,
        },
      });
    }

    // ═══════════════════════════════════════════════════
    // ADD PARTNER STORE
    // ═══════════════════════════════════════════════════
    if (action === 'add-partner-store') {
      const { name, logo, deliveryApiEndpoint, categoriesMapping, deepLinkTemplate } = body;
      if (!name?.trim()) {
        return NextResponse.json({ error: 'name requis' }, { status: 400 });
      }

      const store = await db.partnerStore.create({
        data: {
          householdId,
          name: name.trim(),
          logo: logo || null,
          deliveryApiEndpoint: deliveryApiEndpoint || null,
          categoriesMapping: categoriesMapping || '{}',
          deepLinkTemplate: deepLinkTemplate || null,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, store });
    }

    // ═══════════════════════════════════════════════════
    // GET PARTNER STORES
    // ═══════════════════════════════════════════════════
    if (action === 'get-partner-stores') {
      const stores = await db.partnerStore.findMany({
        where: { householdId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ success: true, stores });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 2 — RECIPE SEARCH
    // ═══════════════════════════════════════════════════
    if (action === 'recipe-search') {
      const { query } = body;
      if (!query?.trim()) {
        // Return all recipes if no query
        const all = LOCAL_RECIPES.map(r => ({
          id: r.id, title: r.title, description: r.description,
          difficulty: r.difficulty, prepTimeMin: r.prepTimeMin,
          cookTimeMin: r.cookTimeMin, servings: r.servings,
          ingredients: r.ingredients, steps: r.steps, tags: r.tags,
        }));
        return NextResponse.json({ success: true, recipes: all });
      }

      const results = searchRecipes(query.trim(), 8);
      const recipes = results.map(r => ({
        id: r.recipe.id, title: r.recipe.title, description: r.recipe.description,
        difficulty: r.recipe.difficulty, prepTimeMin: r.recipe.prepTimeMin,
        cookTimeMin: r.recipe.cookTimeMin, servings: r.recipe.servings,
        ingredients: r.recipe.ingredients, steps: r.recipe.steps, tags: r.recipe.tags,
        matchReason: r.matchReason,
      }));

      return NextResponse.json({ success: true, recipes });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 2 — RECIPE MATCH
    // ═══════════════════════════════════════════════════
    if (action === 'recipe-match') {
      const { listId, recipeId, ingredients } = body;
      if (!listId || !ingredients || !Array.isArray(ingredients)) {
        return NextResponse.json({ error: 'listId et ingredients requis' }, { status: 400 });
      }

      // Verify list ownership
      const list = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
        include: { items: { where: { isChecked: false } } },
      });
      if (!list) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      // Parse ingredients and fuzzy match against list
      const alreadyInList: string[] = [];
      const missing: Array<{ original: string; productName: string; quantity: number; unit: string; category: string }> = [];

      for (const ing of ingredients) {
        const name = extractIngredientName(ing);
        const { quantity, unit } = extractIngredientQty(ing);
        const found = list.items.some(existing => fuzzyMatch(existing.productName, name));
        if (found) {
          alreadyInList.push(ing);
        } else {
          missing.push({ original: ing, productName: name, quantity, unit, category: guessIngredientCategory(name) });
        }
      }

      return NextResponse.json({
        success: true,
        match: {
          recipeId: recipeId || '',
          totalIngredients: ingredients.length,
          alreadyInList,
          missingIngredients: missing,
        },
      });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 2 — RECIPE INJECT
    // ═══════════════════════════════════════════════════
    if (action === 'recipe-inject') {
      const { listId, recipeTitle, ingredients } = body;
      if (!listId || !ingredients || !Array.isArray(ingredients)) {
        return NextResponse.json({ error: 'listId et ingredients requis' }, { status: 400 });
      }

      // Verify list ownership
      const list = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
        include: { items: true },
      });
      if (!list) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }
      if (list.status === 'completed' || list.status === 'archived') {
        return NextResponse.json({ error: 'Liste terminee ou archivee' }, { status: 400 });
      }

      // Dedup
      const toCreate = ingredients.filter((ing: Record<string, unknown>) => {
        const name = String(ing.productName || '').toLowerCase().trim();
        return !list.items.some(existing => fuzzyMatch(existing.productName, name));
      });

      const created = await Promise.all(
        toCreate.map((ing: Record<string, unknown>) =>
          db.shoppingListItem.create({
            data: {
              householdId,
              listId,
              productName: String(ing.productName || ''),
              category: String(ing.category || guessIngredientCategory(String(ing.productName || ''))),
              priceCents: 0,
              quantity: Number(ing.quantity) || 1,
              unit: String(ing.unit || 'pièce'),
              suggestedBy: 'recipe',
              notes: recipeTitle ? `Recette : ${recipeTitle}` : null,
            },
          })
        )
      );

      const newSpent = await recalcSpentCents(listId);

      // SSE broadcast
      try { broadcastEvent(householdId, 'smart-shop-update', { action: 'recipe-injected', listId, count: created.length }); } catch { /* silent */ }

      return NextResponse.json({
        success: true,
        injected: created,
        skipped: ingredients.length - toCreate.length,
        spentCents: newSpent,
      });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 2 — STOCK ALERTS
    // ═══════════════════════════════════════════════════
    if (action === 'stock-alerts') {
      const { listId, daysBack, minFrequency } = body;
      const days = daysBack ?? 30;
      const minFreq = minFrequency ?? 2;

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Scan checked items across all lists
      const checkedItems = await db.shoppingListItem.findMany({
        where: { householdId, isChecked: true, checkedAt: { gte: since } },
        select: { productName: true, category: true, checkedAt: true },
        orderBy: { checkedAt: 'desc' },
      });

      // Frequency map with fuzzy dedup
      const freqMap = new Map<string, { name: string; category: string | null; count: number; last: Date }>();
      for (const item of checkedItems) {
        let merged = false;
        for (const [, val] of freqMap.entries()) {
          if (fuzzyMatch(item.productName, val.name)) {
            val.count++;
            if (item.checkedAt && item.checkedAt > val.last) val.last = item.checkedAt;
            merged = true;
            break;
          }
        }
        if (!merged) {
          freqMap.set(item.productName.toLowerCase(), { name: item.productName, category: item.category, count: 1, last: item.checkedAt || new Date() });
        }
      }

      const frequent = Array.from(freqMap.values())
        .filter(f => f.count >= minFreq)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      // Filter against active list if provided
      if (listId) {
        const list = await db.shoppingList.findFirst({
          where: { id: listId, householdId, status: 'active' },
          include: { items: { where: { isChecked: false } } },
        });
        if (list) {
          const alerts = frequent.filter(f =>
            !list.items.some(i => fuzzyMatch(i.productName, f.name))
          ).map(f => ({
            productName: f.name,
            category: f.category,
            purchaseCount: f.count,
            lastBoughtAt: f.last.toISOString(),
            daysSinceLastPurchase: Math.floor((Date.now() - f.last.getTime()) / 86400000),
          }));
          return NextResponse.json({ success: true, alerts });
        }
      }

      const alerts = frequent.map(f => ({
        productName: f.name,
        category: f.category,
        purchaseCount: f.count,
        lastBoughtAt: f.last.toISOString(),
        daysSinceLastPurchase: Math.floor((Date.now() - f.last.getTime()) / 86400000),
      }));

      return NextResponse.json({ success: true, alerts });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 3 — EXTERNAL RECIPES (TheMealDB)
    // ═══════════════════════════════════════════════════
    if (action === 'recipe-external') {
      try {
        const { getExternalRecipeSuggestions } = await import('@/actions/smart-shop-actions');
        const recipes = await getExternalRecipeSuggestions();
        return NextResponse.json({ success: true, recipes });
      } catch (err) {
        console.error('[Smart Shop] External recipes error:', err);
        return NextResponse.json({ success: true, recipes: [] });
      }
    }

    // ═══════════════════════════════════════════════════
    // PHASE 3 — AI SUGGESTIONS
    // ═══════════════════════════════════════════════════
    if (action === 'ai-suggestions') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      // Verify list ownership
      const list = await db.shoppingList.findFirst({
        where: { id: listId, householdId },
      });
      if (!list) {
        return NextResponse.json({ error: 'Liste introuvable' }, { status: 404 });
      }

      try {
        const { getAISuggestions } = await import('@/actions/smart-shop-actions');
        const suggestions = await getAISuggestions(listId);
        return NextResponse.json({ success: true, suggestions });
      } catch (err) {
        console.error('[Smart Shop] AI suggestions error:', err);
        return NextResponse.json({ success: true, suggestions: [] });
      }
    }

    // ═══════════════════════════════════════════════════
    // PHASE 3 — PRICE TREND
    // ═══════════════════════════════════════════════════
    if (action === 'price-trend') {
      const { barcode } = body;
      if (!barcode) {
        return NextResponse.json({ error: 'barcode requis' }, { status: 400 });
      }

      const { getPriceTrend } = await import('@/actions/smart-shop-actions');
      const trend = await getPriceTrend(barcode);
      return NextResponse.json({ success: true, trend });
    }

    // ═══════════════════════════════════════════════════
    // PHASE 3 — PUSH NOTIFICATIONS
    // ═══════════════════════════════════════════════════
    if (action === 'push-stock-alerts') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      const { sendStockAlertPush } = await import('@/actions/smart-shop-actions');
      const result = await sendStockAlertPush(listId);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === 'push-budget-check') {
      const { listId } = body;
      if (!listId) {
        return NextResponse.json({ error: 'listId requis' }, { status: 400 });
      }

      const { checkBudgetThreshold } = await import('@/actions/smart-shop-actions');
      const result = await checkBudgetThreshold(listId);
      return NextResponse.json({ success: true, ...result });
    }

    // ═══════════════════════════════════════════════════
    // FALLBACK
    // ═══════════════════════════════════════════════════
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('[Smart Shop] Error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
