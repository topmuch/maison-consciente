'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, RefreshCw, Save, Loader2, Mic, Globe,
  Sparkles, Settings, Thermometer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassCard } from '@/components/shared/glass-card';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface AIConfigEntry {
  key: string;
  value: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select';
  description: string;
  options?: string[];
}

interface AIConfigApiResponse {
  key: string;
  value: string;
  label: string;
  description: string;
  type: string;
}

interface AIConfigData {
  config: AIConfigApiResponse[];
  apiConfigs: Array<{
    id: string;
    serviceKey: string;
    isActive: boolean;
    status: string;
    lastTested?: string;
  }>;
}

/* ═══════════════════════════════════════════════════════
   CONFIG FIELD DEFINITIONS
   ═══════════════════════════════════════════════════════ */

const configFields: AIConfigEntry[] = [
  {
    key: 'ai_model',
    value: 'gemini-2.0-flash',
    label: 'Modèle IA',
    type: 'select',
    description: 'Le modèle de langage utilisé pour les conversations',
    options: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet'],
  },
  {
    key: 'ai_temperature',
    value: '0.7',
    label: 'Température',
    type: 'number',
    description: 'Créativité des réponses (0.0 = précis, 1.0 = créatif)',
  },
  {
    key: 'ai_max_tokens',
    value: '4096',
    label: 'Tokens maximum',
    type: 'number',
    description: 'Longueur maximale des réponses en tokens',
  },
  {
    key: 'ai_language',
    value: 'fr-FR',
    label: 'Langue principale',
    type: 'select',
    description: 'Langue par défaut de l\'assistant',
    options: ['fr-FR', 'en-US', 'en-GB', 'es-ES', 'de-DE', 'it-IT', 'pt-BR', 'ar-SA'],
  },
  {
    key: 'ai_voice_enabled',
    value: 'true',
    label: 'Voix IA activée',
    type: 'boolean',
    description: 'Activer les réponses vocales de l\'assistant',
  },
  {
    key: 'ai_system_prompt',
    value: 'Tu es Maellis, l\'assistant intelligent de la Maison Consciente. Tu aides les utilisateurs dans leur quotidien avec bienveillance et expertise.',
    label: 'Prompt système',
    type: 'textarea',
    description: 'Instructions personnalisées pour le comportement de l\'IA',
  },
];

/* ═══════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ═══════════════════════════════════════════════════════
   AI CONFIG PANEL
   ═══════════════════════════════════════════════════════ */

export function AIConfigPanel() {
  const [data, setData] = useState<AIConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-config');
      if (res.ok) {
        const result = await res.json();
        setData(result);
        // Initialize edited values from array
        const initial: Record<string, string> = {};
        const configs = Array.isArray(result.config) ? result.config : [];
        for (const entry of configs) {
          initial[entry.key] = entry.value;
        }
        setEditedValues(initial);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async (field: AIConfigEntry) => {
    setSaving(field.key);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: field.key, value: editedValues[field.key] || field.value }),
      });
      if (res.ok) {
        toast.success(`${field.label} mis à jour`);
        fetchConfig();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erreur');
      }
    } catch { toast.error('Erreur réseau'); } finally {
      setSaving(null);
    }
  };

  const getValue = (field: AIConfigEntry) => {
    const edited = editedValues[field.key];
    if (edited !== undefined) return edited;
    const fromApi = Array.isArray(data?.config)
      ? data.config.find((c) => c.key === field.key)?.value
      : undefined;
    return fromApi ?? field.value;
  };

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-foreground">Configuration IA</h3>
              <p className="text-xs text-muted-foreground">Gérez les paramètres de l&apos;intelligence artificielle</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ═══ CONFIG FIELDS ═══ */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="p-5">
              <Skeleton className="h-4 w-32 bg-muted mb-3" />
              <Skeleton className="h-10 w-full bg-muted" />
              <Skeleton className="h-3 w-48 bg-muted mt-2" />
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {configFields.map((field, i) => (
            <motion.div key={field.key} custom={0.1 + i * 0.05} variants={fadeUp} initial="hidden" animate="visible">
              <GlassCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {field.key === 'ai_model' && <Sparkles className="w-4 h-4 text-violet-500" />}
                    {field.key === 'ai_temperature' && <Thermometer className="w-4 h-4 text-amber-500" />}
                    {field.key === 'ai_language' && <Globe className="w-4 h-4 text-blue-500" />}
                    {field.key === 'ai_voice_enabled' && <Mic className="w-4 h-4 text-emerald-500" />}
                    {field.key === 'ai_max_tokens' && <Settings className="w-4 h-4 text-muted-foreground" />}
                    <Label className="text-sm font-medium text-foreground">{field.label}</Label>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSave(field)}
                    disabled={saving === field.key}
                    className="bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 text-xs rounded-lg h-8"
                  >
                    {saving === field.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span className="ml-1.5">Enregistrer</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{field.description}</p>

                {field.type === 'select' && (
                  <Select
                    value={getValue(field)}
                    onValueChange={(v) => setEditedValues((prev) => ({ ...prev, [field.key]: v }))}
                  >
                    <SelectTrigger className="w-full max-w-sm bg-muted/50 border-border rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'number' && (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={field.key === 'ai_temperature' ? '2' : field.key === 'ai_max_tokens' ? '8192' : undefined}
                    value={getValue(field)}
                    onChange={(e) => setEditedValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full max-w-sm bg-muted/50 border-border rounded-xl"
                  />
                )}

                {field.type === 'boolean' && (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={getValue(field) === 'true'}
                      onCheckedChange={(checked) => setEditedValues((prev) => ({ ...prev, [field.key]: String(checked) }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {getValue(field) === 'true' ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                )}

                {field.type === 'textarea' && (
                  <Textarea
                    rows={4}
                    value={getValue(field)}
                    onChange={(e) => setEditedValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-muted/50 border-border rounded-xl text-sm"
                  />
                )}

                {field.type === 'text' && (
                  <Input
                    value={getValue(field)}
                    onChange={(e) => setEditedValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full max-w-sm bg-muted/50 border-border rounded-xl"
                  />
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* ═══ API SERVICES STATUS ═══ */}
      <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="visible">
        <GlassCard className="p-5">
          <h3 className="text-base font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--accent-primary)]" />
            Services IA connectés
          </h3>
          {data?.apiConfigs && data.apiConfigs.length > 0 ? (
            <div className="space-y-2">
              {data.apiConfigs.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 ${
                      entry.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500' :
                      entry.status === 'error' ? 'bg-red-500/10 text-red-500' :
                      'bg-muted/80 text-muted-foreground'
                    }`}>
                      {entry.status === 'ok' ? 'OK' : entry.status === 'error' ? 'Erreur' : 'Non testé'}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{entry.serviceKey}</span>
                  </div>
                  <Badge className={`text-[9px] px-2 py-0.5 rounded-full border-0 ${
                    entry.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/80 text-muted-foreground/70'
                  }`}>
                    {entry.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun service IA connecté</p>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
