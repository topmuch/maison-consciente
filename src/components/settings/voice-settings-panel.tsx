'use client';

/* ═══════════════════════════════════════════════════════
   VoiceSettingsPanel — Extended Voice Assistant Settings

   Configuration panel for the voice assistant system:
   - Assistant Name Selection (visual grid with golden border)
   - Wake Word Toggle
   - Speech Rate Slider (0.5 – 2.0)
   - Volume Slider (0 – 1)
   - Test Voice Button (TTS preview)
   - Language Selector (fr-FR, en-GB, es-ES, de-DE)

   Uses shadcn/ui: Switch, Slider, Select, Button, Badge, Separator, Label.
   GlassCard + Dark Luxe amber/gold styling. All labels in French.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Volume2,
  Sparkles,
  Languages,
  Check,
  Loader2,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from '@/components/shared/glass-card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
import {
  ASSISTANT_NAMES,
  DEFAULT_VOICE_SETTINGS,
  type AssistantName,
} from '@/lib/config';

/* ── Types ── */

interface VoiceSettingsData {
  wakeWord: string;
  wakeWordEnabled: boolean;
  rate: number;
  volume: number;
  language: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'fr-FR', label: 'Français' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'de-DE', label: 'Deutsch' },
] as const;

/* ── Animation ── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ── Main Component ── */

