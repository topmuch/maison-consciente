'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Trash2, Camera, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import BarcodeScannerModal from '@/components/shared/barcode-scanner-modal';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface GroceryItem {
  id: string;
  name: string;
  isBought: boolean;
  category: string;
}

interface Suggestion {
  name: string;
  count: number;
}

interface GroceryListProps {
  items: GroceryItem[];
  onRefresh: () => void;
}

const categoryColors: Record<string, { bg: string; dot: string }> = {
  food: { bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  dairy: { bg: 'bg-sky-500/10', dot: 'bg-sky-500' },
  bakery: { bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  meat: { bg: 'bg-red-500/10', dot: 'bg-red-500' },
  produce: { bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  beverages: { bg: 'bg-cyan-500/10', dot: 'bg-cyan-500' },
  frozen: { bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  hygiene: { bg: 'bg-violet-500/10', dot: 'bg-violet-500' },
  other: { bg: 'bg-[oklch(0.50_0.08_260)]/10', dot: 'bg-[oklch(0.50_0.08_260)]' },
};

const categoryLabels: Record<string, string> = {
  food: '🍽️ Alimentaire',
  dairy: '🥛 Laitier',
  bakery: '🥖 Boulangerie',
  meat: '🥩 Viande',
  produce: '🥬 Fruits/Lég.',
  beverages: '🥤 Boissons',
  frozen: '🧊 Surgelés',
  hygiene: '🧼 Hygiène',
  other: '📦 Autre',
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function GroceryList({ items, onRefresh }: GroceryListProps) {
  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [adding, setAdding] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  /* ─── Fetch Suggestions ─── */
  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/smart-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-suggestions' }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  /* ─── Record Purchase (when toggling bought ON) ─── */
  const recordPurchase = async (name: string, category: string) => {
    try {
      await fetch('/api/smart-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record-purchase', itemName: name, category }),
      });
    } catch {
      // silently fail
    }
  };

  /* ─── Handle Add (with smart category) ─── */
  const handleAdd = async () => {
    if (!newItem.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch('/api/smart-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-item',
          name: newItem.trim(),
          category: selectedCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewItem('');
        if (data.categoryInfo?.emoji) {
          toast.success(`${data.categoryInfo.emoji} ${newItem.trim()} ajouté (${data.categoryInfo.label})`);
        } else {
          toast.success('Article ajouté');
        }
        onRefresh();
        fetchSuggestions();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setAdding(false);
    }
  };

  /* ─── Handle Barcode Scan Result ─── */
  const handleScanResult = async (code: string, name: string, barcode?: string, category?: string | null) => {
    setAdding(true);
    try {
      const res = await fetch('/api/smart-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-item',
          name,
          barcode,
          category: selectedCategory === 'food' && category ? undefined : selectedCategory,
        }),
      });
      if (res.ok) {
        toast.success(`📱 ${name} ajouté via scan`);
        onRefresh();
        fetchSuggestions();
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setAdding(false);
    }
  };

  /* ─── Handle Toggle (with purchase recording) ─── */
  const handleToggle = async (item: GroceryItem) => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-grocery', id: item.id, isBought: !item.isBought }),
      });
      if (res.ok) {
        // Record purchase when item is marked as bought
        if (!item.isBought) {
          recordPurchase(item.name, item.category);
        }
        onRefresh();
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  /* ─── Add Suggestion ─── */
  const handleAddSuggestion = async (name: string) => {
    try {
      const res = await fetch('/api/smart-grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-item', name }),
      });
      if (res.ok) {
        toast.success(`⚡ ${name} ajouté`);
        onRefresh();
        fetchSuggestions();
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  /* ─── Handle Delete ─── */
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/enrichment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-grocery', id }),
      });
      if (res.ok) {
        toast.success('Article supprimé');
        onRefresh();
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  const unboughtCount = items.filter((i) => !i.isBought).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="glass rounded-xl overflow-hidden inner-glow"
    >
      {/* Header */}
      <div className="p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShoppingCart className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight text-amber-50">
                Courses
              </h2>
              {unboughtCount > 0 && (
                <span className="text-[10px] text-[oklch(0.45_0.02_260)]">
                  {unboughtCount} article{unboughtCount > 1 ? 's' : ''} à acheter
                </span>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <span className="text-[10px] text-[oklch(0.40_0.02_260)] font-mono">
              {items.length} total
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ─── Smart Suggestions Bar ─── */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-[oklch(0.50_0.02_260)] uppercase tracking-widest font-medium">
                  Suggestions rapides
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-luxe pb-1">
                {suggestions.map((s) => (
                  <motion.button
                    key={s.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddSuggestion(s.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs whitespace-nowrap hover:bg-amber-500/20 transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    {s.name}
                    {s.count > 1 && (
                      <span className="text-[9px] text-amber-400/50">x{s.count}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Item Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="flex gap-2"
        >
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Ajouter un article..."
            className="flex-1 bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-[oklch(0.40_0.02_260)] focus:outline-none focus:border-emerald-500/30 transition-colors duration-300"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowScanner(true)}
            className="bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] p-2.5 rounded-xl transition-colors duration-300 cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Scanner un code-barres"
            aria-label="Scanner un code-barres"
          >
            <Camera className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!newItem.trim() || adding}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white p-2.5 rounded-xl transition-colors duration-300 cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Ajouter un article"
          >
            {adding ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <ShoppingCart className="w-4 h-4" />
              </motion.div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </motion.button>
        </form>

        {/* Category Selector */}
        <div className="flex gap-1.5 flex-wrap">
          {(['food', 'dairy', 'bakery', 'meat', 'produce', 'beverages', 'hygiene', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] py-1.5 px-2 rounded-lg border transition-all duration-300 cursor-pointer ${
                selectedCategory === cat
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/[0.06] text-[oklch(0.50_0.02_260)] hover:border-white/[0.12]'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Grocery Items List */}
        <div className="max-h-48 overflow-y-auto scrollbar-luxe space-y-1.5">
          <AnimatePresence mode="popLayout">
            {items.length > 0 ? (
              items.map((item) => {
                const cat = categoryColors[item.category] || categoryColors.other;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between bg-black/20 px-3 py-2.5 rounded-lg border border-white/[0.06] hover:border-white/[0.12] transition-colors duration-300 group"
                  >
                    <button
                      onClick={() => handleToggle(item)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div
                        className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                          item.isBought
                            ? 'bg-emerald-500 border-emerald-500 text-black'
                            : 'border-[oklch(0.40_0.02_260)]'
                        }`}
                      >
                        {item.isBought && (
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        {item.category && (
                          <span className="text-[10px] shrink-0">
                            {categoryLabels[item.category]?.split(' ')[0] || '📦'}
                          </span>
                        )}
                        <span
                          className={`text-sm truncate transition-colors duration-300 ${
                            item.isBought
                              ? 'text-[oklch(0.40_0.02_260)] line-through'
                              : 'text-[oklch(0.80_0.02_260)]'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded-lg text-[oklch(0.35_0.02_260)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="py-6 text-center">
                <ShoppingCart className="w-8 h-8 text-[oklch(0.25_0.02_260)] mx-auto mb-2" />
                <p className="text-xs text-[oklch(0.45_0.02_260)] italic">
                  Liste de courses vide
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Barcode Scanner Modal ─── */}
      {showScanner && (
        <BarcodeScannerModal
          onClose={() => setShowScanner(false)}
          onResult={handleScanResult}
        />
      )}
    </motion.div>
  );
}
