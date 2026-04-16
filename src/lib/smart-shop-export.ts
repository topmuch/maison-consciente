/**
 * Smart Shop — Export Functions (CSV + TXT)
 * Génère des exports téléchargeables des listes de courses.
 * Types génériques pour éviter les imports circulaires.
 */

import { centsToEuro } from '@/store/smart-shop-store';

export interface ExportListItem {
  productName: string;
  brand: string | null;
  priceCents: number;
  quantity: number;
  unit: string;
  category: string | null;
  isChecked: boolean;
  notes: string | null;
}

export interface ExportListData {
  name: string;
  budgetCents: number;
  spentCents: number;
  storeName: string | null;
  status: string;
  startedAt: string;
}

export interface ExportData {
  list: ExportListData;
  items: ExportListItem[];
}

/** Category labels for export (FR) */
const CATEGORY_LABELS: Record<string, string> = {
  'légumes': 'Légumes',
  fruits: 'Fruits',
  viande: 'Viande',
  poisson: 'Poisson',
  'produits laitiers': 'Produits laitiers',
  boulangerie: 'Boulangerie',
  boissons: 'Boissons',
  surgelés: 'Surgelés',
  hygiène: 'Hygiène',
  nettoyage: 'Nettoyage',
  alimentaire: 'Alimentaire',
  condiments: 'Condiments',
  autre: 'Autre',
};

/** CSV BOM for Excel UTF-8 compatibility */
const UTF8_BOM = '\uFEFF';

export function exportListCSV(data: ExportData): void {
  const { list, items } = data;
  const lines: string[] = [];

  lines.push(`Liste: ${list.name}`);
  lines.push(`Budget: ${centsToEuro(list.budgetCents)} | Acheté: ${centsToEuro(list.spentCents)}`);
  lines.push(`Magasin: ${list.storeName || 'Non spécifié'}`);
  lines.push(`Date: ${new Date(list.startedAt).toLocaleDateString('fr-FR')}`);
  lines.push('');
  lines.push('Produit;Marque;Prix unitaire;Quantité;Unité;Total;Catégorie;Coche;Notes');

  for (const item of items) {
    const cat = item.category ? (CATEGORY_LABELS[item.category] || item.category) : '-';
    lines.push(
      `"${item.productName}";"${item.brand || '-'}";${centsToEuro(item.priceCents)};${item.quantity};${item.unit};${centsToEuro(item.priceCents * item.quantity)};${cat};${item.isChecked ? 'Oui' : 'Non'};${item.notes || '-'}`
    );
  }

  lines.push('');
  const checkedTotal = items.filter(i => i.isChecked).reduce((s, i) => s + i.priceCents * i.quantity, 0);
  lines.push(`TOTAL ACHETÉ: ${centsToEuro(checkedTotal)}`);
  if (list.budgetCents > 0) {
    lines.push(`RESTANT: ${centsToEuro(Math.max(0, list.budgetCents - checkedTotal))}`);
  }

  const csvContent = UTF8_BOM + lines.join('\n');
  downloadFile(csvContent, `liste-courses-${list.name.toLowerCase().replace(/\s+/g, '-')}.csv`, 'text/csv;charset=utf-8;');
}

export function exportListTXT(data: ExportData): void {
  const { list, items } = data;
  const lines: string[] = [];
  const sep = '═'.repeat(50);
  const thin = '─'.repeat(50);

  lines.push(sep);
  lines.push('  SMART SHOP — Liste de courses');
  lines.push(sep);
  lines.push('');
  lines.push(`  Liste   : ${list.name}`);
  lines.push(`  Magasin : ${list.storeName || 'Non spécifié'}`);
  lines.push(`  Date    : ${new Date(list.startedAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');
  lines.push(thin);
  lines.push('  ARTICLES');
  lines.push(thin);
  lines.push('');

  if (items.length === 0) {
    lines.push('  (Aucun article)');
  } else {
    items.forEach((item, i) => {
      const check = item.isChecked ? '[x]' : '[ ]';
      const cat = item.category ? (CATEGORY_LABELS[item.category] || item.category) : '';
      const qty = `${item.quantity} ${item.unit}`;
      const total = centsToEuro(item.priceCents * item.quantity);
      lines.push(`  ${check} ${i + 1}. ${item.productName} (${qty})`);
      if (item.brand) lines.push(`       ${item.brand}${cat ? ` — ${cat}` : ''}`);
      if (item.notes) lines.push(`       Note: ${item.notes}`);
      lines.push(`       ${total}`);
      lines.push('');
    });
  }

  const checkedTotal = items.filter(i => i.isChecked).reduce((s, i) => s + i.priceCents * i.quantity, 0);
  lines.push(thin);
  lines.push(`  ACHETÉ        : ${centsToEuro(checkedTotal)}`);
  if (list.budgetCents > 0) {
    lines.push(`  BUDGET        : ${centsToEuro(list.budgetCents)}`);
    lines.push(`  RESTANT       : ${centsToEuro(Math.max(0, list.budgetCents - checkedTotal))}`);
  }
  lines.push(sep);

  downloadFile(lines.join('\n'), `liste-courses-${list.name.toLowerCase().replace(/\s+/g, '-')}.txt`, 'text/plain;charset=utf-8;');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
