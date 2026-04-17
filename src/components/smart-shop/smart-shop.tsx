'use client';

/* ═══════════════════════════════════════════════════════
   SMART SHOP — Tactile Shopping List System
   Luxury dark theme · Maison Consciente / Maellis
   Layout: Sidebar + Main Content
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Plus,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Package,
  Camera,
  X,
  Edit3,
  Archive,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Loader2,
  StickyNote,
  ChefHat,
  AlertTriangle,
  Search,
  Zap,
  Sparkles,
  Bell,
  BellRing,
  Globe,
  ExternalLink,
  Minus,
  Tag,
  Truck,
} from 'lucide-react';
import BarcodeScannerModal from '@/components/shared/barcode-scanner-modal';
import { CategoryChart } from '@/components/smart-shop/category-chart';
import { AlternativesPanel } from '@/components/smart-shop/alternatives-panel';
import { exportListCSV, exportListTXT } from '@/lib/smart-shop-export';
import { triggerHaptic } from '@/lib/haptic';
import {
  useSmartShopStore,
  centsToEuro,
  getBudgetColor,
  getCategoryIcon,
  getSuggestedByLabel,
  CATEGORIES,
  type ShoppingListItem,
  type ShoppingList,
} from '@/store/smart-shop-store';

/* ═══════════════════════════════════════════════════════
   UNIT OPTIONS
   ═══════════════════════════════════════════════════════ */

const UNIT_OPTIONS = ['pièce', 'kg', 'litre', 'pack', 'boîte', 'sachet'] as const;

/* ═══════════════════════════════════════════════════════
   SUGGESTED-BY BADGE COLORS
   ═══════════════════════════════════════════════════════ */

function getSuggestedByStyle(suggestedBy: string | null | undefined): string {
  switch (suggestedBy) {
    case 'ai':
      return 'bg-purple-500/20 text-purple-400';
    case 'voice':
      return 'bg-blue-500/20 text-blue-400';
    case 'recipe':
      return 'bg-green-500/20 text-green-400';
    case 'promo':
      return 'bg-rose-500/20 text-rose-400';
    default:
      return 'bg-white/[0.06] text-[#94a3b8]';
  }
}

/* ═══════════════════════════════════════════════════════
   BUDGET PROGRESS BAR
   ═══════════════════════════════════════════════════════ */

function BudgetProgressBar({
  budgetCents,
  spentCents,
}: {
  budgetCents: number;
  spentCents: number;
}) {
  const pct = budgetCents > 0 ? Math.min(100, (spentCents / budgetCents) * 100) : 0;
  const colors = getBudgetColor(pct);
  const remaining = Math.max(0, budgetCents - spentCents);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className={`w-4 h-4 ${colors.text}`} />
          <span className="text-sm font-medium text-foreground">Budget</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${colors.text}`}>
            {centsToEuro(spentCents)}
          </span>
          <span className="text-xs text-[#64748b]">
            {' '}
            / {centsToEuro(budgetCents)}
          </span>
        </div>
      </div>
      <div className="relative h-3 rounded-full bg-black/40 border border-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full ${colors.bg}`}
        />
        {pct >= 85 && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-red-500/20"
          />
        )}
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-emerald-400/70">
          {centsToEuro(remaining)} restant
        </span>
        <span className={colors.text}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIST CARD (Sidebar)
   ═══════════════════════════════════════════════════════ */

