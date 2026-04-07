'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Globe,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  EyeOff,
  Eye,
  Loader2,
  Save,
  Check,
  Plus,
  X,
  Sparkles,
  Monitor,
  Tag,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Settings {
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  seoOgImage: string | null;
  timezone: string;
  isQuietMode: boolean;
}

interface FieldError {
  field: string;
  message: string;
}

const DEFAULT_SETTINGS: Settings = {
  contactPhone: null,
  contactEmail: null,
  contactAddress: null,
  seoTitle: null,
  seoDescription: null,
  seoKeywords: [],
  seoOgImage: null,
  timezone: 'Europe/Paris',
  isQuietMode: false,
};

const COMMON_TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Zurich',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Lisbon',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Toronto',
  'America/Montreal',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Casablanca',
];

/* ═══════════════════════════════════════════════════════
   ANIMATION
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ═══════════════════════════════════════════════════════
   INPUT FIELD COMPONENT
   ═══════════════════════════════════════════════════════ */

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  icon: Icon,
  maxLength,
  rightElement,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  icon?: React.ElementType;
  maxLength?: number;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-[oklch(0.60_0.02_260)] font-medium">{label}</Label>
        {maxLength && value.length > 0 && (
          <span className={`text-[10px] font-mono ${value.length > maxLength ? 'text-[#f87171]' : 'text-[oklch(0.40_0.02_260)]'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.40_0.02_260)] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          type={type}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`
            bg-black/30 border-white/[0.08] text-[#e2e8f0] placeholder:text-[oklch(0.35_0.02_260)]
            rounded-xl h-10 text-sm
            focus:ring-1 focus:ring-offset-0 transition-all duration-300
            ${Icon ? 'pl-10' : 'pl-3'} ${rightElement ? 'pr-20' : 'pr-3'}
            ${error
              ? 'border-[#f87171]/50 focus:border-[#f87171] focus:ring-[#f87171]/20'
              : focused
                ? 'border-[var(--accent-primary)]/40 focus:border-[var(--accent-primary)]/60 focus:ring-[var(--accent-primary)]/20'
                : 'hover:border-white/[0.15]'
            }
          `}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] text-[#f87171] flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-[#f87171]" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KEYWORD TAG INPUT
   ═══════════════════════════════════════════════════════ */

function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (kw: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addKeyword = () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= 15) return;
    onChange([...keywords, trimmed]);
    setInput('');
  };

  const removeKeyword = (kw: string) => {
    onChange(keywords.filter((k) => k !== kw));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.40_0.02_260)]" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="Ajouter un mot-clé..."
            maxLength={40}
            className="bg-black/30 border-white/[0.08] text-[#e2e8f0] placeholder:text-[oklch(0.35_0.02_260)] rounded-xl h-9 text-sm pl-10 pr-3 focus:border-[var(--accent-primary)]/40 focus:ring-1 focus:ring-[var(--accent-primary)]/20"
          />
        </div>
        <Button
          onClick={addKeyword}
          disabled={!input.trim() || keywords.length >= 15}
          size="sm"
          className="h-9 px-3 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20 text-xs rounded-xl transition-all duration-300 disabled:opacity-30 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <motion.div
              key={kw}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/8 border border-[var(--accent-primary)]/15 text-xs text-[var(--accent-primary)]"
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                className="hover:text-[#f87171] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          <span className="text-[10px] text-[oklch(0.40_0.02_260)] self-center ml-1">
            {keywords.length}/15
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  color = 'text-[var(--accent-primary)]',
  bgColor = 'bg-[var(--accent-primary)]/10',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">{title}</h2>
        <p className="text-[10px] text-[#475569]">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function HouseholdSettingsPanel() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner' || user?.role === 'superadmin';

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  /* ── Fetch settings ── */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/household/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.settings) {
          setSettings(json.settings);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) fetchSettings();
    else setLoading(false);
  }, [isOwner, fetchSettings]);

  /* ── Update a field ── */
  const updateField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field
    setErrors((prev) => prev.filter((e) => e.field !== key));
  };

  /* ── Save section ── */
  const saveSection = async (section: string, fields: Record<string, unknown>) => {
    // Clear previous errors
    setErrors([]);

    try {
      setSaving(true);
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          // Transform Zod field errors
          const fieldErrors: FieldError[] = Object.entries(json.details).map(
            ([field, messages]) => ({
              field,
              message: (messages as string[]).join(', '),
            })
          );
          setErrors(fieldErrors);
          toast.error('Veuillez corriger les erreurs');
        } else {
          toast.error(json.error || 'Erreur lors de la sauvegarde');
        }
        return;
      }

      // Update local state from response
      if (json.success && json.settings) {
        setSettings(json.settings);
      }

      setSavedSection(section);
      toast.success('Paramètres enregistrés');
      setTimeout(() => setSavedSection(null), 2000);
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  /* ── Non-owner: info banner ── */
  if (!isOwner) {
    return (
      <div className="glass rounded-2xl p-6 inner-glow text-center">
        <div className="p-3 bg-white/[0.05] rounded-full w-fit mx-auto mb-3">
          <EyeOff className="w-6 h-6 text-[oklch(0.40_0.02_260)]" />
        </div>
        <p className="text-sm text-[oklch(0.60_0.02_260)]">
          Ces paramètres sont réservés au propriétaire du foyer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════
         SECTION 1 — IDENTITÉ DU FOYER
         ═══════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader
                icon={Building2}
                title="Identité du foyer"
                description="Coordonnées et informations de contact"
                color="text-[#c77d5a]"
                bgColor="bg-[#c77d5a]/10"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() =>
                    saveSection('identity', {
                      contactPhone: settings.contactPhone || '',
                      contactEmail: settings.contactEmail || '',
                      contactAddress: settings.contactAddress || '',
                    })
                  }
                  disabled={saving}
                  size="sm"
                  className={`h-8 px-3 gap-1.5 text-xs rounded-lg transition-all duration-300 cursor-pointer ${
                    savedSection === 'identity'
                      ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/25'
                      : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20'
                  }`}
                >
                  {saving && savedSection !== 'identity' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSection === 'identity' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savedSection === 'identity' ? 'Enregistré' : 'Enregistrer'}
                </Button>
              </motion.div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Téléphone"
                name="contactPhone"
                value={settings.contactPhone || ''}
                onChange={(v) => updateField('contactPhone', v || null)}
                placeholder="+33 1 23 45 67 89"
                icon={Phone}
                error={getError('contactPhone')}
              />

              <FormField
                label="Email de contact"
                name="contactEmail"
                value={settings.contactEmail || ''}
                onChange={(v) => updateField('contactEmail', v || null)}
                placeholder="contact@maison-exemple.com"
                icon={Mail}
                type="email"
                error={getError('contactEmail')}
              />

              <FormField
                label="Adresse physique"
                name="contactAddress"
                value={settings.contactAddress || ''}
                onChange={(v) => updateField('contactAddress', v || null)}
                placeholder="12 Rue de la Paix, 75002 Paris"
                icon={MapPin}
                error={getError('contactAddress')}
                maxLength={300}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
         SECTION 2 — SEO & VISIBILITÉ
         ═══════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader
                icon={Search}
                title="SEO & Visibilité"
                description="Balises meta pour les moteurs de recherche"
                color="text-[#34d399]"
                bgColor="bg-[#34d399]/10"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() =>
                    saveSection('seo', {
                      seoTitle: settings.seoTitle || '',
                      seoDescription: settings.seoDescription || '',
                      seoKeywords: settings.seoKeywords,
                      seoOgImage: settings.seoOgImage || '',
                    })
                  }
                  disabled={saving}
                  size="sm"
                  className={`h-8 px-3 gap-1.5 text-xs rounded-lg transition-all duration-300 cursor-pointer ${
                    savedSection === 'seo'
                      ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/25'
                      : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20'
                  }`}
                >
                  {saving && savedSection !== 'seo' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSection === 'seo' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savedSection === 'seo' ? 'Enregistré' : 'Enregistrer'}
                </Button>
              </motion.div>
            </div>

            <div className="space-y-4">
              {/* SEO Preview */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/[0.04]">
                <p className="text-[10px] text-[oklch(0.40_0.02_260)] mb-2 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Aperçu Google
                </p>
                <p className="text-[#8ab4f8] text-sm truncate">
                  {settings.seoTitle || 'Maison Consciente — L\'Habitation Intelligente'}
                </p>
                <p className="text-[#bdc1c6] text-xs mt-0.5 truncate">
                  maison-consciente.fr
                </p>
                <p className="text-[#969ba1] text-xs mt-1 line-clamp-2">
                  {settings.seoDescription || 'Transformez votre demeure en espace intelligent et sensoriel. QR codes, suivi de présence, suggestions contextuelles.'}
                </p>
              </div>

              <FormField
                label="Titre SEO"
                name="seoTitle"
                value={settings.seoTitle || ''}
                onChange={(v) => updateField('seoTitle', v || null)}
                placeholder="Maison Consciente — Hébergement de Charme à Paris"
                icon={Sparkles}
                error={getError('seoTitle')}
                maxLength={70}
                rightElement={
                  settings.seoTitle ? (
                    <Badge className="text-[9px] px-1.5 py-0 bg-[#34d399]/10 text-[#34d399] border-0 rounded">
                      {settings.seoTitle.length}/70
                    </Badge>
                  ) : undefined
                }
              />

              <FormField
                label="Meta Description"
                name="seoDescription"
                value={settings.seoDescription || ''}
                onChange={(v) => updateField('seoDescription', v || null)}
                placeholder="Découvrez un hébergement unique au cœur de Paris, alliant confort et technologie..."
                icon={Globe}
                error={getError('seoDescription')}
                maxLength={160}
                rightElement={
                  settings.seoDescription ? (
                    <Badge className="text-[9px] px-1.5 py-0 bg-[#34d399]/10 text-[#34d399] border-0 rounded">
                      {settings.seoDescription.length}/160
                    </Badge>
                  ) : undefined
                }
              />

              {/* Keywords */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[oklch(0.60_0.02_260)] font-medium">
                  Mots-clés
                </Label>
                <KeywordInput
                  keywords={settings.seoKeywords}
                  onChange={(kw) => updateField('seoKeywords', kw)}
                />
                {getError('seoKeywords') && (
                  <p className="text-[11px] text-[#f87171]">{getError('seoKeywords')}</p>
                )}
              </div>

              <FormField
                label="Image OG (URL)"
                name="seoOgImage"
                value={settings.seoOgImage || ''}
                onChange={(v) => updateField('seoOgImage', v || null)}
                placeholder="https://example.com/og-image.jpg"
                icon={Globe}
                type="url"
                error={getError('seoOgImage')}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════
         SECTION 3 — PRÉFÉRENCES SYSTÈME
         ═══════════════════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <SectionHeader
                icon={Monitor}
                title="Préférences système"
                description="Fuseau horaire et modes d'affichage"
                color="text-[#818cf8]"
                bgColor="bg-[#818cf8]/10"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={() =>
                    saveSection('preferences', {
                      timezone: settings.timezone,
                      isQuietMode: settings.isQuietMode,
                    })
                  }
                  disabled={saving}
                  size="sm"
                  className={`h-8 px-3 gap-1.5 text-xs rounded-lg transition-all duration-300 cursor-pointer ${
                    savedSection === 'preferences'
                      ? 'bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/25'
                      : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/20'
                  }`}
                >
                  {saving && savedSection !== 'preferences' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : savedSection === 'preferences' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savedSection === 'preferences' ? 'Enregistré' : 'Enregistrer'}
                </Button>
              </motion.div>
            </div>

            <div className="space-y-5">
              {/* Timezone select */}
              <div className="space-y-1.5">
                <Label className="text-xs text-[oklch(0.60_0.02_260)] font-medium flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Fuseau horaire
                </Label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                  className="w-full bg-black/30 border border-white/[0.08] text-[#e2e8f0] rounded-xl h-10 text-sm pl-3 pr-8 appearance-none cursor-pointer focus:border-[#818cf8]/40 focus:ring-1 focus:ring-[#818cf8]/20 transition-all duration-300 hover:border-white/[0.15]"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz} className="bg-[#0a0a12] text-[#e2e8f0]">
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {getError('timezone') && (
                  <p className="text-[11px] text-[#f87171]">{getError('timezone')}</p>
                )}
              </div>

              {/* Quiet mode toggle */}
              <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#818cf8]/10 rounded-lg">
                    {settings.isQuietMode ? (
                      <EyeOff className="w-4 h-4 text-[#818cf8]" />
                    ) : (
                      <Eye className="w-4 h-4 text-[#818cf8]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e2e8f0]">Mode discret</p>
                    <p className="text-[10px] text-[#475569]">
                      Réduit les animations et les notifications sonores
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.isQuietMode}
                  onCheckedChange={(checked) => updateField('isQuietMode', checked)}
                  className="data-[state=checked]:bg-[#818cf8] data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>

              {settings.isQuietMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-[#818cf8]/5 rounded-lg p-3 border border-[#818cf8]/10"
                >
                  <p className="text-[11px] text-[#818cf8]/70 leading-relaxed">
                    🔇 Le mode discret désactive les carillons de scan, réduit les animations
                    parallaxe, et minimise les effets visuels. Ideal pour une utilisation
                    discrète en présence de clients ou pendant les heures de repos.
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
