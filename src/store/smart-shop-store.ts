import { create } from 'zustand';

/* ═══════════════════════════════════════════════════════
   SMART SHOP — Zustand Store

   Client-side state management for shopping lists,
   budget tracking, and partner stores.

   All Date fields are serialised as strings for the client.
   ═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// TYPES (matching Prisma models, Date→string)
// ─────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  householdId: string;
  listId: string;
  barcode: string | null;
  productName: string;
  brand: string | null;
  priceCents: number;
  quantity: number;
  unit: string;
  category: string | null;
  imageUrl: string | null;
  isChecked: boolean;
  checkedAt: string | null;
  suggestedBy: string;
  linkedStoreId: string | null;
  notes: string | null;
  scannedAt: string;
  createdAt: string;
  updatedAt: string;
  linkedStore?: { id: string; name: string; logo: string | null; deepLinkTemplate?: string | null } | null;
}

export interface ShoppingList {
  id: string;
  householdId: string;
  name: string;
  budgetCents: number;
  spentCents: number;
  storeName: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
  _count?: { items: number };
}

export interface PartnerStore {
  id: string;
  householdId: string;
  name: string;
  logo: string | null;
  deliveryApiEndpoint: string | null;
  categoriesMapping: string;
  deepLinkTemplate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────
// STORE STATE & ACTIONS
// ─────────────────────────────────────────────────────────

interface SmartShopState {
  /** The currently active/open shopping list (with items) */
  activeList: ShoppingList | null;
  /** All shopping lists for the household (no items, just metadata + _count) */
  lists: ShoppingList[];
  /** Partner stores available for deep links / delivery */
  partnerStores: PartnerStore[];
  /** Global loading flag for async operations */
  isLoading: boolean;
  /** Budget usage percentage (0–100) for the active list */
  budgetPercent: number;
  /** Number of checked items in the active list */
  checkedCount: number;
  /** Total number of items in the active list */
  totalCount: number;

  // ── Setters ──
  setActiveList: (list: ShoppingList | null) => void;
  setLists: (lists: ShoppingList[]) => void;
  setPartnerStores: (stores: PartnerStore[]) => void;
  setLoading: (loading: boolean) => void;

  // ── Computed ──
  recalcBudgetPercent: () => void;

  // ── Local mutations (optimistic UI) ──
  addItem: (item: ShoppingListItem) => void;
  removeItem: (itemId: string) => void;
  updateItemLocal: (itemId: string, updates: Partial<ShoppingListItem>) => void;
  toggleItemLocal: (itemId: string) => void;
}

export const useSmartShopStore = create<SmartShopState>((set, get) => ({
  activeList: null,
  lists: [],
  partnerStores: [],
  isLoading: false,
  budgetPercent: 0,
  checkedCount: 0,
  totalCount: 0,

  // ── Setters ──

  setActiveList: (list) => {
    set({ activeList: list });
    get().recalcBudgetPercent();
  },

  setLists: (lists) => set({ lists }),

  setPartnerStores: (stores) => set({ partnerStores: stores }),

  setLoading: (isLoading) => set({ isLoading }),

  // ── Computed ──

  recalcBudgetPercent: () => {
    const { activeList } = get();
    if (!activeList || activeList.budgetCents <= 0) {
      set({ budgetPercent: 0 });
      return;
    }
    const pct = Math.min(100, (activeList.spentCents / activeList.budgetCents) * 100);
    set({ budgetPercent: pct });
  },

  // ── Local mutations (optimistic updates before server confirms) ──

  addItem: (item) => {
    const { activeList } = get();
    if (!activeList) return;

    const updatedItems = [...activeList.items, item];
    const checkedItems = updatedItems.filter((i) => i.isChecked);
    const newSpent = checkedItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);

    set({
      activeList: { ...activeList, items: updatedItems, spentCents: newSpent },
      checkedCount: checkedItems.length,
      totalCount: updatedItems.length,
    });
    get().recalcBudgetPercent();
  },

  removeItem: (itemId) => {
    const { activeList } = get();
    if (!activeList) return;

    const updatedItems = activeList.items.filter((i) => i.id !== itemId);
    const checkedItems = updatedItems.filter((i) => i.isChecked);
    const newSpent = checkedItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);

    set({
      activeList: { ...activeList, items: updatedItems, spentCents: newSpent },
      checkedCount: checkedItems.length,
      totalCount: updatedItems.length,
    });
    get().recalcBudgetPercent();
  },

  updateItemLocal: (itemId, updates) => {
    const { activeList } = get();
    if (!activeList) return;

    const updatedItems = activeList.items.map((i) =>
      i.id === itemId ? { ...i, ...updates } : i
    );
    // Recalc spent from checked items
    const checkedItems = updatedItems.filter((i) => i.isChecked);
    const newSpent = checkedItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);

    set({
      activeList: { ...activeList, items: updatedItems, spentCents: newSpent },
      checkedCount: checkedItems.length,
      totalCount: updatedItems.length,
    });
    get().recalcBudgetPercent();
  },

  toggleItemLocal: (itemId) => {
    const { activeList } = get();
    if (!activeList) return;

    const now = new Date().toISOString();

    const updatedItems = activeList.items.map((i) => {
      if (i.id !== itemId) return i;
      const isChecked = !i.isChecked;
      return {
        ...i,
        isChecked,
        checkedAt: isChecked ? now : null,
      };
    });

    // Recalc spent from checked items
    const checkedItems = updatedItems.filter((i) => i.isChecked);
    const newSpent = checkedItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);

    set({
      activeList: { ...activeList, items: updatedItems, spentCents: newSpent },
      checkedCount: checkedItems.length,
      totalCount: updatedItems.length,
    });
    get().recalcBudgetPercent();
  },
}));

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

/** Categories used for sorting and filtering in the UI */
export const CATEGORIES = [
  'légumes',
  'fruits',
  'viande',
  'poisson',
  'produits laitiers',
  'boulangerie',
  'boissons',
  'surgelés',
  'hygiène',
  'nettoyage',
  'alimentaire',
  'condiments',
  'autre',
] as const;

/** Format cents to EUR display string (e.g. 399 → "3,99 €") */
export function centsToEuro(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Get budget colour classes based on usage percentage.
 * < 60% → green, 60–85% → amber, > 85% → red
 */
export function getBudgetColor(percent: number): { bg: string; text: string; border: string } {
  if (percent < 60) {
    return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' };
  }
  if (percent < 85) {
    return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' };
  }
  return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
}

/** Return an emoji for a given shopping category */
export function getCategoryIcon(category: string | null | undefined): string {
  const icons: Record<string, string> = {
    légumes: '🥬',
    fruits: '🍎',
    viande: '🥩',
    poisson: '🐟',
    'produits laitiers': '🧀',
    boulangerie: '🥖',
    boissons: '🥤',
    surgelés: '🧊',
    hygiène: '🧴',
    nettoyage: '🧹',
    alimentaire: '🍽️',
    condiments: '🧂',
    autre: '🛒',
  };
  return (category && icons[category]) || '🛒';
}

/** Return a French label for the suggestedBy source */
export function getSuggestedByLabel(suggestedBy: string | null | undefined): string {
  const labels: Record<string, string> = {
    user: 'Ajouté par vous',
    ai: 'Suggestion IA',
    recipe: 'Recette',
    voice: 'Voix',
    routine: 'Routine',
  };
  return (suggestedBy && labels[suggestedBy]) || 'Ajouté par vous';
}