function ListCard({
  list,
  isActive,
  onClick,
  onDelete,
}: {
  list: ShoppingList;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const totalItems = list.items?.length || list._count?.items || 0;
  const checkedItems = list.items?.filter((i) => i.isChecked).length || 0;
  const progressPct = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const statusConfig: Record<string, { label: string; cls: string }> = {
    active: {
      label: 'En cours',
      cls: 'bg-emerald-500/20 text-emerald-400',
    },
    completed: {
      label: 'Terminée',
      cls: 'bg-blue-500/20 text-blue-400',
    },
    archived: {
      label: 'Archivée',
      cls: 'bg-white/[0.06] text-[#64748b]',
    },
  };
  const st = statusConfig[list.status] || statusConfig.active;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`
        group relative p-3 rounded-xl border cursor-pointer transition-all duration-300
        ${
          isActive
            ? 'glass-gold border-amber-500/30 shadow-[0_0_20px_var(--accent-primary-glow)]'
            : 'glass border-white/[0.06] hover:border-white/[0.12]'
        }
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {list.name}
          </p>
          {list.storeName && (
            <p className="text-[10px] text-[#64748b] truncate">{list.storeName}</p>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2 ${st.cls}`}>
          {st.label}
        </span>
      </div>

      {/* Progress bar (checked / total) */}
      <div className="h-1.5 rounded-full bg-black/30 overflow-hidden mb-1.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
          className="h-full rounded-full bg-emerald-500"
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#64748b]">
          {checkedItems}/{totalItems} articles
        </span>
        {list.budgetCents > 0 && (
          <span
            className={`font-medium ${
              list.spentCents > list.budgetCents
                ? 'text-red-400'
                : 'text-amber-400'
            }`}
          >
            {centsToEuro(list.spentCents)}
          </span>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIST ITEM ROW
   ═══════════════════════════════════════════════════════ */

function ListItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
  partnerStores,
}: {
  item: ShoppingListItem;
  onToggle: (itemId: string) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (itemId: string) => void;
  partnerStores: Array<{ name: string; deepLinkTemplate: string | null }>;
}) {
  // Build deep link from first available partner store
  const deepLink = (() => {
    if (!item.linkedStore?.deepLinkTemplate) {
      const store = partnerStores.find(s => s.deepLinkTemplate);
      if (!store) return null;
      return store.deepLinkTemplate!.replace('{query}', encodeURIComponent(item.productName));
    }
    return item.linkedStore.deepLinkTemplate.replace('{query}', encodeURIComponent(item.productName));
  })();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      className={`
        group flex items-center gap-3 px-3 rounded-lg border transition-colors
        ${item.isChecked
          ? 'bg-black/10 border-white/[0.03] py-1.5'
          : 'bg-black/20 border-white/[0.06] hover:border-white/[0.12] py-3'
        }
      `}
      style={{ minHeight: 52 }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        className={`
          shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
          ${item.isChecked
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-white/[0.12] hover:border-emerald-500/50'
          }
        `}
      >
        {item.isChecked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </motion.div>
        )}
      </button>

      {/* Category icon */}
      <span className="text-base shrink-0">{getCategoryIcon(item.category)}</span>

      {/* Name + brand */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate transition-all duration-200 ${
            item.isChecked
              ? 'line-through text-[#64748b]'
              : 'text-[#e2e8f0]'
          }`}
        >
          {item.productName}
        </p>
        {item.brand && (
          <p className="text-[10px] text-[#64748b] truncate">{item.brand}</p>
        )}
      </div>

      {/* Quantity badge */}
      {(item.quantity > 1 || item.unit !== 'pièce') && (
        <span className="text-[10px] text-[#94a3b8] bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
          {item.quantity} {item.unit}
        </span>
      )}

      {/* Price */}
      {item.priceCents > 0 && (
        <span className="text-sm text-amber-400 font-medium shrink-0">
          {centsToEuro(item.priceCents * item.quantity)}
        </span>
      )}

      {/* SuggestedBy badge */}
      {item.suggestedBy && item.suggestedBy !== 'user' && (
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${getSuggestedByStyle(item.suggestedBy)}`}
        >
          {getSuggestedByLabel(item.suggestedBy)}
        </span>
      )}

      {/* Notes tooltip indicator */}
      {item.notes && (
        <span className="shrink-0 text-[#64748b] relative group/notes">
          <StickyNote className="w-3.5 h-3.5" />
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-black/90 border border-white/[0.08] text-[10px] text-[#e2e8f0] whitespace-nowrap opacity-0 group-hover/notes:opacity-100 transition-opacity pointer-events-none z-10 max-w-[200px] break-words whitespace-normal">
            {item.notes}
          </span>
        </span>
      )}

      {/* Price trend arrow for items with barcode */}
      {item.barcode && !item.isChecked && (
        <PriceTrendIndicator barcode={item.barcode} priceTrend={null} />
      )}

      {/* Edit + Delete + Deep-link — visible on hover */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {deepLink && !item.isChecked && (
          <button
            onClick={(e) => { e.stopPropagation(); window.open(deepLink, '_blank', 'noopener'); triggerHaptic('light'); }}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="Commander en ligne"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-[#64748b] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   CREATE LIST MODAL
   ═══════════════════════════════════════════════════════ */

function CreateListModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (list: ShoppingList) => void;
}) {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [store, setStore] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const budgetCents = budget.trim()
        ? Math.round(parseFloat(budget) * 100)
        : 0;
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-list',
          name: name.trim() || undefined,
          budgetCents,
          storeName: store.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onCreated(data.list);
        triggerHaptic('success');
        toast.success('Liste créée');
      }
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[#475569] focus:outline-none focus:border-amber-500/30 transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl p-6 w-full max-w-sm border border-white/[0.08]"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-serif font-semibold text-amber-50">
            Nouvelle liste de courses
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748b] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Courses Carrefour..."
              className={inputCls}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">
              Budget (EUR — optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50"
                min="1"
                step="5"
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748b]">
                EUR
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">
              Magasin (optionnel)
            </label>
            <input
              value={store}
              onChange={(e) => setStore(e.target.value)}
              placeholder="Carrefour, Lidl..."
              className={inputCls}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleCreate()}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-600/40 disabled:to-emerald-500/40 text-white py-3 rounded-xl font-medium text-sm transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              'Créer la liste'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   QUICK ADD BAR
   ═══════════════════════════════════════════════════════ */

function QuickAddBar({
  onAdd,
  onOpenScanner,
  disabled,
}: {
  onAdd: (data: {
    productName: string;
    brand?: string;
    priceCents: number;
    quantity: number;
    unit: string;
    category: string;
    barcode?: string;
    suggestedBy?: string;
  }) => Promise<void>;
  onOpenScanner: () => void;
  disabled?: boolean;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pièce');
  const [category, setCategory] = useState('autre');
  const [price, setPrice] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || adding) return;
    setAdding(true);
    try {
      await onAdd({
        productName: name.trim(),
        priceCents: price.trim() ? Math.round(parseFloat(price) * 100) : 0,
        quantity: parseInt(quantity) || 1,
        unit,
        category,
        suggestedBy: 'user',
      });
      setName('');
      setPrice('');
      setQuantity('1');
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const selectCls =
    'bg-black/30 border border-white/[0.08] rounded-lg px-2 py-2 text-xs text-[#e2e8f0] focus:outline-none focus:border-amber-500/30 appearance-none cursor-pointer';
  const inputCls =
    'bg-black/30 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder-[#475569] focus:outline-none focus:border-emerald-500/30 transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Product name */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Produit..."
        className={`flex-1 min-w-[140px] ${inputCls}`}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {/* Quantity */}
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="1"
        className={`w-16 text-center ${inputCls}`}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {/* Unit select */}
      <select
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        className={selectCls}
        disabled={disabled}
      >
        {UNIT_OPTIONS.map((u) => (
          <option key={u} value={u} className="bg-[#0a0a0f]">
            {u}
          </option>
        ))}
      </select>

      {/* Category select */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className={selectCls}
        disabled={disabled}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c} className="bg-[#0a0a0f]">
            {getCategoryIcon(c)} {c}
          </option>
        ))}
      </select>

      {/* Price */}
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Prix"
        step="0.01"
        min="0"
        className={`w-20 ${inputCls}`}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAdd}
        disabled={!name.trim() || adding || disabled}
        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white transition-colors shrink-0"
        title="Ajouter"
      >
        {adding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </motion.button>

      {/* Scanner button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onOpenScanner}
        disabled={disabled}
        className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-amber-500/5 text-amber-400 disabled:text-amber-400/40 border border-amber-500/20 transition-colors shrink-0"
        title="Scanner un code-barres"
      >
        <Camera className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS TYPE
   ═══════════════════════════════════════════════════════ */

interface MonthlyStats {
  totalLists: number;
  completedLists: number;
  totalSpent: number;
  avgPerList: number;
  categoryBreakdown: Array<{ category: string; amountCents: number }>;
}

/* ═══════════════════════════════════════════════════════
   PHASE 2 — Types
   ═══════════════════════════════════════════════════════ */

interface StockAlertItem {
  productName: string;
  category: string | null;
  purchaseCount: number;
  lastBoughtAt: string;
  daysSinceLastPurchase: number;
}

interface RecipeResult {
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
  matchReason?: string;
}

interface RecipeMatchData {
  recipeId: string;
  totalIngredients: number;
  alreadyInList: string[];
  missingIngredients: Array<{
    original: string;
    productName: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
}

/* ═══════════════════════════════════════════════════════
   PHASE 3 — Types
   ═══════════════════════════════════════════════════════ */

interface PriceTrendData {
  barcode: string;
  prices: Array<{ priceCents: number; recordedAt: string }>;
  trend: 'up' | 'down' | 'stable';
  avgPriceCents: number;
  minPriceCents: number;
  maxPriceCents: number;
}

interface AISuggestion {
  productName: string;
  category: string;
  reason: string;
  confidence: number;
}

interface ExternalRecipeResult {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  area: string | null;
  category: string | null;
  tags: string[];
  ingredients: string[];
  instructions: string;
}

/* ═══════════════════════════════════════════════════════
   PHASE 3 — PRICE TREND INDICATOR
   ═══════════════════════════════════════════════════════ */

function PriceTrendIndicator({ barcode, priceTrend }: { barcode: string; priceTrend: PriceTrendData | null }) {
  const [trend, setTrend] = useState<PriceTrendData | null>(priceTrend);
  const [loading, setLoading] = useState(!priceTrend);

  useEffect(() => {
    if (priceTrend) { setTrend(priceTrend); setLoading(false); return; }
    if (!barcode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'price-trend', barcode }),
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTrend(data.trend || null);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [barcode, priceTrend]);

  if (loading) return <Loader2 className="w-3 h-3 text-[#475569] animate-spin shrink-0" />;
  if (!trend || trend.trend === 'stable') return null;

  const isUp = trend.trend === 'up';
  return (
    <span className="shrink-0 relative group/trend" title={`${isUp ? 'Prix en hausse' : 'Prix en baisse'} — moy. ${centsToEuro(trend.avgPriceCents)}`}>
      {isUp
        ? <TrendingUp className="w-3.5 h-3.5 text-red-400" />
        : <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
      }
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-black/90 border border-white/[0.08] text-[9px] text-[#e2e8f0] whitespace-nowrap opacity-0 group-hover/trend:opacity-100 transition-opacity pointer-events-none z-10">
        {trend.prices.length} relevés · moy. {centsToEuro(trend.avgPriceCents)}
      </span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   PHASE 3 — AI SUGGESTIONS PANEL
   ═══════════════════════════════════════════════════════ */

function AISuggestionsPanel({
  listId,
  onAddItem,
}: {
  listId: string;
  onAddItem: (data: {
    productName: string;
    priceCents: number;
    quantity: number;
    unit: string;
    category: string;
    suggestedBy: string;
  }) => Promise<void>;
}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-suggestions', listId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [listId]);

  const handleRefresh = useCallback(() => {
    setCollapsed(false);
    setAddedItems(new Set());
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAdd = useCallback(async (suggestion: AISuggestion) => {
    setAddedItems(prev => new Set(prev).add(suggestion.productName));
    try {
      await onAddItem({
        productName: suggestion.productName,
        priceCents: 0,
        quantity: 1,
        unit: 'pièce',
        category: suggestion.category || 'autre',
        suggestedBy: 'ai',
      });
      triggerHaptic('success');
      toast.success(`${suggestion.productName} ajouté (IA)`);
    } catch {
      setAddedItems(prev => { const n = new Set(prev); n.delete(suggestion.productName); return n; });
    }
  }, [onAddItem]);

  return (
    <div className="glass rounded-xl overflow-hidden inner-glow">
      <button
        onClick={() => { if (collapsed) handleRefresh(); else setCollapsed(true); }}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/10 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-medium text-foreground">Suggestions IA</span>
          {suggestions.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-semibold">{suggestions.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!collapsed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
              className="p-1 rounded text-[#64748b] hover:text-purple-400 transition-colors"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-[9px]">Refresh</span>}
            </motion.button>
          )}
          <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 max-h-56 overflow-y-auto scrollbar-luxe">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="ml-2 text-[10px] text-[#64748b]">Analyse en cours...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-4">
                  <Sparkles className="w-5 h-5 text-[#475569] mx-auto mb-1.5" />
                  <p className="text-xs text-[#64748b]">Aucune suggestion disponible</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {suggestions.map((s, i) => (
                    <motion.div key={s.productName} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                    >
                      <span className="text-sm shrink-0">{getCategoryIcon(s.category)}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-[#e2e8f0] truncate block">{s.productName}</span>
                        <span className="text-[9px] text-[#64748b] truncate block">{s.reason}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 shrink-0">{Math.round(s.confidence * 100)}%</span>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => handleAdd(s)} disabled={addedItems.has(s.productName)}
                        className="p-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 disabled:opacity-30 transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHASE 2 — RECIPE MATCHER MODAL (enhanced with External tab)
   ═══════════════════════════════════════════════════════ */

function RecipeMatcherModal({
  listId,
  onClose,
  onInjected,
}: {
  listId: string;
  onClose: () => void;
  onInjected: () => void;
}) {
  const [recipeTab, setRecipeTab] = useState<'local' | 'external'>('local');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecipeResult[]>([]);
  const [externalResults, setExternalResults] = useState<ExternalRecipeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeResult | null>(null);
  const [matchData, setMatchData] = useState<RecipeMatchData | null>(null);
  const [matching, setMatching] = useState(false);
  const [injecting, setInjecting] = useState(false);

  // Search local recipes
  const handleSearch = useCallback(async () => {
    setSearching(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recipe-search', query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.recipes || []);
      }
    } catch {
      toast.error('Erreur lors de la recherche');
    } finally {
      setSearching(false);
    }
  }, [query]);

  // Search external recipes (TheMealDB)
  const handleExternalSearch = useCallback(async () => {
    setSearching(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recipe-external', query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setExternalResults(data.recipes || []);
      }
    } catch {
      toast.error('Erreur lors de la recherche externe');
    } finally {
      setSearching(false);
    }
  }, [query]);

  // Combined search based on active tab
  const handleSearchAll = useCallback(() => {
    if (recipeTab === 'external') handleExternalSearch();
    else handleSearch();
  }, [recipeTab, handleSearch, handleExternalSearch]);

  // Auto-search on mount
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // Match recipe against list (works for both local & external)
  const handleMatch = useCallback(async (recipe: RecipeResult) => {
    setSelectedRecipe(recipe);
    setMatching(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recipe-match',
          listId,
          recipeId: recipe.id,
          ingredients: recipe.ingredients,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchData(data.match || null);
        triggerHaptic('medium');
      }
    } catch {
      toast.error('Erreur lors du matching');
    } finally {
      setMatching(false);
    }
  }, [listId]);

  // Match external recipe
  const handleMatchExternal = useCallback(async (recipe: ExternalRecipeResult) => {
    setSelectedRecipe({
      id: recipe.id, title: recipe.title, description: recipe.description,
      difficulty: '', prepTimeMin: 0, cookTimeMin: 0, servings: 0,
      ingredients: recipe.ingredients, steps: [], tags: recipe.tags || [],
    });
    setMatching(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recipe-match',
          listId,
          recipeId: recipe.id,
          ingredients: recipe.ingredients,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMatchData(data.match || null);
        triggerHaptic('medium');
      }
    } catch {
      toast.error('Erreur lors du matching');
    } finally {
      setMatching(false);
    }
  }, [listId]);

  // Inject missing ingredients
  const handleInject = useCallback(async () => {
    if (!selectedRecipe || !matchData) return;
    setInjecting(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recipe-inject',
          listId,
          recipeTitle: selectedRecipe.title,
          ingredients: matchData.missingIngredients,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        triggerHaptic('success');
        toast.success(
          `${data.injected?.length || 0} ingrédient${(data.injected?.length || 0) > 1 ? 's' : ''} ajouté${(data.injected?.length || 0) > 1 ? 's' : ''}${data.skipped ? ` (${data.skipped} déjà présent${data.skipped > 1 ? 's' : ''})` : ''}`
        );
        onInjected();
        onClose();
      }
    } catch {
      toast.error("Erreur lors de l'injection");
    } finally {
      setInjecting(false);
    }
  }, [selectedRecipe, matchData, listId, onInjected, onClose]);

  // Difficulty color
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facile': return 'bg-emerald-500/20 text-emerald-400';
      case 'moyen': return 'bg-amber-500/20 text-amber-400';
      case 'difficile': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/[0.06] text-[#94a3b8]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-lg border border-white/[0.08] max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <ChefHat className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-amber-50">
                Matcher une recette
              </h3>
              <p className="text-[10px] text-[#64748b]">
                Comparez les ingrédients avec votre liste
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Locales / Externes */}
        {!selectedRecipe && (
          <div className="flex items-center gap-2 px-5 pt-4 shrink-0">
            <button
              onClick={() => setRecipeTab('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipeTab === 'local' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-[#64748b] border border-white/[0.06] hover:border-white/[0.12]'}`}
            >
              <ChefHat className="w-3 h-3" /> Locales
            </button>
            <button
              onClick={() => { setRecipeTab('external'); if (externalResults.length === 0) handleExternalSearch(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipeTab === 'external' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-[#64748b] border border-white/[0.06] hover:border-white/[0.12]'}`}
            >
              <Globe className="w-3 h-3" /> Externes
            </button>
          </div>
        )}

        {/* Search bar */}
        {!selectedRecipe && (
          <div className="px-5 pt-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={recipeTab === 'external' ? 'Rechercher sur TheMealDB...' : 'Rechercher une recette...'}
                  className="w-full bg-black/30 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder-[#475569] focus:outline-none focus:border-amber-500/30 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAll()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearchAll}
                disabled={searching}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors shrink-0"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-luxe">
          {/* Recipe results list */}
          {!selectedRecipe && recipeTab === 'local' && (
            <div className="space-y-2">
              {searchResults.length === 0 && !searching && (
                <div className="text-center py-8">
                  <ChefHat className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                  <p className="text-xs text-[#64748b]">
                    Aucune recette trouvée
                  </p>
                </div>
              )}
              {searchResults.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  whileHover={{ scale: 1.005 }}
                  className="group p-3 rounded-xl border border-white/[0.06] hover:border-amber-500/20 bg-black/20 hover:bg-black/30 transition-all cursor-pointer"
                  onClick={() => handleMatch(recipe)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {recipe.title}
                      </p>
                      {recipe.description && (
                        <p className="text-[10px] text-[#64748b] truncate mt-0.5">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getDifficultyStyle(recipe.difficulty)}`}>
                          {recipe.difficulty}
                        </span>
                        <span className="text-[9px] text-[#64748b]">
                          {recipe.prepTimeMin + recipe.cookTimeMin} min
                        </span>
                        <span className="text-[9px] text-[#64748b]">
                          {recipe.servings} pers.
                        </span>
                        <span className="text-[9px] text-amber-400/70">
                          {recipe.ingredients.length} ingrédients
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* External recipe results (TheMealDB) */}
          {!selectedRecipe && recipeTab === 'external' && (
            <div className="space-y-2">
              {externalResults.length === 0 && !searching && (
                <div className="text-center py-8">
                  <Globe className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                  <p className="text-xs text-[#64748b]">
                    Aucune recette externe trouvée
                  </p>
                </div>
              )}
              {externalResults.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  whileHover={{ scale: 1.005 }}
                  className="group p-3 rounded-xl border border-white/[0.06] hover:border-amber-500/20 bg-black/20 hover:bg-black/30 transition-all cursor-pointer"
                  onClick={() => handleMatchExternal(recipe)}
                >
                  <div className="flex items-start gap-3">
                    {recipe.imageUrl && (
                      <img src={recipe.imageUrl} alt={recipe.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {recipe.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {(recipe.area || recipe.category) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {[recipe.area, recipe.category].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        <span className="text-[9px] text-amber-400/70">
                          {recipe.ingredients.length} ingrédients
                        </span>
                        <span className="text-[9px] text-purple-400/70 flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> TheMealDB
                        </span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Matching results */}
          {selectedRecipe && matching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              <span className="ml-2 text-sm text-[#94a3b8]">
                Analyse des ingrédients...
              </span>
            </div>
          )}

          {selectedRecipe && !matching && matchData && (
            <div className="space-y-4">
              {/* Recipe header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <ChefHat className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-semibold text-foreground">
                      {selectedRecipe.title}
                    </h4>
                    <p className="text-[10px] text-[#64748b]">
                      {matchData.totalIngredients} ingrédients au total
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedRecipe(null);
                    setMatchData(null);
                  }}
                  className="p-1.5 rounded-lg text-[#64748b] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Match summary bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-black/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(matchData.alreadyInList.length / matchData.totalIngredients) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-emerald-400 shrink-0">
                  {matchData.alreadyInList.length}/{matchData.totalIngredients}
                </span>
              </div>

              {/* Already in list */}
              {matchData.alreadyInList.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Déjà dans la liste ({matchData.alreadyInList.length})
                  </p>
                  <div className="space-y-1">
                    {matchData.alreadyInList.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-xs text-emerald-300/80 truncate">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing ingredients */}
              {matchData.missingIngredients.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Manquant ({matchData.missingIngredients.length})
                  </p>
                  <div className="space-y-1">
                    {matchData.missingIngredients.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10"
                      >
                        <span className="text-sm shrink-0">{getCategoryIcon(item.category)}</span>
                        <span className="text-xs text-red-300/80 flex-1 truncate">
                          {item.productName}
                        </span>
                        <span className="text-[9px] text-[#64748b] bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                          {item.quantity} {item.unit}
                        </span>
                        <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                          {item.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchData.missingIngredients.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-emerald-400 font-medium">
                    Tous les ingrédients sont déjà dans votre liste !
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — Inject button */}
        {selectedRecipe && matchData && matchData.missingIngredients.length > 0 && (
          <div className="p-5 border-t border-white/[0.06] shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleInject}
              disabled={injecting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-600/40 disabled:to-emerald-500/40 text-white py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
              {injecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Ajouter {matchData.missingIngredients.length} manquant{matchData.missingIngredients.length > 1 ? 's' : ''}
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PHASE 2 — STOCK ALERTS PANEL
   ═══════════════════════════════════════════════════════ */

function StockAlertsPanel({
  listId,
  onAddItem,
  alertCount,
}: {
  listId: string;
  onAddItem: (data: {
    productName: string;
    priceCents: number;
    quantity: number;
    unit: string;
    category: string;
    suggestedBy: string;
  }) => Promise<void>;
  alertCount: number;
}) {
  const [alerts, setAlerts] = useState<StockAlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // Fetch alerts on mount
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'stock-alerts',
            listId,
            daysBack: 30,
            minFrequency: 2,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [listId]);

  const handleQuickAdd = useCallback(async (alert: StockAlertItem) => {
    setAddedItems(prev => new Set(prev).add(alert.productName));
    try {
      await onAddItem({
        productName: alert.productName,
        priceCents: 0,
        quantity: 1,
        unit: 'pièce',
        category: alert.category || 'autre',
        suggestedBy: 'routine',
      });
      triggerHaptic('success');
      toast.success(`${alert.productName} ajouté`);
      // Remove from alerts after adding
      setAlerts(prev => prev.filter(a => a.productName !== alert.productName));
    } catch {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(alert.productName);
        return next;
      });
      toast.error("Erreur lors de l'ajout");
    }
  }, [onAddItem]);

  return (
    <div className="glass rounded-xl overflow-hidden inner-glow">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 rounded-lg">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Suggestions de réassort
          </span>
          {alertCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold">
              {alertCount}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 max-h-48 overflow-y-auto scrollbar-luxe">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="ml-2 text-[10px] text-[#64748b]">
                    Analyse des achats...
                  </span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-xs text-emerald-400/80 font-medium">
                    Tout est à jour
                  </p>
                  <p className="text-[10px] text-[#475569] mt-0.5">
                    Aucun produit fréquent manquant
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={`${alert.productName}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Category icon */}
                      <span className="text-sm shrink-0">
                        {getCategoryIcon(alert.category)}
                      </span>

                      {/* Name */}
                      <span className="text-xs text-[#e2e8f0] flex-1 truncate">
                        {alert.productName}
                      </span>

                      {/* Purchase count badge */}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 shrink-0">
                        ×{alert.purchaseCount}
                      </span>

                      {/* Days since last purchase */}
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[#64748b] shrink-0">
                        {alert.daysSinceLastPurchase}j
                      </span>

                      {/* Quick add button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickAdd(alert)}
                        disabled={addedItems.has(alert.productName)}
                        className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-30 transition-colors shrink-0"
                        title="Ajouter rapidement"
                      >
                        <Plus className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROMO PANEL — Promotions simplifiées
   ═══════════════════════════════════════════════════════ */

interface PromoItem {
  id: string;
  emoji: string;
  productName: string;
  discountPercent: number;
  storeName: string;
  priceCents: number;
  category: string;
  expiresAt: string;
}

const MOCK_PROMOS: PromoItem[] = [
  { id: 'promo-1', emoji: '🥛', productName: 'Lait Bio Demi-écrémé 1L', discountPercent: 20, storeName: 'Carrefour Bio', priceCents: 119, category: 'produits-laitiers', expiresAt: '2025-08-15' },
  { id: 'promo-2', emoji: '🍝', productName: 'Pâtes Barilla Penne Rigate 500g', discountPercent: 30, storeName: 'Intermarché', priceCents: 89, category: 'épicerie', expiresAt: '2025-08-10' },
  { id: 'promo-3', emoji: '🧀', productName: 'Comté AOP 12 mois 200g', discountPercent: 15, storeName: 'Leclerc', priceCents: 349, category: 'crémerie', expiresAt: '2025-08-20' },
  { id: 'promo-4', emoji: '🍞', productName: 'Pain au Levain Artisanal', discountPercent: 25, storeName: 'Boulangerie Paul', priceCents: 199, category: 'boulangerie', expiresAt: '2025-08-08' },
  { id: 'promo-5', emoji: '🫒', productName: 'Huile d\'Olive Extra Vierge 750ml', discountPercent: 20, storeName: 'Auchan', priceCents: 499, category: 'huile-vinaigre', expiresAt: '2025-08-18' },
  { id: 'promo-6', emoji: '🍓', productName: 'Fraises Gariguette 500g', discountPercent: 40, storeName: 'Monoprix', priceCents: 299, category: 'fruits-légumes', expiresAt: '2025-08-06' },
];

function PromoPanel({
  onAddItem,
}: {
  onAddItem: (data: {
    productName: string;
    priceCents: number;
    quantity: number;
    unit: string;
    category: string;
    suggestedBy: string;
  }) => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleAddPromo = useCallback(async (promo: PromoItem) => {
    setAddedItems(prev => new Set(prev).add(promo.id));
    try {
      await onAddItem({
        productName: promo.productName,
        priceCents: promo.priceCents,
        quantity: 1,
        unit: 'pièce',
        category: promo.category,
        suggestedBy: 'promo',
      });
      triggerHaptic('success');
      toast.success(`${promo.productName} ajouté depuis promo`);
    } catch {
      setAddedItems(prev => { const n = new Set(prev); n.delete(promo.id); return n; });
      toast.error("Erreur lors de l'ajout");
    }
  }, [onAddItem]);

  return (
    <div className="glass rounded-xl overflow-hidden inner-glow">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <Tag className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Promotions du moment
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold">
            {MOCK_PROMOS.length}
          </span>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-[#64748b]" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 max-h-64 overflow-y-auto scrollbar-luxe">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOCK_PROMOS.map((promo, i) => (
                  <motion.div
                    key={promo.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative flex items-start gap-2 p-2.5 rounded-xl bg-black/20 border border-white/[0.06] hover:border-rose-500/20 transition-colors"
                  >
                    {/* Discount badge */}
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                      -{promo.discountPercent}%
                    </span>

                    {/* Product emoji */}
                    <span className="text-xl shrink-0 mt-0.5">{promo.emoji}</span>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pr-10">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate leading-tight">
                        {promo.productName}
                      </p>
                      <p className="text-[9px] text-[#64748b] mt-0.5 truncate">
                        {promo.storeName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {centsToEuro(promo.priceCents)}
                        </span>
                        <span className="text-[9px] text-[#475569]">
                          → {centsToEuro(promo.priceCents)}
                        </span>
                      </div>
                    </div>

                    {/* Add button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleAddPromo(promo)}
                      disabled={addedItems.has(promo.id)}
                      className="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-30 transition-colors text-[9px] font-medium"
                    >
                      {addedItems.has(promo.id) ? '✓ Ajouté' : 'Ajouter'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOCK CHECKOUT MODAL — Checkout simulé
   ═══════════════════════════════════════════════════════ */

const MOCK_PARTNER_STORES = [
  'Carrefour Market Centre-ville',
  'Intermarché La Chapelle',
  'Leclerc Saint-Denis',
  'Monoprix République',
  'Auchan La Défense',
];

const DELIVERY_SLOTS = [
  'Aujourd\'hui 17h-19h',
  'Demain 9h-11h',
  'Demain 14h-16h',
];

function MockCheckoutModal({
  activeList,
  onClose,
  onComplete,
}: {
  activeList: ShoppingList;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [selectedStore, setSelectedStore] = useState(MOCK_PARTNER_STORES[0]);
  const [selectedSlot, setSelectedSlot] = useState(DELIVERY_SLOTS[0]);
  const [address, setAddress] = useState('');
  const [sending, setSending] = useState(false);

  // Items non cochés (à commander)
  const uncheckedItems = activeList.items.filter(i => !i.isChecked);
  const totalCents = uncheckedItems.reduce((sum, i) => sum + (i.priceCents * i.quantity), 0);

  const handleConfirm = useCallback(async () => {
    setSending(true);
    // Simulation d'envoi (2 secondes)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSending(false);
    toast.success(`Commande envoyée vers ${selectedStore} — livraison estimée ${selectedSlot}`);
    triggerHaptic('success');
    // Marquer la liste comme terminée
    onComplete();
    onClose();
  }, [selectedStore, selectedSlot, onComplete, onClose]);

  const inputCls =
    'w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[#475569] focus:outline-none focus:border-amber-500/30 transition-colors';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-2xl w-full max-w-md border border-white/[0.08] max-h-[90vh] overflow-hidden"
      >
        {/* Mode démo banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">
            Mode démo — Simulation de commande
          </span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold text-amber-50">
                Confirmer la commande
              </h3>
              <p className="text-[10px] text-[#64748b]">{activeList.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748b] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="px-5 pb-5 overflow-y-auto max-h-[60vh] scrollbar-luxe space-y-4">
          {/* Order summary */}
          <div>
            <p className="text-xs font-medium text-[#94a3b8] mb-2">
              Résumé ({uncheckedItems.length} article{uncheckedItems.length !== 1 ? 's' : ''})
            </p>
            <div className="bg-black/20 rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
              {uncheckedItems.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-[#64748b]">Aucun article à commander</p>
                  <p className="text-[10px] text-[#475569] mt-0.5">Cochez les articles que vous ne voulez pas commander</p>
                </div>
              ) : (
                uncheckedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm shrink-0">{getCategoryIcon(item.category)}</span>
                      <span className="text-xs text-[#e2e8f0] truncate">{item.productName}</span>
                      {item.quantity > 1 && (
                        <span className="text-[9px] text-[#64748b] bg-white/[0.04] px-1 py-0.5 rounded shrink-0">
                          ×{item.quantity}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-amber-400 font-medium shrink-0 ml-2">
                      {item.priceCents > 0 ? centsToEuro(item.priceCents * item.quantity) : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
            {/* Total */}
            {totalCents > 0 && (
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-sm font-medium text-[#94a3b8]">Total estimé</span>
                <span className="text-sm font-semibold text-amber-400">{centsToEuro(totalCents)}</span>
              </div>
            )}
          </div>

          {/* Delivery form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Magasin partenaire</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/30 appearance-none cursor-pointer"
              >
                {MOCK_PARTNER_STORES.map((s) => (
                  <option key={s} value={s} className="bg-[#0a0a0f]">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Créneau de livraison</label>
              <div className="flex flex-col gap-1.5">
                {DELIVERY_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors text-left ${
                      selectedSlot === slot
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-black/20 border-white/[0.06] text-[#94a3b8] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedSlot === slot ? 'border-emerald-400' : 'border-white/[0.12]'
                    }`}>
                      {selectedSlot === slot && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <span className="text-xs font-medium">{slot}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Adresse de livraison</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="12 Rue de la Paix, 75002 Paris"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Footer — Confirm button */}
        <div className="p-5 pt-3 border-t border-white/[0.06] shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={sending || uncheckedItems.length === 0}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-600/40 disabled:to-emerald-500/40 text-white py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Confirmer la commande
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SMART SHOP COMPONENT
   ═══════════════════════════════════════════════════════ */

export function SmartShop() {
  const {
    activeList,
    lists,
    isLoading,
    budgetPercent,
    setActiveList,
    setLists,
    setLoading,
    addItem,
    removeItem,
    updateItemLocal,
    toggleItemLocal,
    recalcBudgetPercent,
    partnerStores,
    setPartnerStores,
  } = useSmartShopStore();

  // ─── Local state ───
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>([]);
  const [stockAlertsLoading, setStockAlertsLoading] = useState(false);
  const [showPromos, setShowPromos] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // ─── Refs ───
  const prevBudgetPercent = useRef(budgetPercent);

  // ─────────────────────────────────────────────────────
  // FETCH LISTS
  // ─────────────────────────────────────────────────────
  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-lists' }),
      });
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
    } catch {
      // silent
    }
  }, [setLists]);

  // ─────────────────────────────────────────────────────
  // FETCH STATS
  // ─────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-stats' }),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || null);
      }
    } catch {
      // silent
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // FETCH STOCK ALERTS
  // ─────────────────────────────────────────────────────
  const fetchStockAlerts = useCallback(async () => {
    if (!activeList || activeList.status !== 'active') return;
    setStockAlertsLoading(true);
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stock-alerts', listId: activeList.id, daysBack: 30, minFrequency: 2 }),
      });
      if (res.ok) {
        const data = await res.json();
        setStockAlerts(data.alerts || []);
      }
    } catch { /* silent */ }
    finally { setStockAlertsLoading(false); }
  }, [activeList]);

  // ─────────────────────────────────────────────────────
  // FETCH PARTNER STORES (Phase 3)
  // ─────────────────────────────────────────────────────
  const fetchPartnerStores = useCallback(async () => {
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-partner-stores' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPartnerStores(data.stores || []);
      }
    } catch { /* silent */ }
  }, [setPartnerStores]);

  // ─────────────────────────────────────────────────────
  // INITIAL LOAD
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchLists();
    fetchStats();
    fetchPartnerStores();
  }, [fetchLists, fetchStats, fetchPartnerStores]);

  // Fetch stock alerts when active list changes
  useEffect(() => {
    if (activeList?.id) {
      fetchStockAlerts();
    }
  }, [activeList?.id, fetchStockAlerts]);

  // ─────────────────────────────────────────────────────
  // LOAD LIST (with items)
  // ─────────────────────────────────────────────────────
  const loadList = useCallback(
    async (listId: string) => {
      setLoading(true);
      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-list', listId }),
        });
        if (res.ok) {
          const data = await res.json();
          setActiveList(data.list);
        }
      } catch {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    },
    [setActiveList, setLoading]
  );

  // ─────────────────────────────────────────────────────
  // PHASE 3 STATE
  // ─────────────────────────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  // ─────────────────────────────────────────────────────
  // SSE REAL-TIME LISTENER (Phase 3)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    const connectSSE = () => {
      if (sseRef.current) return;
      const es = new EventSource('/api/smart-shop/sse');
      es.addEventListener('smart-shop-update', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.listId && activeList?.id === data.listId) {
            if (data.action === 'item-added' || data.action === 'item-toggled' || data.action === 'item-deleted' || data.action === 'recipe-injected') {
              loadList(activeList!.id);
              fetchStockAlerts();
            }
          }
          if (data.action === 'budget-warning') {
            toast.warning(data.message || 'Alerte budget');
            triggerHaptic('error');
          }
        } catch { /* silent */ }
      });
      es.onerror = () => { es.close(); sseRef.current = null; };
      sseRef.current = es;
    };
    connectSSE();
    return () => { if (sseRef.current) { sseRef.current.close(); sseRef.current = null; } };
  }, [activeList?.id, loadList, fetchStockAlerts]);

  // ─────────────────────────────────────────────────────
  // PUSH NOTIFICATIONS (Phase 3)
  // ─────────────────────────────────────────────────────
  const handleTogglePush = useCallback(async () => {
    if (!activeList) return;
    setPushLoading(true);
    try {
      await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push-stock-alerts', listId: activeList.id }),
      });
      await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'push-budget-check', listId: activeList.id }),
      });
      setPushEnabled(!pushEnabled);
      triggerHaptic('medium');
      toast.success(pushEnabled ? 'Notifications désactivées' : 'Notifications activées');
    } catch {
      toast.error('Erreur lors de la gestion des notifications');
    } finally {
      setPushLoading(false);
    }
  }, [activeList, pushEnabled]);

  // ─────────────────────────────────────────────────────
  // BUDGET ALERTS (haptic)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (budgetPercent >= 85 && prevBudgetPercent.current < 85) {
      triggerHaptic('error');
      toast.error('Budget presque atteint !');
    } else if (budgetPercent >= 60 && prevBudgetPercent.current < 60) {
      triggerHaptic('medium');
      toast('Budget à plus de 60%');
    }
    prevBudgetPercent.current = budgetPercent;
  }, [budgetPercent]);

  // ─────────────────────────────────────────────────────
  // ADD ITEM
  // ─────────────────────────────────────────────────────
  const handleAddItem = useCallback(
    async (data: {
      productName: string;
      brand?: string;
      priceCents: number;
      quantity: number;
      unit: string;
      category: string;
      barcode?: string;
      suggestedBy?: string;
    }) => {
      if (!activeList) return;

      try {
        const res = await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add-item',
            listId: activeList.id,
            productName: data.productName,
            brand: data.brand || null,
            priceCents: data.priceCents,
            quantity: data.quantity,
            unit: data.unit,
            category: data.category,
            barcode: data.barcode || null,
            suggestedBy: data.suggestedBy || 'user',
          }),
        });
        if (res.ok) {
          const result = await res.json();
          addItem(result.item);
          triggerHaptic('success');
          toast.success(`${data.productName} ajouté`);
        }
      } catch {
        toast.error("Erreur lors de l'ajout");
      }
    },
    [activeList, addItem]
  );

  // ─────────────────────────────────────────────────────
  // SCAN RESULT
  // ─────────────────────────────────────────────────────
  const handleScanResult = useCallback(
    async (
      code: string,
      name: string,
      barcode?: string,
      category?: string | null
    ) => {
      if (!activeList) {
        toast.error('Aucune liste active');
        return;
      }
      await handleAddItem({
        productName: name,
        priceCents: 0,
        quantity: 1,
        unit: 'pièce',
        category: category || 'autre',
        barcode: barcode || code,
        suggestedBy: 'user',
      });
    },
    [activeList, handleAddItem]
  );

  // ─────────────────────────────────────────────────────
  // TOGGLE ITEM
  // ─────────────────────────────────────────────────────
  const handleToggleItem = useCallback(
    async (itemId: string) => {
      if (!activeList) return;
      toggleItemLocal(itemId);
      triggerHaptic('light');
      try {
        await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle-item',
            itemId,
            listId: activeList.id,
          }),
        });
      } catch {
        // Optimistic update already applied
      }
    },
    [activeList, toggleItemLocal]
  );

  // ─────────────────────────────────────────────────────
  // DELETE ITEM
  // ─────────────────────────────────────────────────────
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!activeList) return;
      removeItem(itemId);
      triggerHaptic('light');
      toast.success('Article supprimé');
      try {
        await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete-item',
            itemId,
            listId: activeList.id,
          }),
        });
      } catch {
        // Optimistic
      }
    },
    [activeList, removeItem]
  );

  // ─────────────────────────────────────────────────────
  // EDIT ITEM (opens edit modal via state)
  // ─────────────────────────────────────────────────────
  const handleEditItem = useCallback((item: ShoppingListItem) => {
    setEditingItem(item);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!activeList || !editingItem) return;

    const res = await fetch('/api/smart-shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update-item',
        itemId: editingItem.id,
        listId: activeList.id,
        priceCents: editingItem.priceCents,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        notes: editingItem.notes,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      updateItemLocal(editingItem.id, {
        priceCents: editingItem.priceCents,
        quantity: editingItem.quantity,
        unit: editingItem.unit,
        notes: editingItem.notes,
      });
      if (activeList.budgetCents > 0) {
        setActiveList({
          ...activeList,
          spentCents: data.spentCents ?? activeList.spentCents,
        });
        recalcBudgetPercent();
      }
      triggerHaptic('success');
      toast.success('Article modifié');
      setEditingItem(null);
    }
  }, [activeList, editingItem, updateItemLocal, setActiveList, recalcBudgetPercent]);

  // ─────────────────────────────────────────────────────
  // COMPLETE LIST
  // ─────────────────────────────────────────────────────
  const handleCompleteList = useCallback(async () => {
    if (!activeList) return;
    try {
      const res = await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete-list', listId: activeList.id }),
      });
      if (res.ok) {
        triggerHaptic('success');
        toast.success('Liste terminée !');
        fetchLists();
        fetchStats();
        setActiveList(null);
      }
    } catch {
      toast.error('Erreur');
    }
  }, [activeList, fetchLists, fetchStats, setActiveList]);

  // ─────────────────────────────────────────────────────
  // ARCHIVE LIST
  // ─────────────────────────────────────────────────────
  const handleArchiveList = useCallback(async () => {
    if (!activeList) return;
    try {
      await fetch('/api/smart-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive-list', listId: activeList.id }),
      });
      toast.success('Liste archivée');
      fetchLists();
      fetchStats();
      setActiveList(null);
    } catch {
      toast.error('Erreur');
    }
  }, [activeList, fetchLists, fetchStats, setActiveList]);

  // ─────────────────────────────────────────────────────
  // DELETE LIST
  // ─────────────────────────────────────────────────────
  const handleDeleteList = useCallback(
    async (listId: string) => {
      try {
        await fetch('/api/smart-shop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-list', listId }),
        });
        toast.success('Liste supprimée');
        if (activeList?.id === listId) setActiveList(null);
        fetchLists();
        fetchStats();
      } catch {
        toast.error('Erreur');
      }
    },
    [activeList, fetchLists, fetchStats, setActiveList]
  );

  // ─────────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!activeList) return;
    exportListCSV({
      list: {
        name: activeList.name,
        budgetCents: activeList.budgetCents,
        spentCents: activeList.spentCents,
        storeName: activeList.storeName,
        status: activeList.status,
        startedAt: activeList.startedAt,
      },
      items: activeList.items,
    });
    toast.success('Export CSV téléchargé');
  };

  const handleExportTXT = () => {
    if (!activeList) return;
    exportListTXT({
      list: {
        name: activeList.name,
        budgetCents: activeList.budgetCents,
        spentCents: activeList.spentCents,
        storeName: activeList.storeName,
        status: activeList.status,
        startedAt: activeList.startedAt,
      },
      items: activeList.items,
    });
    toast.success('Export TXT téléchargé');
  };

  // ─────────────────────────────────────────────────────
  // COMPUTED — group items by category
  // ─────────────────────────────────────────────────────
  const groupedItems = useMemo(() => {
    if (!activeList) return [];

    const categoryOrder = CATEGORIES as readonly string[];
    const categoryMap = new Map<
      string,
      { unchecked: ShoppingListItem[]; checked: ShoppingListItem[] }
    >();

    // Initialize all categories
    for (const cat of categoryOrder) {
      categoryMap.set(cat, { unchecked: [], checked: [] });
    }
    categoryMap.set('__no_category', { unchecked: [], checked: [] });

    for (const item of activeList.items) {
      const key = item.category || '__no_category';
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { unchecked: [], checked: [] });
      }
      const bucket = categoryMap.get(key)!;
      if (item.isChecked) {
        bucket.checked.push(item);
      } else {
        bucket.unchecked.push(item);
      }
    }

    // Build ordered groups
    const groups: Array<{
      category: string;
      items: ShoppingListItem[];
    }> = [];

    for (const cat of categoryOrder) {
      const bucket = categoryMap.get(cat)!;
      if (bucket.unchecked.length > 0 || bucket.checked.length > 0) {
        groups.push({
          category: cat,
          items: [...bucket.unchecked, ...bucket.checked],
        });
      }
    }

    // Uncategorized at the end
    const noCat = categoryMap.get('__no_category')!;
    if (noCat.unchecked.length > 0 || noCat.checked.length > 0) {
      groups.push({
        category: '__no_category',
        items: [...noCat.unchecked, ...noCat.checked],
      });
    }

    return groups;
  }, [activeList]);

  // ─────────────────────────────────────────────────────
  // STATS COUNTS
  // ─────────────────────────────────────────────────────
  const checkedCount = activeList
    ? activeList.items.filter((i) => i.isChecked).length
    : 0;
  const uncheckedCount = activeList
    ? activeList.items.filter((i) => !i.isChecked).length
    : 0;
  const totalCount = activeList ? activeList.items.length : 0;

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-full">
      {/* ═══════════ SIDEBAR ═══════════ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col glass rounded-xl inner-glow overflow-hidden">
              {/* Sidebar header */}
              <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-sm font-serif font-semibold text-amber-50">
                      Mes Listes
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateModal(true)}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    title="Nouvelle liste"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* List cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-luxe">
                {lists.length > 0 ? (
                  lists.map((list) => (
                    <ListCard
                      key={list.id}
                      list={list}
                      isActive={activeList?.id === list.id}
                      onClick={() => loadList(list.id)}
                      onDelete={() => handleDeleteList(list.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-8 h-8 text-[#475569] mx-auto mb-2" />
                    <p className="text-xs text-[#64748b]">Aucune liste</p>
                    <p className="text-[10px] text-[#475569]">
                      Créez-en une pour commencer
                    </p>
                  </div>
                )}
              </div>

              {/* Monthly stats footer */}
              {stats && (
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">
                      Ce mois
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-[10px] text-[#64748b]">Listes</p>
                      <p className="text-sm font-semibold text-foreground">
                        {stats.totalLists || 0}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-2">
                      <p className="text-[10px] text-[#64748b]">Total dépensé</p>
                      <p className="text-sm font-semibold text-amber-400">
                        {centsToEuro(stats.totalSpent || 0)}
                      </p>
                    </div>
                  </div>
                  {/* Mini category chart */}
                  {stats.categoryBreakdown?.length > 0 && (
                    <div className="mt-3">
                      <CategoryChart
                        data={stats.categoryBreakdown.slice(0, 5)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="flex-1 min-w-0">
        {activeList ? (
          <div className="space-y-4">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg bg-white/[0.04] text-[#94a3b8] hover:text-amber-400 hover:bg-white/[0.08] transition-colors shrink-0"
                >
                  {sidebarOpen ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </motion.button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-semibold text-amber-50 truncate">
                      {activeList.name}
                    </h2>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                        activeList.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : activeList.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-white/[0.06] text-[#64748b]'
                      }`}
                    >
                      {activeList.status === 'active'
                        ? 'En cours'
                        : activeList.status === 'completed'
                          ? 'Terminée'
                          : 'Archivée'}
                    </span>
                  </div>
                  {activeList.storeName && (
                    <p className="text-xs text-[#64748b] truncate">
                      {activeList.storeName}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Recipe Matcher button */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRecipeModal(true)}
                    className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                    title="Matcher une recette"
                  >
                    <ChefHat className="w-4 h-4" />
                  </motion.button>
                  {stockAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold pointer-events-none">
                      {stockAlerts.length > 9 ? '9+' : stockAlerts.length}
                    </span>
                  )}
                </div>

                {/* Promos button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPromos(!showPromos)}
                  className={`p-2 rounded-lg transition-colors ${showPromos ? 'bg-rose-500/20 text-rose-400' : 'bg-white/[0.04] text-[#94a3b8] hover:text-rose-400'}`}
                  title="Promotions"
                >
                  <Tag className="w-4 h-4" />
                </motion.button>

                {/* Checkout button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCheckout(true)}
                  className={`p-2 rounded-lg transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`}
                  title="Commander"
                >
                  <Truck className="w-4 h-4" />
                </motion.button>

                {/* Phase 3 — Push notification toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTogglePush}
                  disabled={pushLoading}
                  className={`p-2 rounded-lg transition-colors ${pushEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-white/[0.04] text-[#94a3b8] hover:text-purple-400'}`}
                  title={pushEnabled ? 'Notifications activées' : 'Activer les notifications'}
                >
                  {pushLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : pushEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleArchiveList}
                  className="p-2 rounded-lg bg-white/[0.04] text-[#94a3b8] hover:text-amber-400 transition-colors"
                  title="Archiver"
                >
                  <Archive className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportCSV}
                  className="p-2 rounded-lg bg-white/[0.04] text-[#94a3b8] hover:text-amber-400 transition-colors"
                  title="Exporter CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportTXT}
                  className="p-2 rounded-lg bg-white/[0.04] text-[#94a3b8] hover:text-amber-400 transition-colors"
                  title="Exporter TXT"
                >
                  <FileText className="w-4 h-4" />
                </motion.button>
                {activeList.status === 'active' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCompleteList}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Terminer</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* ─── Budget Bar ─── */}
            {activeList.budgetCents > 0 && (
              <div className="glass rounded-xl p-5 inner-glow">
                <BudgetProgressBar
                  budgetCents={activeList.budgetCents}
                  spentCents={activeList.spentCents}
                />
              </div>
            )}

            {/* ─── Quick Add Bar ─── */}
            {activeList.status === 'active' && (
              <div className="glass rounded-xl p-4 inner-glow">
                <QuickAddBar
                  onAdd={handleAddItem}
                  onOpenScanner={() => setShowScanner(true)}
                />
              </div>
            )}

            {/* ─── Stats Bar ─── */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#94a3b8]">
                  {totalCount} article{totalCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[#475569]">·</span>
                <span className="text-emerald-400">
                  {uncheckedCount} restant{uncheckedCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[#475569]">·</span>
                <span className="text-amber-400">
                  {checkedCount} coch{checkedCount !== 1 ? 'és' : 'é'}
                </span>
              </div>
              {/* Mini progress */}
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-black/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(checkedCount / totalCount) * 100}%`,
                      }}
                      transition={{ duration: 0.4 }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                  <span className="text-xs text-[#64748b]">
                    {Math.round((checkedCount / totalCount) * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* ─── Stock Alerts Panel (active lists only) ─── */}
            {activeList.status === 'active' && (
              <StockAlertsPanel
                listId={activeList.id}
                onAddItem={handleAddItem}
                alertCount={stockAlerts.length}
              />
            )}

            {/* ─── Promo Panel (active lists only) ─── */}
            {showPromos && activeList.status === 'active' && (
              <PromoPanel onAddItem={handleAddItem} />
            )}

            {/* ─── Phase 3 — AI Suggestions Panel ─── */}
            {activeList.status === 'active' && (
              <AISuggestionsPanel
                listId={activeList.id}
                onAddItem={handleAddItem}
              />
            )}

            {/* ─── Items grouped by category ─── */}
            {isLoading ? (
              <div className="glass rounded-xl p-8 inner-glow flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            ) : totalCount > 0 ? (
              <div className="glass rounded-xl overflow-hidden inner-glow">
                <div className="p-3 max-h-[50vh] overflow-y-auto scrollbar-luxe space-y-3">
                  <AnimatePresence mode="popLayout">
                    {groupedItems.map((group) => {
                      const catLabel =
                        group.category === '__no_category'
                          ? 'Autre'
                          : group.category;
                      const catIcon = getCategoryIcon(
                        group.category === '__no_category'
                          ? null
                          : group.category
                      );
                      const groupChecked = group.items.filter(
                        (i) => i.isChecked
                      ).length;
                      const groupTotal = group.items.length;

                      return (
                        <motion.div
                          key={group.category}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {/* Category header */}
                          <div className="flex items-center gap-2 px-2 mb-1.5">
                            <span className="text-sm">{catIcon}</span>
                            <span className="text-xs font-medium text-[#94a3b8] capitalize">
                              {catLabel}
                            </span>
                            <span className="text-[10px] text-[#475569]">
                              ({groupChecked}/{groupTotal})
                            </span>
                            <div className="flex-1 h-px bg-white/[0.04]" />
                          </div>

                          {/* Items */}
                          <div className="space-y-1.5">
                            <AnimatePresence mode="popLayout">
                              {group.items.map((item) => (
                                <ListItemRow
                                  key={item.id}
                                  item={item}
                                  onToggle={handleToggleItem}
                                  onEdit={handleEditItem}
                                  onDelete={handleDeleteItem}
                                  partnerStores={partnerStores.map(s => ({ name: s.name, deepLinkTemplate: s.deepLinkTemplate }))}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* ─── Empty items state ─── */
              <div className="glass rounded-xl p-12 inner-glow text-center">
                <Package className="w-10 h-10 text-[#475569] mx-auto mb-3" />
                <p className="text-sm text-[#64748b]">
                  Liste vide
                </p>
                <p className="text-xs text-[#475569] mt-1">
                  Ajoutez des produits via le champ ci-dessus ou le scanner
                </p>
              </div>
            )}

            {/* ─── Alternatives Panel ─── */}
            {activeList.items.length > 0 && (
              <AlternativesPanel
                item={selectedItem || activeList.items[0] || null}
              />
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════
             EMPTY STATE — No list active
             ═══════════════════════════════════════ */
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* Toggle sidebar still visible */}
            <div className="absolute top-0 left-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-white/[0.04] text-[#94a3b8] hover:text-amber-400 hover:bg-white/[0.08] transition-colors"
              >
                {sidebarOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-serif font-semibold text-foreground mb-2">
                Smart Shop
              </h3>
              <p className="text-sm text-[#64748b] max-w-[340px] mx-auto mb-6 leading-relaxed">
                Gérez vos listes de courses intelligemment. Suivez votre budget,
                scannez les produits, et recevez des suggestions d&apos;alternatives.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Créer ma liste de courses
              </motion.button>
            </motion.div>
          </div>
        )}
      </div>

      {/* ═══════════ MODALS ═══════════ */}

      {/* Create list modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateListModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(list) => {
              setShowCreateModal(false);
              fetchLists();
              loadList(list.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Barcode scanner modal */}
      {showScanner && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onResult={handleScanResult}
        />
      )}

      {/* Recipe matcher modal */}
      <AnimatePresence>
        {showRecipeModal && activeList && (
          <RecipeMatcherModal
            listId={activeList.id}
            onClose={() => setShowRecipeModal(false)}
            onInjected={() => {
              loadList(activeList.id);
              fetchStockAlerts();
            }}
          />
        )}
      </AnimatePresence>

      {/* Mock checkout modal */}
      <AnimatePresence>
        {showCheckout && activeList && (
          <MockCheckoutModal
            activeList={activeList}
            onClose={() => setShowCheckout(false)}
            onComplete={handleCompleteList}
          />
        )}
      </AnimatePresence>

      {/* Edit item modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-full max-w-sm border border-white/[0.08]"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-serif font-semibold text-amber-50">
                  Modifier l&apos;article
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-lg text-[#64748b] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">
                    Produit
                  </label>
                  <p className="text-sm text-foreground">
                    {editingItem.productName}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#64748b] mb-1 block">
                      Prix (EUR)
                    </label>
                    <input
                      type="number"
                      value={(editingItem.priceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          priceCents: Math.round(
                            (parseFloat(e.target.value) || 0) * 100
                          ),
                        })
                      }
                      step="0.01"
                      min="0"
                      className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#64748b] mb-1 block">
                      Quantité
                    </label>
                    <input
                      type="number"
                      value={editingItem.quantity}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      min="1"
                      className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">
                    Unité
                  </label>
                  <select
                    value={editingItem.unit}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        unit: e.target.value,
                      })
                    }
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-amber-500/30 appearance-none cursor-pointer"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u} className="bg-[#0a0a0f]">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#64748b] mb-1 block">
                    Notes (optionnel)
                  </label>
                  <input
                    value={editingItem.notes || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        notes: e.target.value || null,
                      })
                    }
                    placeholder="Ajouter une note..."
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[#475569] focus:outline-none focus:border-amber-500/30"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveEdit}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-3 rounded-xl font-medium text-sm transition-all"
                >
                  Enregistrer
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
