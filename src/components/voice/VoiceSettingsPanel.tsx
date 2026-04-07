'use client';

/* ═══════════════════════════════════════════════════════
   VoiceSettingsPanel — Voice Assistant Settings

   Configuration panel for the voice assistant system:
   - Enable/disable toggle
   - Voice speed slider (0.5x – 2x)
   - Volume slider (0 – 100%)
   - Language dropdown (fr-FR, en-US, es-ES)
   - Conversation window duration slider (5s – 30s)
   - "Test voice" button

   Uses shadcn/ui: Switch, Slider, Select, Button, Label, Card.
   Dark Luxe glassmorphism styling. All labels in French.
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  Gauge,
  Globe,
  Clock,
  MessageSquare,
  Mic,
  MicOff,
  ShieldCheck,
} from 'lucide-react';

import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Types ── */

interface VoiceSettingsPanelProps {
  voiceSettings: {
    enabled: boolean;
    rate: number;           // 0.5 – 2.0
    volume: number;         // 0.0 – 1.0
    language: string;       // 'fr-FR', 'en-US', 'es-ES'
    conversationWindow: number; // 5 – 30 seconds
  };
  onSave: (settings: VoiceSettingsPanelProps['voiceSettings']) => void;
}

/* ── Language Options ── */

const languages = [
  { value: 'fr-FR', label: 'Français' },
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Español' },
] as const;

/* ── Slider Row Component ── */

function SettingsSlider({
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-[#64748b]" />
          <Label className="text-xs font-medium text-[#94a3b8]">{label}</Label>
        </div>
        <span className="text-xs font-mono text-[#64748b] tabular-nums">
          {displayValue}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

/* ── Main Component ── */

export function VoiceSettingsPanel({
  voiceSettings: settings,
  onSave,
}: VoiceSettingsPanelProps) {
  const [local, setLocal] = useState(settings);
  const [testing, setTesting] = useState(false);

  const hasChanges =
    local.enabled !== settings.enabled ||
    local.rate !== settings.rate ||
    local.volume !== settings.volume ||
    local.language !== settings.language ||
    local.conversationWindow !== settings.conversationWindow;

  const handleChange = useCallback(
    <K extends keyof typeof local>(key: K, value: (typeof local)[K]) => {
      setLocal((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSave(local);
  }, [local, onSave]);

  const handleTestVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    setTesting(true);

    const sampleSentences: Record<string, string> = {
      'fr-FR': 'Bonjour, je suis votre maison consciente. Comment puis-je vous aider ?',
      'en-US': 'Hello, I am your conscious home. How can I help you?',
      'es-ES': 'Hola, soy tu hogar consciente. ¿Cómo puedo ayudarte?',
    };

    const utterance = new SpeechSynthesisUtterance(
      sampleSentences[local.language] ?? sampleSentences['fr-FR'],
    );
    utterance.lang = local.language;
    utterance.rate = local.rate;
    utterance.volume = local.volume;

    utterance.onend = () => setTesting(false);
    utterance.onerror = () => setTesting(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [local.language, local.rate, local.volume]);

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${
              local.enabled
                ? 'bg-amber-400/10'
                : 'bg-white/5'
            }`}
          >
            {local.enabled ? (
              <Mic className="w-4 h-4 text-amber-400" />
            ) : (
              <MicOff className="w-4 h-4 text-[#475569]" />
            )}
          </div>
          <div>
            <h3 className="font-serif font-semibold text-sm text-[#e2e8f0]">
              Assistant vocal
            </h3>
            <p className="text-[10px] text-[#475569]">
              {local.enabled ? 'Actif — 100% local' : 'Désactivé'}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <Switch
          checked={local.enabled}
          onCheckedChange={(checked) => handleChange('enabled', checked)}
          aria-label="Activer l'assistant vocal"
        />
      </div>

      {/* ── Settings (only when enabled) ── */}
      {local.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="space-y-5 mb-5">
            {/* Voice Speed */}
            <SettingsSlider
              label="Vitesse de la voix"
              icon={Gauge}
              value={local.rate}
              min={0.5}
              max={2}
              step={0.1}
              displayValue={`${local.rate.toFixed(1)}×`}
              onChange={(v) => handleChange('rate', v)}
            />

            {/* Volume */}
            <SettingsSlider
              label="Volume"
              icon={Volume2}
              value={local.volume}
              min={0}
              max={1}
              step={0.05}
              displayValue={`${Math.round(local.volume * 100)}%`}
              onChange={(v) => handleChange('volume', v)}
            />

            {/* Language */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#64748b]" />
                <Label className="text-xs font-medium text-[#94a3b8]">
                  Langue
                </Label>
              </div>
              <Select
                value={local.language}
                onValueChange={(v) => handleChange('language', v)}
              >
                <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-[#e2e8f0] text-sm h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
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

            {/* Conversation Window */}
            <SettingsSlider
              label="Fenêtre de conversation"
              icon={Clock}
              value={local.conversationWindow}
              min={5}
              max={30}
              step={1}
              displayValue={`${local.conversationWindow}s`}
              onChange={(v) => handleChange('conversationWindow', v)}
            />
          </div>

          {/* Test Voice Button */}
          <Button
            variant="outline"
            onClick={handleTestVoice}
            disabled={testing}
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
            <motion.div
              animate={testing ? { rotate: 360 } : { rotate: 0 }}
              transition={testing ? { duration: 1.5, repeat: Infinity, ease: 'linear' } : {}}
            >
              <MessageSquare className="w-4 h-4" />
            </motion.div>
            {testing ? 'Lecture en cours…' : 'Tester la voix'}
          </Button>
        </motion.div>
      )}

      {/* ── Save Button ── */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/5"
        >
          <Button
            onClick={handleSave}
            className="
              w-full h-11 min-h-[44px]
              bg-gradient-gold text-[#0c0a09] font-semibold text-sm
              rounded-xl
            "
          >
            Enregistrer les modifications
          </Button>
        </motion.div>
      )}

      {/* ── Privacy Notice ── */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#475569] leading-relaxed">
            100% local — aucune donnée vocale envoyée à un serveur externe.
            La reconnaissance utilise les APIs natives du navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
