'use server';

/**
 * Smart Shop — Server Actions
 *
 * All Smart Shop mutations exposed as server actions for type safety.
 * Auth via getAuthUser() — Lucia session + householdId.
 *
 * Models used:
 *   - ShoppingList: household shopping list with budget & status
 *   - ShoppingListItem: individual items with checkbox, pricing, categorisation
 *   - PartnerStore: linked partner stores for delivery / deep links
 *
 * Fixes applied:
 *   C-1: listId cross-check on item mutations (security)
 *   C-2: recalcSpentCents wrapped in $transaction (race condition)
 *   C-3: completeShoppingList single atomic transaction (race condition)
 *   M-3: Stats category breakdown only counts checked items (logic)
 */

import { getAuthUser } from '@/lib/server-auth';
import { db } from '@/core/db';
import { LOCAL_RECIPES, type LocalRecipe } from '@/lib/constants';
import { searchRecipes } from '@/lib/recipe-engine';

// ─────────────────────────────────────────────────────────
// HELPERS — Ingredient parsing & category guessing
// ─────────────────────────────────────────────────────────

/**
 * Normalize text for fuzzy matching: lowercase, strip accents, strip digits.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Extract a product name from a recipe ingredient string.
 * "6 oignons jaunes" → "oignons jaunes"
 * "50g de beurre" → "beurre"
 * "200ml de crème fraîche" → "crème fraîche"
 * "1 pâte brisée" → "pâte brisée"
 * "Sel et poivre" → "Sel et poivre"
 */
