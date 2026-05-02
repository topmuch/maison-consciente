'use client';

/**
 * AlternativesPanel — Suggestions de produits moins chers
 * Quand un article est sélectionné, affiche des alternatives potentielles
 * avec des prix comparatifs pour aider l'utilisateur à économiser.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { centsToEuro } from '@/store/smart-shop-store';
import type { ShoppingListItem } from '@/store/smart-shop-store';

interface Alternative {
  productName: string;
  brand: string;
  priceCents: number;
  source: string;
}

function generateAlternatives(item: ShoppingListItem): Alternative[] {
  const category = item.category || 'autre';
  const categoryDiscounts: Record<string, number> = {
    'légumes': 82, fruits: 85, viande: 78, poisson: 80,
    'produits laitiers': 88, boulangerie: 85, boissons: 88,
    surgelés: 80, hygiène: 75, nettoyage: 75,
    alimentaire: 86, condiments: 90, autre: 90,
  };
  const discountFactor = (categoryDiscounts[category] || 90) / 100;
  const alternatives: Alternative[] = [];
  const storeBrands = [
    { brand: 'Marque Repère', source: 'Leclerc' },
    { brand: 'Marque Distributeur', source: 'Carrefour' },
    { brand: 'Primia', source: 'Casino' },
  ];
  for (const sb of storeBrands) {
    const variation = 0.95 + Math.random() * 0.1;
    const altPrice = Math.round(item.priceCents * discountFactor * variation);
    if (altPrice > 0 && altPrice < item.priceCents) {
      alternatives.push({ productName: item.productName, brand: `${sb.brand} — ${category}`, priceCents: altPrice, source: sb.source });
    }
  }
  return alternatives.sort((a, b) => a.priceCents - b.priceCents).slice(0, 3);
}

interface AlternativesPanelProps {
  item: ShoppingListItem | null;
}

export function AlternativesPanel({ item }: AlternativesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);

  const handleShow = () => {
    if (!item) return;
    if (alternatives.length === 0) setAlternatives(generateAlternatives(item));
    setExpanded(!expanded);
  };

  if (!item || item.priceCents <= 0) return null;
  const savings = alternatives.length > 0 ? item.priceCents - alternatives[0].priceCents : 0;

  return (
    <div className="glass rounded-xl overflow-hidden inner-glow">
      <button onClick={handleShow} className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-foreground">Alternatives moins chères</span>
          {savings > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Jusqu&apos;à -{Math.round((savings / item.priceCents) * 100)}%</span>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
      </button>
      <AnimatePresence>
        {expanded && alternatives.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Économisez sur « {item.productName} »</div>
              {alternatives.map((alt, i) => {
                const saving = item.priceCents - alt.priceCents;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-black/20 border border-white/[0.06] hover:border-emerald-500/20 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><TrendingDown className="w-3.5 h-3.5 text-emerald-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{alt.brand}</p>
                      <p className="text-[10px] text-[#64748b]">{alt.source}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-emerald-400">{centsToEuro(alt.priceCents)}</p>
                      <p className="text-[10px] text-emerald-400/70">-{centsToEuro(saving)}</p>
                    </div>
                  </motion.div>
                );
              })}
              <div className="pt-1 text-center"><p className="text-[9px] text-[#475569] italic">Suggestions basées sur les marques de distributeur</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
