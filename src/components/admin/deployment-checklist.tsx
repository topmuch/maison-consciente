'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Database,
  Globe,
  HardDrive,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Checklist Pré-Lancement
   
   Interactive checklist for production deployment verification.
   Persists state to localStorage for admins to track progress.
   ═══════════════════════════════════════════════════════ */

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  checked: boolean;
}

interface ChecklistCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  items: ChecklistItem[];
}

const DEFAULT_CHECKLIST: ChecklistCategory[] = [
  {
    id: 'security',
    icon: <Shield className="w-5 h-5" />,
    title: 'Sécurité',
    color: 'text-rose-400',
    items: [
      { id: 'sec-1', label: 'AUTH_SECRET fort & unique', detail: 'openssl rand -base64 32 → copier dans .env.production', checked: false },
      { id: 'sec-2', label: 'DATABASE_URL pointe vers prod', detail: 'postgresql://maison:***@db:5432/maison_db', checked: false },
      { id: 'sec-3', label: 'Headers CSP/HSTS actifs', detail: 'Vérifier avec: curl -I https://domaine.com/api/health', checked: false },
      { id: 'sec-4', label: 'Pas de clés API ou .env dans le repo', detail: 'git diff --cached | grep -i "secret\\|password\\|key"', checked: false },
    ],
  },
  {
    id: 'database',
    icon: <Database className="w-5 h-5" />,
    title: 'Base de Données',
    color: 'text-emerald-400',
    items: [
      { id: 'db-1', label: 'Migrations Prisma appliquées', detail: 'npx prisma migrate deploy (auto via docker-entrypoint)', checked: false },
      { id: 'db-2', label: 'Index Prisma vérifiés', detail: 'Tous les @@index en place dans schema.prisma', checked: false },
      { id: 'db-3', label: 'Premier compte superadmin créé', detail: 'Inscription → UPDATE role = "superadmin" dans DB', checked: false },
    ],
  },
  {
    id: 'network',
    icon: <Globe className="w-5 h-5" />,
    title: 'Réseau & Domaine',
    color: 'text-sky-400',
    items: [
      { id: 'net-1', label: 'HTTPS activé (Let\'s Encrypt)', detail: 'Certbot ou reverse proxy (Caddy/Nginx)', checked: false },
      { id: 'net-2', label: 'NEXT_PUBLIC_APP_URL = domaine', detail: 'https://votre-domaine.com dans .env.production', checked: false },
      { id: 'net-3', label: 'CORS/Referrer Policy configurés', detail: 'Headers ajoutés via middleware.ts', checked: false },
    ],
  },
  {
    id: 'resilience',
    icon: <HardDrive className="w-5 h-5" />,
    title: 'Résilience',
    color: 'text-amber-400',
    items: [
      { id: 'res-1', label: 'Backup cron fonctionnel', detail: 'docker compose --profile backup up -d', checked: false },
      { id: 'res-2', label: 'Healthcheck /api/health répond 200', detail: 'wget --spider http://localhost:3000/api/health', checked: false },
      { id: 'res-3', label: 'Logs accessibles', detail: 'docker compose -f docker-compose.prod.yml logs -f app', checked: false },
    ],
  },
  {
    id: 'pwa',
    icon: <Smartphone className="w-5 h-5" />,
    title: 'UX / PWA',
    color: 'text-violet-400',
    items: [
      { id: 'pwa-1', label: 'Manifest valide (/manifest.json)', detail: 'Lighthouse → PWA audit → manifest vérifié', checked: false },
      { id: 'pwa-2', label: 'Service Worker enregistré', detail: 'DevTools → Application → Service Workers → actif', checked: false },
      { id: 'pwa-3', label: 'Scan QR mobile fonctionne', detail: 'Test sur 4G + WiFi avec un vrai QR code', checked: false },
    ],
  },
  {
    id: 'clean',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Propreté',
    color: 'text-teal-400',
    items: [
      { id: 'clean-1', label: 'console.log debug supprimés', detail: 'rg "console\\.log" src/ --type ts', checked: false },
      { id: 'clean-2', label: 'NODE_ENV=production actif', detail: 'Vérifier: curl /api/health → environment: "production"', checked: false },
      { id: 'clean-3', label: 'Seed de test désactivé', detail: 'Pas de prisma db seed dans les scripts de déploiement', checked: false },
    ],
  },
];