function extractProductName(ingredient: string): string {
  let cleaned = ingredient.trim();

  // Remove leading quantity patterns: "6 ", "200g ", "50g de ", "1L de ", "200ml de "
  cleaned = cleaned.replace(/^\d+(\.\d+)?\s*(g|kg|ml|cl|l|cuillères?|cuillère|c\.?\s?a\s*s\.?|sachet|botte|tronçon|tranches?|morceaux?|branches?|feuilles?|tiges?|gousses?|pinch|pincée|verre|tasse|noix|dose)\b\.?\s*(de\s+|d')?/i, '');

  // Remove "de " prefix
  cleaned = cleaned.replace(/^(de\s+d[eu]\s+|d')/i, '');

  return cleaned.trim() || ingredient.trim();
}

/**
 * Extract quantity + unit from a recipe ingredient string.
 * Returns { quantity, unit } with sensible defaults.
 */
function extractQuantity(ingredient: string): { quantity: number; unit: string } {
  const qtyMatch = ingredient.match(/^(\d+(\.\d+)?)\s*(g|kg|ml|cl|l)/i);
  if (qtyMatch) {
    const num = parseFloat(qtyMatch[1]);
    const u = qtyMatch[3].toLowerCase();
    const unitMap: Record<string, string> = { g: 'pièce', kg: 'kg', ml: 'litre', cl: 'litre', l: 'litre' };
    return { quantity: Math.round(num), unit: unitMap[u] || 'pièce' };
  }

  const simpleMatch = ingredient.match(/^(\d+)/);
  if (simpleMatch) {
    return { quantity: parseInt(simpleMatch[1]), unit: 'pièce' };
  }

  return { quantity: 1, unit: 'pièce' };
}

/**
 * Guess a shopping category from an ingredient name.
 * Uses keyword matching against known category terms.
 */
function guessCategory(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  const catRules: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['poulet', 'bœuf', 'veau', 'agneau', 'porc', 'steak', 'escalope', 'saumon', 'poisson', 'thon', 'crevette', 'merguez', 'lardons', 'jambon', 'viande', 'filet', 'cuisse'], category: 'viande' },
    { keywords: ['lait', 'crème', 'fromage', 'beurre', 'yaourt', 'gruyère', 'mozzarella', 'reblochon', 'chèvre', 'emmental', 'roquefort', 'parmesan', 'pecorino', 'crème fraîche'], category: 'produits laitiers' },
    { keywords: ['pain', 'pâte', 'farine', 'riz', 'semoule', 'spaghetti', 'tagliatelle', 'fusilli', 'penne', 'pâtes', 'croissant', 'baguette', 'tartine'], category: 'boulangerie' },
    { keywords: ['oignon', 'ail', 'tomate', 'carotte', 'courgette', 'aubergine', 'poivron', 'pomme de terre', 'patate douce', 'champignon', 'salade', 'épinard', 'brocoli', 'chou', 'potiron', 'potimarron', 'haricot', 'pois', 'persil', 'basilic', 'ciboulette', 'coriandre', 'aneth', 'thym', 'romarin', 'menthe', 'laitue', 'concombre', 'radis', 'navet', 'panais', 'céleri', 'poireau', 'citron', 'orange', 'pomme', 'cerise', 'fraise', 'framboise', 'myrtille', 'banane', 'mangue', 'avocat'], category: 'légumes' },
    { keywords: ['eau', 'vin', 'bière', 'jus', 'sirop', 'limonade', 'soupe', 'bouillon', 'vinaigre', 'balsamique', 'huile', 'sauce', 'ketchup', 'moutarde', 'mayonnaise', 'soja'], category: 'boissons' },
    { keywords: ['surgelé', 'glacé', 'congelé'], category: 'surgelés' },
    { keywords: ['savon', 'dentifrice', 'essuie', 'pq', ' papier', 'lessive', 'nettoyant', 'produit ménager', 'éponge', 'liquide vaisselle'], category: 'nettoyage' },
    { keywords: ['shampoing', 'gel douche', 'crème', 'démaquillant', 'déodorant', 'rasage'], category: 'hygiène' },
    { keywords: ['sucre', 'sel', 'poivre', 'muscade', 'cannelle', 'paprika', 'curry', 'gingembre', 'curcuma', 'cumin', 'safran', 'herbes', 'épices', 'miel', 'confiture', 'chocolat', 'cacao', 'vanille', 'levure', 'bicarbonate', 'maïzena', 'fecule'], category: 'condiments' },
  ];

  for (const rule of catRules) {
    if (rule.keywords.some(kw => name.includes(kw))) {
      return rule.category;
    }
  }

  return 'alimentaire';
}

/**
 * Fuzzy match: returns true if two product names refer to the same thing.
 * Normalizes both and checks for inclusion or significant overlap.
 */
function isSameProduct(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return true;
  if (na.length > 3 && nb.length > 3) {
    if (na.includes(nb) || nb.includes(na)) return true;
    // Check if the main word (longest) matches
    const wordsA = na.split(/\s+/).filter(w => w.length > 2);
    const wordsB = nb.split(/\s+/).filter(w => w.length > 2);
    return wordsA.some(wa => wordsB.some(wb => wa === wb || wa.includes(wb) || wb.includes(wa)));
  }
  return false;
}

/**
 * Recalculate spentCents on a shopping list (atomic transaction).
 * Only **checked** items contribute to the total:
 *   spentCents = sum(item.priceCents * item.quantity) where item.isChecked
 *
 * FIX C-2: Wrapped in $transaction to prevent race conditions.
 */
async function recalcSpentCents(listId: string): Promise<number> {
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
// SHOPPING LIST
// ─────────────────────────────────────────────────────────

/**
 * Create a new ShoppingList for the authenticated household.
 */
export async function createShoppingList(data: {
  name?: string;
  budgetCents?: number;
  storeName?: string;
}) {
  const { householdId } = await getAuthUser();

  return db.shoppingList.create({
    data: {
      householdId,
      name: data.name?.trim() || 'Mes courses',
      budgetCents: data.budgetCents ?? 0,
      storeName: data.storeName?.trim() || null,
    },
  });
}

/**
 * Mark a shopping list as completed.
 * Sets completedAt and recalc spentCents one last time.
 *
 * FIX C-3: Single atomic transaction — no double write of spentCents.
 */
export async function completeShoppingList(listId: string) {
  const { householdId } = await getAuthUser();

  // Ownership check
  const list = await db.shoppingList.findFirst({
    where: { id: listId, householdId },
  });
  if (!list) throw new Error('Liste introuvable');

  // Single transaction: recalc spentCents + update status atomically
  return db.$transaction(async (tx) => {
    const checkedItems = await tx.shoppingListItem.findMany({
      where: { listId, isChecked: true },
      select: { priceCents: true, quantity: true },
    });
    const spentCents = checkedItems.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

    return tx.shoppingList.update({
      where: { id: listId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        spentCents,
      },
    });
  });
}

/**
 * Mark a shopping list as archived.
 */
export async function archiveShoppingList(listId: string) {
  const { householdId } = await getAuthUser();

  // Ownership check
  const list = await db.shoppingList.findFirst({
    where: { id: listId, householdId },
  });
  if (!list) throw new Error('Liste introuvable');

  return db.shoppingList.update({
    where: { id: listId },
    data: { status: 'archived' },
  });
}

/**
 * Delete a shopping list and all its items (cascade).
 */
export async function deleteShoppingList(listId: string) {
  const { householdId } = await getAuthUser();

  // Ownership check
  const list = await db.shoppingList.findFirst({
    where: { id: listId, householdId },
  });
  if (!list) throw new Error('Liste introuvable');

  return db.shoppingList.delete({
    where: { id: listId },
  });
}

// ─────────────────────────────────────────────────────────
// SHOPPING LIST ITEMS
// ─────────────────────────────────────────────────────────

/**
 * Add a new item to a shopping list.
 * Optionally sets linkedStoreId if the item is linked to a partner store.
 */
export async function addListItem(data: {
  listId: string;
  barcode?: string;
  productName: string;
  brand?: string;
  priceCents?: number;
  quantity?: number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  suggestedBy?: string;
  linkedStoreId?: string;
  notes?: string;
}) {
  const { householdId } = await getAuthUser();

  // Verify list belongs to household
  const list = await db.shoppingList.findFirst({
    where: { id: data.listId, householdId },
  });
  if (!list) throw new Error('Liste introuvable');

  // Verify linked store belongs to household if provided
  if (data.linkedStoreId) {
    const store = await db.partnerStore.findFirst({
      where: { id: data.linkedStoreId, householdId },
    });
    if (!store) throw new Error('Magasin partenaire introuvable');
  }

  const item = await db.shoppingListItem.create({
    data: {
      householdId,
      listId: data.listId,
      barcode: data.barcode || null,
      productName: data.productName.trim(),
      brand: data.brand || null,
      priceCents: data.priceCents ?? 0,
      quantity: data.quantity ?? 1,
      unit: data.unit || 'pièce',
      category: data.category || null,
      imageUrl: data.imageUrl || null,
      suggestedBy: data.suggestedBy || 'user',
      linkedStoreId: data.linkedStoreId || null,
      notes: data.notes || null,
    },
  });

  const spentCents = await recalcSpentCents(data.listId);

  return { item, spentCents };
}

/**
 * Update mutable fields on a shopping list item.
 * Allowed updates: priceCents, quantity, unit, notes.
 *
 * FIX C-1: Verify item belongs to the specified list (security).
 */
export async function updateListItem(
  itemId: string,
  listId: string,
  data: {
    priceCents?: number;
    quantity?: number;
    unit?: string;
    notes?: string;
  }
) {
  const { householdId } = await getAuthUser();

  // Ownership check + listId cross-check
  const existing = await db.shoppingListItem.findFirst({
    where: { id: itemId, householdId },
  });
  if (!existing) throw new Error('Article introuvable');
  if (existing.listId !== listId) throw new Error("Article n'appartient pas a cette liste");

  // Build update payload — only include provided fields
  const updateData: Record<string, unknown> = {};
  if (data.priceCents !== undefined) updateData.priceCents = data.priceCents;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.notes !== undefined) updateData.notes = data.notes;

  await db.shoppingListItem.update({
    where: { id: itemId },
    data: updateData,
  });

  const spentCents = await recalcSpentCents(listId);

  return { spentCents };
}

/**
 * Toggle isChecked on a shopping list item.
 * Sets checkedAt when checking, clears when unchecking.
 *
 * FIX C-1: Verify item belongs to the specified list (security).
 */
export async function toggleListItem(itemId: string, listId: string) {
  const { householdId } = await getAuthUser();

  // Ownership check + listId cross-check
  const existing = await db.shoppingListItem.findFirst({
    where: { id: itemId, householdId },
  });
  if (!existing) throw new Error('Article introuvable');
  if (existing.listId !== listId) throw new Error("Article n'appartient pas a cette liste");

  const nowChecked = !existing.isChecked;

  await db.shoppingListItem.update({
    where: { id: itemId },
    data: {
      isChecked: nowChecked,
      checkedAt: nowChecked ? new Date() : null,
    },
  });

  const spentCents = await recalcSpentCents(listId);

  return { isChecked: nowChecked, spentCents };
}

/**
 * Delete a shopping list item and recalc spentCents.
 *
 * FIX C-1: Verify item belongs to the specified list (security).
 */
export async function deleteListItem(itemId: string, listId: string) {
  const { householdId } = await getAuthUser();

  // Ownership check + listId cross-check
  const existing = await db.shoppingListItem.findFirst({
    where: { id: itemId, householdId },
  });
  if (!existing) throw new Error('Article introuvable');
  if (existing.listId !== listId) throw new Error("Article n'appartient pas a cette liste");

  await db.shoppingListItem.delete({
    where: { id: itemId },
  });

  const spentCents = await recalcSpentCents(listId);

  return { spentCents };
}

// ─────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────

/**
 * Monthly shopping stats with category breakdown.
 * Aggregates all completed/active lists started this month.
 *
 * FIX M-3: Category breakdown only counts CHECKED items to match totalSpent.
 */
export async function getSmartShopStats() {
  const { householdId } = await getAuthUser();
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

  // Category breakdown — only aggregate CHECKED items (matches spentCents)
  const catMap = new Map<string, number>();
  for (const list of lists) {
    for (const item of list.items) {
      if (!item.isChecked) continue; // FIX M-3: Skip unchecked items
      const cat = item.category || 'autre';
      catMap.set(cat, (catMap.get(cat) || 0) + item.priceCents * item.quantity);
    }
  }

  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents)
    .slice(0, 10);

  return {
    totalLists,
    completedLists,
    totalSpent,
    avgPerList,
    categoryBreakdown,
  };
}

// ─────────────────────────────────────────────────────────
// PARTNER STORES
// ─────────────────────────────────────────────────────────

/**
 * Create a new partner store for the household.
 */
export async function addPartnerStore(data: {
  name: string;
  logo?: string;
  deliveryApiEndpoint?: string;
  categoriesMapping?: string;
  deepLinkTemplate?: string;
}) {
  const { householdId } = await getAuthUser();

  return db.partnerStore.create({
    data: {
      householdId,
      name: data.name.trim(),
      logo: data.logo || null,
      deliveryApiEndpoint: data.deliveryApiEndpoint || null,
      categoriesMapping: data.categoriesMapping || '{}',
      deepLinkTemplate: data.deepLinkTemplate || null,
      isActive: true,
    },
  });
}

// ─────────────────────────────────────────────────────────
// PHASE 2 — RECIPE MATCHER
// ─────────────────────────────────────────────────────────

export interface RecipeSearchResult {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  prepTimeMin: number;
  cookTimeMin: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  tags: string[];
  source: 'local';
}

/**
 * Search local recipes by query. Used by the Recipe Matcher UI.
 */
export function searchLocalRecipes(query: string, limit = 6): RecipeSearchResult[] {
  const results = searchRecipes(query, limit);
  return results.map(r => ({
    id: r.recipe.id,
    title: r.recipe.title,
    description: r.recipe.description,
    difficulty: r.recipe.difficulty,
    prepTimeMin: r.recipe.prepTimeMin,
    cookTimeMin: r.recipe.cookTimeMin,
    servings: r.recipe.servings,
    ingredients: r.recipe.ingredients,
    steps: r.recipe.steps,
    tags: r.recipe.tags,
    source: 'local' as const,
  }));
}

/**
 * Get all available local recipes (for browse mode).
 */
export function getAllLocalRecipes(): RecipeSearchResult[] {
  return LOCAL_RECIPES.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    difficulty: r.difficulty,
    prepTimeMin: r.prepTimeMin,
    cookTimeMin: r.cookTimeMin,
    servings: r.servings,
    ingredients: r.ingredients,
    steps: r.steps,
    tags: r.tags,
    source: 'local' as const,
  }));
}

