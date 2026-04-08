'use client';

/* ═══════════════════════════════════════════════════════
   NewsSettingsPanel — RSS News Settings

   Configuration panel for news/RSS sources:
   - Source Selection (checkboxes for each RSS source)
   - Refresh Interval (dropdown: 15/30/60/120 min)
   - Test Button (fetch & display latest 3 headlines)

   Uses shadcn/ui: Checkbox, Select, Button, Badge, Separator, Label.
   GlassCard + Dark Luxe amber/gold styling. All labels in French.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
  Loader2,
  Rss,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from '@/components/shared/glass-card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Types ── */

interface NewsSettingsData {
  activeSources: string[];
  refreshIntervalMin: number;
}

interface Headline {
  title: string;
  source: string;
}

const RSS_SOURCES_LIST = [
  { id: 'franceinfo', name: 'France Info', category: 'general' },
  { id: 'lemonde', name: 'Le Monde', category: 'general' },
  { id: 'lequipe', name: "L'Équipe", category: 'sport' },
  { id: 'leparisien', name: 'Le Parisien', category: 'general' },
  { id: 'horoscope', name: 'Horoscope', category: 'horoscope' },
] as const;

const REFRESH_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 heure' },
  { value: 120, label: '2 heures' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général',
  sport: 'Sport',
  horoscope: 'Horoscope',
};

/* ── Main Component ── */

export function NewsSettingsPanel() {
  const [settings, setSettings] = useState<NewsSettingsData>({
    activeSources: RSS_SOURCES_LIST.map(s => s.id),
    refreshIntervalMin: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Fetch settings ──
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/household/settings');
        if (res.ok) {
          const data = await res.json();
          const ns = data.newsSettings as Partial<NewsSettingsData> | undefined;
          if (ns) {
            setSettings(prev => ({
              activeSources: ns.activeSources ?? prev.activeSources,
              refreshIntervalMin: ns.refreshIntervalMin ?? prev.refreshIntervalMin,
            }));
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // ── Save settings ──
  const saveSettings = useCallback(async (newSettings: NewsSettingsData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsSettings: newSettings }),
      });
      if (res.ok) {
        toast.success('Paramètres d\'actualités sauvegardés');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Toggle source ──
  const handleToggleSource = useCallback((sourceId: string, checked: boolean) => {
    const updated = {
      ...settings,
      activeSources: checked
        ? [...settings.activeSources, sourceId]
        : settings.activeSources.filter(id => id !== sourceId),
    };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  // ── Refresh interval ──
  const handleRefreshChange = useCallback((value: string) => {
    const updated = {
      ...settings,
      refreshIntervalMin: parseInt(value, 10),
    };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  // ── Test headlines ──
  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestError(null);
    setHeadlines([]);

    try {
      const sourceParams = settings.activeSources.join(',');
      const res = await fetch(
        `/api/news/headlines?sources=${sourceParams}&limit=3`,
      );

      if (!res.ok) {
        setTestError('Impossible de récupérer les actualités');
        return;
      }

      const data = await res.json();
      const items = (data.headlines || data.articles || []).slice(0, 3);
      setHeadlines(items);
      toast.success(`${items.length} titres récupérés`);
    } catch {
      setTestError('Erreur de connexion au serveur');
    } finally {
      setTesting(false);
    }
  }, [settings.activeSources]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border border-white/[0.06]">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
          <Newspaper className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Actualités &amp; RSS</h2>
          <p className="text-[10px] text-[#475569]">Sources d&apos;informations et fréquence de rafraîchissement</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
         1. SOURCE SELECTION
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Rss className="w-3.5 h-3.5" />
          Sources actives
        </p>
        <div className="space-y-1">
          {RSS_SOURCES_LIST.map((source) => {
            const isChecked = settings.activeSources.includes(source.id);
            return (
              <motion.label
                key={source.id}
                htmlFor={`source-${source.id}`}
                className={`
                  flex items-center justify-between p-3 rounded-xl cursor-pointer
                  border transition-all duration-300
                  ${isChecked
                    ? 'border-amber-400/20 bg-amber-400/[0.04]'
                    : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
                  }
                `}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`source-${source.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggleSource(source.id, !!checked)}
                    className="data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=unchecked]:bg-white/[0.06] data-[state=unchecked]:border-white/[0.12]"
                  />
                  <div>
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      isChecked ? 'text-[#e2e8f0]' : 'text-[#64748b]'
                    }`}>
                      {source.name}
                    </span>
                  </div>
                </div>
                <Badge className={`
                  border-0 text-[9px] font-semibold px-2 py-0.5 rounded-full
                  ${source.category === 'sport'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : source.category === 'horoscope'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-white/[0.06] text-[#64748b]'
                  }
                `}>
                  {CATEGORY_LABELS[source.category] ?? source.category}
                </Badge>
              </motion.label>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         2. REFRESH INTERVAL
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#64748b]" />
          <Label className="text-xs font-medium text-[#94a3b8]">Intervalle de rafraîchissement</Label>
        </div>
        <Select
          value={String(settings.refreshIntervalMin)}
          onValueChange={handleRefreshChange}
        >
          <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-[#e2e8f0] text-sm h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFRESH_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={String(opt.value)}
                className="text-[#e2e8f0]"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         3. TEST HEADLINES
         ═══════════════════════════════════════════════════ */}
      <Button
        variant="outline"
        onClick={handleTest}
        disabled={testing || saving || settings.activeSources.length === 0}
        className="
          w-full flex items-center justify-center gap-2
          h-11 min-h-[44px]
          bg-amber-400/5 border-amber-400/15
          hover:bg-amber-400/10 hover:border-amber-400/25
          text-amber-400 font-medium text-sm
          transition-all duration-300
          rounded-xl
          disabled:opacity-40
        "
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Récupération en cours…
          </>
        ) : (
          <>
            <Newspaper className="w-4 h-4" />
            Tester les actualités
          </>
        )}
      </Button>

      {/* ── Headlines results ── */}
      <AnimatePresence>
        {headlines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="glass-gold rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-medium text-amber-400/70 flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Derniers titres
              </p>
              {headlines.map((h, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-amber-400/40 font-mono mt-0.5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0] leading-snug">{h.title}</p>
                    <p className="text-[10px] text-[#475569] mt-0.5">{h.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {testError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{testError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