const STORAGE_KEY = 'mc-deploy-checklist';

function loadChecklist(): ChecklistCategory[] {
  if (typeof window === 'undefined') return DEFAULT_CHECKLIST;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_CHECKLIST;
    const savedMap: Record<string, boolean> = JSON.parse(saved);
    return DEFAULT_CHECKLIST.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({
        ...item,
        checked: savedMap[item.id] || false,
      })),
    }));
  } catch {
    return DEFAULT_CHECKLIST;
  }
}

export function DeploymentChecklist() {
  const [checklist, setChecklist] = useState<ChecklistCategory[]>(DEFAULT_CHECKLIST);

  useState(() => {
    setChecklist(loadChecklist());
  });

  const totalItems = checklist.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = checklist.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.checked).length,
    0
  );
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const toggleItem = (categoryId: string, itemId: string) => {
    setChecklist((prev) => {
      const updated = prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : cat
      );
      // Persist to localStorage
      const map: Record<string, boolean> = {};
      updated.forEach((cat) => cat.items.forEach((item) => { map[item.id] = item.checked; }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      return updated;
    });
  };

  const resetAll = () => {
    setChecklist(DEFAULT_CHECKLIST);
    localStorage.removeItem(STORAGE_KEY);
  };

  const allDone = progress === 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-white">
              Checklist Pré-Lancement
            </h2>
            <p className="text-sm text-slate-400">
              Vérifiez chaque point avant de mettre en production
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">
              {checkedItems}/{totalItems} vérifié{checkedItems !== 1 ? 's' : ''}
            </span>
            <span className={`font-medium ${allDone ? 'text-emerald-400' : 'text-amber-400'}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${allDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-300">
              Tous les points sont vérifiés — prêt pour la production !
            </span>
          </motion.div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={resetAll}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Réinitialiser la checklist
          </button>
        </div>
      </div>

      {/* Categories */}
      {checklist.map((category, catIdx) => {
        const catChecked = category.items.filter((i) => i.checked).length;
        const catTotal = category.items.length;
        const catDone = catChecked === catTotal;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08 }}
            className="glass-strong rounded-2xl overflow-hidden"
          >
            {/* Category Header */}
            <div className={`flex items-center gap-3 p-4 border-b border-white/5 ${catDone ? 'opacity-60' : ''}`}>
              <div className={`${category.color}`}>{category.icon}</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white">{category.title}</h3>
                <p className="text-xs text-slate-500">
                  {catChecked}/{catTotal}
                </p>
              </div>
              {catDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>

            {/* Items */}
            <div className="divide-y divide-white/5">
              {category.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(category.id, item.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors group"
                >
                  {item.checked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5 transition-colors" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.checked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.detail}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Quick Commands */}
      <div className="glass-strong rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-medium text-white">Commandes Rapides</h3>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
            <span className="text-slate-500">$</span>
            <span className="text-amber-300">cp .env.production.example .env.production</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
            <span className="text-slate-500">$</span>
            <span className="text-amber-300">openssl rand -base64 32</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
            <span className="text-slate-500">$</span>
            <span className="text-amber-300">docker compose -f docker-compose.prod.yml up -d --build</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
            <span className="text-slate-500">$</span>
            <span className="text-amber-300">docker compose --profile backup up -d</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50">
            <span className="text-slate-500">$</span>
            <span className="text-amber-300">./scripts/backup.sh ./backups</span>
          </div>
        </div>
      </div>
    </div>
  );
}