export interface RecipeMatchResult {
  recipeId: string;
  recipeTitle: string;
  totalIngredients: number;
  alreadyInList: string[];     // Ingredients already in the shopping list
  missingIngredients: Array<{  // Ingredients NOT in the shopping list
    original: string;
    productName: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
}

/**
 * Match recipe ingredients against a shopping list.
 * Compares each recipe ingredient (fuzzy match) against unchecked items in the list.
 * Returns missing ingredients ready to be injected.
 */
export async function matchRecipeToList(data: {
  listId: string;
  recipeId: string;
  ingredients: string[];
}) {
  const { householdId } = await getAuthUser();

  // Verify list ownership
  const list = await db.shoppingList.findFirst({
    where: { id: data.listId, householdId },
    include: { items: { where: { isChecked: false } } },
  });
  if (!list) throw new Error('Liste introuvable');

  // Build set of existing unchecked item names for fuzzy matching
  const existingItems = list.items;

  const alreadyInList: string[] = [];
  const missingIngredients: RecipeMatchResult['missingIngredients'] = [];

  for (const ingredient of data.ingredients) {
    const productName = extractProductName(ingredient);
    const { quantity, unit } = extractQuantity(ingredient);

    // Check fuzzy match against existing items
    const found = existingItems.some(existing => isSameProduct(existing.productName, productName));

    if (found) {
      alreadyInList.push(ingredient);
    } else {
      missingIngredients.push({
        original: ingredient,
        productName,
        quantity,
        unit,
        category: guessCategory(productName),
      });
    }
  }

  return {
    recipeId: data.recipeId,
    recipeTitle: '',  // Caller can fill this in
    totalIngredients: data.ingredients.length,
    alreadyInList,
    missingIngredients,
  } satisfies RecipeMatchResult;
}

/**
 * Inject missing recipe ingredients into a shopping list.
 * Creates ShoppingListItems with suggestedBy: "recipe" for each missing ingredient.
 * Deduplicates against existing items (both checked and unchecked).
 */
export async function injectRecipeItems(data: {
  listId: string;
  recipeTitle: string;
  ingredients: Array<{
    original: string;
    productName: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
}) {
  const { householdId } = await getAuthUser();

  // Verify list ownership and status
  const list = await db.shoppingList.findFirst({
    where: { id: data.listId, householdId },
    include: { items: true },  // All items for dedup
  });
  if (!list) throw new Error('Liste introuvable');
  if (list.status === 'completed' || list.status === 'archived') {
    throw new Error('Impossible d\'ajouter a une liste terminee ou archivee');
  }

  // Dedup: skip ingredients already in the list (any state)
  const allExistingNames = new Set(list.items.map(i => i.productName.toLowerCase().trim()));

  const toCreate = data.ingredients.filter(ing => {
    const normalizedName = ing.productName.toLowerCase().trim();
    // Exact or fuzzy match
    return !allExistingNames.has(normalizedName) &&
      !list.items.some(existing => isSameProduct(existing.productName, ing.productName));
  });

  // Batch create items
  const createdItems = await Promise.all(
    toCreate.map(ing =>
      db.shoppingListItem.create({
        data: {
          householdId,
          listId: data.listId,
          productName: ing.productName,
          category: ing.category,
          priceCents: 0,
          quantity: ing.quantity,
          unit: ing.unit,
          suggestedBy: 'recipe',
          notes: `Recette : ${data.recipeTitle}`,
        },
      })
    )
  );

  // Recalc spent (won't change since all priceCents = 0, but keeps consistency)
  const spentCents = await recalcSpentCents(data.listId);

  return {
    items: createdItems,
    skipped: data.ingredients.length - toCreate.length,
    spentCents,
  };
}

// ─────────────────────────────────────────────────────────
// PHASE 2 — STOCK ALERTS (Frequent Purchase Detection)
// ─────────────────────────────────────────────────────────

export interface StockAlert {
  productName: string;
  category: string | null;
  purchaseCount: number;
  lastBoughtAt: string;
  daysSinceLastPurchase: number;
}

/**
 * Detect frequently purchased items that are NOT in the active shopping list.
 *
 * Algorithm:
 *  1. Scan all checked ShoppingListItems from the last N days
 *  2. Group by productName (fuzzy) and count occurrences
 *  3. Filter for items purchased >= minFrequency times
 *  4. Compare against unchecked items in the target list
 *  5. Return items that are frequent but absent from the current list
 */
export async function getStockAlerts(data?: {
  listId?: string;
  daysBack?: number;
  minFrequency?: number;
}): Promise<StockAlert[]> {
  const { householdId } = await getAuthUser();

  const daysBack = data?.daysBack ?? 30;
  const minFrequency = data?.minFrequency ?? 2;

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Find all checked items across all lists in the last N days
  const recentCheckedItems = await db.shoppingListItem.findMany({
    where: {
      householdId,
      isChecked: true,
      checkedAt: { gte: since },
    },
    select: {
      productName: true,
      category: true,
      checkedAt: true,
    },
    orderBy: { checkedAt: 'desc' },
  });

  // Group by normalized name, track frequency and last purchase date
  const freqMap = new Map<string, {
    originalName: string;
    category: string | null;
    count: number;
    lastBought: Date;
  }>();

  for (const item of recentCheckedItems) {
    const key = normalizeText(item.productName);

    // Try to merge with existing entries (fuzzy dedup)
    let merged = false;
    for (const [existingKey, val] of freqMap.entries()) {
      if (isSameProduct(item.productName, val.originalName)) {
        val.count++;
        if (item.checkedAt && item.checkedAt > val.lastBought) val.lastBought = item.checkedAt;
        merged = true;
        break;
      }
    }

    if (!merged) {
      freqMap.set(key, {
        originalName: item.productName,
        category: item.category,
        count: 1,
        lastBought: item.checkedAt || new Date(),
      });
    }
  }

  // Filter for frequent items only
  const frequent = Array.from(freqMap.values())
    .filter(f => f.count >= minFrequency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Cap at 15 alerts to avoid overwhelming

  // If a specific list is provided, filter out items already present (unchecked)
  if (data?.listId) {
    const list = await db.shoppingList.findFirst({
      where: { id: data.listId, householdId, status: 'active' },
      include: { items: { where: { isChecked: false } } },
    });

    if (list) {
      const uncheckedNames = list.items.map(i => i.productName);

      return frequent
        .filter(f => {
          // Item is NOT in the current unchecked list
          const isInList = uncheckedNames.some(name => isSameProduct(name, f.originalName));
          return !isInList;
        })
        .map(f => ({
          productName: f.originalName,
          category: f.category,
          purchaseCount: f.count,
          lastBoughtAt: f.lastBought.toISOString(),
          daysSinceLastPurchase: Math.floor(
            (Date.now() - f.lastBought.getTime()) / (1000 * 60 * 60 * 24)
          ),
        }));
    }
  }

  // No list filter — return all frequent items
  return frequent.map(f => ({
    productName: f.originalName,
    category: f.category,
    purchaseCount: f.count,
    lastBoughtAt: f.lastBought.toISOString(),
    daysSinceLastPurchase: Math.floor(
      (Date.now() - f.lastBought.getTime()) / (1000 * 60 * 60 * 24)
    ),
  }));
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — EXTERNAL RECIPES (TheMealDB)
// ─────────────────────────────────────────────────────────

export interface ExternalRecipeBrief {
  id: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  area: string | null;
  ingredients: string[];
  estimatedDifficulty: string;
  source: 'external';
}

/**
 * Get contextual recipe suggestions from TheMealDB.
 * Uses time-of-day and season for relevance.
 */
export async function getExternalRecipeSuggestions(): Promise<ExternalRecipeBrief[]> {
  const { suggestHybridRecipe } = await import('@/actions/themealdb-recipes');
  const hour = new Date().getHours();
  const suggestions = await suggestHybridRecipe(hour);

  return suggestions.map(s => ({
    id: s.recipe.id,
    title: s.recipe.title,
    thumbnail: s.recipe.thumbnail,
    category: s.recipe.category,
    area: s.recipe.area,
    ingredients: s.recipe.ingredients.map(ing => {
      // ExternalMeal ingredients are {name, measure} objects
      const name = typeof ing === 'object' && ing !== null && 'name' in ing
        ? String((ing as { name: string }).name)
        : String(ing);
      return name;
    }).filter(n => n.trim().length > 0),
    estimatedDifficulty: s.recipe.estimatedDifficulty,
    source: 'external' as const,
  }));
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — AI SUGGESTIONS
// ─────────────────────────────────────────────────────────

export interface AISuggestion {
  productName: string;
  category: string;
  reason: string;
}

/**
 * Get AI-powered shopping suggestions based on history + season.
 * Uses z-ai-web-dev-sdk (server-side only).
 */
export async function getAISuggestions(listId: string): Promise<AISuggestion[]> {
  const { householdId } = await getAuthUser();

  // Get last 5 completed shopping lists
  const pastLists = await db.shoppingList.findMany({
    where: { householdId, status: 'completed' },
    include: { items: { where: { isChecked: true } } },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  // Build item summary from history
  const recentItems = pastLists.flatMap(l => l.items).slice(0, 30);
  const itemsSummary = recentItems.map(i => `${i.productName} (${i.category || 'autre'})`).join(', ');

  // Get current list unchecked items to exclude
  const currentList = await db.shoppingList.findFirst({
    where: { id: listId, householdId },
    include: { items: { where: { isChecked: false } } },
  });
  const currentItems = currentList?.items.map(i => i.productName.toLowerCase()) || [];

  // Determine season
  const month = new Date().getMonth();
  const season = month >= 2 && month <= 4 ? 'printemps' : month >= 5 && month <= 7 ? 'été' : month >= 8 && month <= 10 ? 'automne' : 'hiver';

  if (!itemsSummary) {
    return [];
  }

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant courses intelligent. Tu suggests des articles de courses manquants basés sur l'historique d'achats et la saison. Réponds UNIQUEMENT en JSON valide, un tableau de 5 objets: [{"productName": "...", "category": "légumes|viande|produits laitiers|boulangerie|boissons|surgelés|hygiène|nettoyage|alimentaire|condiments|autre", "reason": "courte raison en français"}]. Pas de texte autour du JSON.`,
        },
        {
          role: 'user',
          content: `Saison actuelle: ${season}.\nHistorique d'achats récents: ${itemsSummary}\nArticles déjà dans la liste: ${currentItems.join(', ') || 'aucun'}\nSuggère 5 articles fréquents qui manquent. Ne suggère pas d'articles déjà dans la liste.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || '';
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 5).map((item: Record<string, string>) => ({
      productName: String(item.productName || '').trim(),
      category: String(item.category || 'autre').trim(),
      reason: String(item.reason || '').trim(),
    })).filter(s => s.productName.length > 0);
  } catch (err) {
    console.error('[SmartShop] AI suggestions error:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — PRICE HISTORY
// ─────────────────────────────────────────────────────────

export interface PriceTrend {
  prices: Array<{ priceCents: number; recordedAt: string }>;
  trend: 'up' | 'down' | 'stable';
  avgPriceCents: number;
  currentPriceCents: number;
  historyCount: number;
}

/**
 * Get price trend for a barcode.
 */
export async function getPriceTrend(barcode: string): Promise<PriceTrend> {
  const { householdId } = await getAuthUser();

  const history = await db.priceHistory.findMany({
    where: { householdId, barcode },
    orderBy: { recordedAt: 'desc' },
    take: 20,
  });

  if (history.length < 2) {
    return {
      prices: history.map(h => ({ priceCents: h.priceCents, recordedAt: h.recordedAt.toISOString() })),
      trend: 'stable',
      avgPriceCents: history[0]?.priceCents || 0,
      currentPriceCents: history[0]?.priceCents || 0,
      historyCount: history.length,
    };
  }

  const prices = history.map(h => ({ priceCents: h.priceCents, recordedAt: h.recordedAt.toISOString() }));
  const avg = Math.round(prices.reduce((s, p) => s + p.priceCents, 0) / prices.length);
  const latest = prices[0].priceCents;
  const previous = prices[1].priceCents;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (latest > previous * 1.03) trend = 'up';
  else if (latest < previous * 0.97) trend = 'down';

  return { prices, trend, avgPriceCents: avg, currentPriceCents: latest, historyCount: history.length };
}

/**
 * Record a price for a barcode item.
 */
export async function recordPrice(data: {
  barcode: string;
  productName: string;
  priceCents: number;
  storeName?: string;
}) {
  const { householdId } = await getAuthUser();

  return db.priceHistory.create({
    data: {
      householdId,
      barcode: data.barcode,
      productName: data.productName.trim(),
      priceCents: data.priceCents,
      storeName: data.storeName || null,
    },
  });
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────

/**
 * Send push notification for stock alerts.
 */
export async function sendStockAlertPush(listId: string) {
  const { householdId } = await getAuthUser();

  const alerts = await getStockAlerts({ listId, daysBack: 30, minFrequency: 2 });
  if (alerts.length === 0) {
    return { sent: false, alertCount: 0 };
  }

  try {
    const { sendPushToHousehold } = await import('@/lib/push-service');
    const names = alerts.slice(0, 5).map(a => a.productName).join(', ');
    const suffix = alerts.length > 5 ? ` et ${alerts.length - 5} autres` : '';

    const result = await sendPushToHousehold(
      householdId,
      '🛒 Réassort suggéré',
      `${alerts.length} articles fréquents manquants : ${names}${suffix}`,
    );

    return { sent: result.success, alertCount: alerts.length };
  } catch {
    return { sent: false, alertCount: alerts.length };
  }
}

/**
 * Check budget threshold and send push if over 80%.
 */
export async function checkBudgetThreshold(listId: string) {
  const { householdId } = await getAuthUser();

  const list = await db.shoppingList.findFirst({
    where: { id: listId, householdId },
  });
  if (!list || list.budgetCents <= 0) {
    return { sent: false, percent: 0 };
  }

  const pct = Math.round((list.spentCents / list.budgetCents) * 100);
  if (pct < 80) {
    return { sent: false, percent: pct };
  }

  try {
    const { sendPushToHousehold } = await import('@/lib/push-service');
    const result = await sendPushToHousehold(
      householdId,
      '💰 Budget presque atteint',
      `Votre liste "${list.name}" a atteint ${pct}% du budget (${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(list.spentCents / 100)} / ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(list.budgetCents / 100)})`,
    );
    return { sent: result.success, percent: pct };
  } catch {
    return { sent: false, percent: pct };
  }
}