export function VoiceSettingsPanel() {
  const [settings, setSettings] = useState<VoiceSettingsData>(DEFAULT_VOICE_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<VoiceSettingsData>(DEFAULT_VOICE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // ── Fetch settings ──
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/household/settings');
        if (res.ok) {
          const data = await res.json();
          const vs = data.voiceSettings as Partial<VoiceSettingsData> | undefined;
          if (vs) {
            const merged: VoiceSettingsData = {
              wakeWord: vs.wakeWord ?? DEFAULT_VOICE_SETTINGS.wakeWord,
              wakeWordEnabled: vs.wakeWordEnabled ?? DEFAULT_VOICE_SETTINGS.wakeWordEnabled,
              rate: vs.rate ?? DEFAULT_VOICE_SETTINGS.rate,
              volume: vs.volume ?? DEFAULT_VOICE_SETTINGS.volume,
              language: vs.language ?? DEFAULT_VOICE_SETTINGS.language,
            };
            setSettings(merged);
            setOriginalSettings(merged);
          }
        }
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  // ── Save settings ──
  const saveSettings = useCallback(async (newSettings: VoiceSettingsData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceSettings: newSettings }),
      });
      if (res.ok) {
        setOriginalSettings(newSettings);
        toast.success('Paramètres vocaux sauvegardés');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Handlers ──
  const handleNameSelect = useCallback((name: string) => {
    const updated = { ...settings, wakeWord: name };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  const handleToggleWakeWord = useCallback((enabled: boolean) => {
    const updated = { ...settings, wakeWordEnabled: enabled };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  const handleRateChange = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, rate: value }));
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    setSettings(prev => ({ ...prev, volume: value }));
  }, []);

  const handleLanguageChange = useCallback((language: string) => {
    const updated = { ...settings, language };
    setSettings(updated);
    saveSettings(updated);
  }, [settings, saveSettings]);

  const handleRateCommit = useCallback(() => {
    if (settings.rate !== originalSettings.rate) {
      saveSettings(settings);
    }
  }, [settings, originalSettings, saveSettings]);

  const handleVolumeCommit = useCallback(() => {
    if (settings.volume !== originalSettings.volume) {
      saveSettings(settings);
    }
  }, [settings, originalSettings, saveSettings]);

  // ── Test Voice ──
  const handleTestVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    setTesting(true);

    const sampleSentences: Record<string, string> = {
      'fr-FR': `Bonjour, je suis ${settings.wakeWord}. Comment puis-je vous aider ?`,
      'en-GB': `Hello, I am ${settings.wakeWord}. How can I help you?`,
      'es-ES': `Hola, soy ${settings.wakeWord}. ¿Cómo puedo ayudarte?`,
      'de-DE': `Hallo, ich bin ${settings.wakeWord}. Wie kann ich Ihnen helfen?`,
    };

    const utterance = new SpeechSynthesisUtterance(
      sampleSentences[settings.language] ?? sampleSentences['fr-FR'],
    );
    utterance.lang = settings.language;
    utterance.rate = settings.rate;
    utterance.volume = settings.volume;

    utterance.onend = () => setTesting(false);
    utterance.onerror = () => setTesting(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [settings.wakeWord, settings.language, settings.rate, settings.volume]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.06] animate-pulse" />
            ))}
          </div>
          <div className="h-10 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 border border-white/[0.06]">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
          <Mic className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Assistant vocal</h2>
          <p className="text-[10px] text-[#475569]">Nom, voix et détection du mot-clé</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
         1. ASSISTANT NAME SELECTION
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Nom de l&apos;assistant
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {ASSISTANT_NAMES.map((name) => {
            const isSelected = settings.wakeWord === name;
            return (
              <motion.button
                key={name}
                type="button"
                onClick={() => handleNameSelect(name)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300
                  ${isSelected
                    ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                    : 'border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                  }
                `}
                style={isSelected ? {
                  backgroundColor: 'rgba(251,191,36,0.08)',
                } : {}}
              >
                <span className={`text-sm font-semibold transition-colors duration-300 ${
                  isSelected ? 'text-amber-400' : 'text-[#94a3b8]'
                }`}>
                  {name}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         2. WAKE WORD TOGGLE
         ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <Mic className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#e2e8f0]">
              Détection du mot-clé
            </p>
            <p className="text-[10px] text-[#475569]">
              Répondez quand vous dites &laquo;&nbsp;{settings.wakeWord}&nbsp;&raquo;
            </p>
          </div>
        </div>
        <Switch
          checked={settings.wakeWordEnabled}
          onCheckedChange={handleToggleWakeWord}
          className="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-white/[0.08]"
        />
      </div>

      <AnimatePresence>
        {!settings.wakeWordEnabled && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-amber-400/50 ml-12 mb-4 leading-relaxed"
          >
            La détection du mot-clé est désactivée. Vous devrez cliquer sur le microphone pour parler.
          </motion.p>
        )}
      </AnimatePresence>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         3. SPEECH RATE SLIDER
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-[#64748b]" />
            <Label className="text-xs font-medium text-[#94a3b8]">Vitesse de parole</Label>
          </div>
          <span className="text-xs font-mono text-[#64748b] tabular-nums">
            {settings.rate.toFixed(1)}×
          </span>
        </div>
        <Slider
          value={[settings.rate]}
          min={0.5}
          max={2.0}
          step={0.1}
          onValueChange={([v]) => handleRateChange(v)}
          onValueCommit={handleRateCommit}
          className="w-full"
        />
      </div>

      {/* ═══════════════════════════════════════════════════
         4. VOLUME SLIDER
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-[#64748b]" />
            <Label className="text-xs font-medium text-[#94a3b8]">Volume</Label>
          </div>
          <span className="text-xs font-mono text-[#64748b] tabular-nums">
            {Math.round(settings.volume * 100)}%
          </span>
        </div>
        <Slider
          value={[settings.volume]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([v]) => handleVolumeChange(v)}
          onValueCommit={handleVolumeCommit}
          className="w-full"
        />
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         5. LANGUAGE SELECTOR
         ═══════════════════════════════════════════════════ */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2">
          <Languages className="w-3.5 h-3.5 text-[#64748b]" />
          <Label className="text-xs font-medium text-[#94a3b8]">Langue de synthèse</Label>
        </div>
        <Select
          value={settings.language}
          onValueChange={handleLanguageChange}
        >
          <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-[#e2e8f0] text-sm h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((lang) => (
              <SelectItem
                key={lang.value}
                value={lang.value}
                className="text-[#e2e8f0]"
              >
                {lang.label} ({lang.value})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         6. TEST VOICE BUTTON
         ═══════════════════════════════════════════════════ */}
      <Button
        variant="outline"
        onClick={handleTestVoice}
        disabled={testing || saving}
        className="
          w-full flex items-center justify-center gap-2
          h-11 min-h-[44px]
          bg-amber-400/5 border-amber-400/15
          hover:bg-amber-400/10 hover:border-amber-400/25
          text-amber-400 font-medium text-sm
          transition-all duration-300
          rounded-xl
        "
      >
        {testing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Lecture en cours…
          </>
        ) : saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sauvegarde…
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            Tester la voix
          </>
        )}
      </Button>

      {/* ── Saving indicator ── */}
      {saving && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center justify-center gap-2"
        >
          <Badge className="bg-amber-400/10 text-amber-400 border-0 text-[10px] px-2 py-0.5">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Sauvegarde en cours…
          </Badge>
        </motion.div>
      )}

      {/* ── Privacy Notice ── */}
      <div className="mt-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#475569] leading-relaxed">
            100% local — aucune donnée vocale envoyée à un serveur externe.
            La synthèse vocale utilise les APIs natives du navigateur.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
