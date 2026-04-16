'use client';

/**
 * CategoryChart — Recharts PieChart pour Smart Shop
 * Affiche la répartition des dépenses par catégorie.
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6', '#a855f7', '#f43f5e', '#64748b'];

const CATEGORY_LABELS: Record<string, string> = {
  'légumes': 'Légumes', fruits: 'Fruits', viande: 'Viande', poisson: 'Poisson',
  'produits laitiers': 'Produits laitiers', boulangerie: 'Boulangerie', boissons: 'Boissons',
  surgelés: 'Surgelés', hygiène: 'Hygiène', nettoyage: 'Nettoyage',
  alimentaire: 'Alimentaire', condiments: 'Condiments', autre: 'Autre',
};

interface CategoryData { category: string; amountCents: number; }

interface CategoryChartProps { data: CategoryData[]; totalCents?: number; }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryData }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-white/[0.08] shadow-xl">
      <p className="text-xs font-medium text-foreground">{CATEGORY_LABELS[d.category] || d.category}</p>
      <p className="text-sm font-semibold text-amber-400">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(d.amountCents / 100)}</p>
    </div>
  );
}

export function CategoryChart({ data, totalCents }: CategoryChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-xs text-[#64748b]">Aucune donnée</div>;
  }
  const total = totalCents || data.reduce((s, d) => s + d.amountCents, 0);
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="amountCents" nameKey="category" stroke="rgba(0,0,0,0.3)" strokeWidth={2}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.85} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
        {data.map((d, i) => (
          <div key={d.category} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-[10px] text-[#94a3b8]">{CATEGORY_LABELS[d.category] || d.category} <span className="text-[#64748b]">({Math.round((d.amountCents / total) * 100)}%)</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
