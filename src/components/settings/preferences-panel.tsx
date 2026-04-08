'use client';

/* ═══════════════════════════════════════════════════════
   PreferencesPanel — Memory & Preferences Settings

   Configuration panel for learned preferences and memory:
   - Detected Preferences display (music, zodiac, dietary, interests)
   - Manual Overrides (genre dropdown, zodiac dropdown, dietary multi-select)
   - Learning Mode Toggle
   - Clear Memory Button (with confirmation dialog)

   Uses shadcn/ui: Switch, Select, Button, Badge, Separator, Label, Dialog.
   GlassCard + Dark Luxe amber/gold styling. All labels in French.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Music,
  Star,
  UtensilsCrossed,
  Heart,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { GlassCard } from '@/components/shared/glass-card';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  MUSIC_GENRES,
  ZODIAC_SIGNS,
  DIETARY_RESTRICTIONS,
  DEFAULT_USER_PREFERENCES,
  type DefaultUserPreferences,
} from '@/lib/config';

/* ── Types ── */

type PreferencesData = DefaultUserPreferences;

/* ── Main Component ── */

export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<PreferencesData>(DEFAULT_USER_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showDietaryPicker, setShowDietaryPicker] = useState(false);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // ── Fetch preferences ──
  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch('/api/household/settings');
        if (res.ok) {
          const data = await res.json();
          const p = data.preferences as Partial<PreferencesData> | undefined;
          if (p) {
            setPrefs(prev => ({
              musicGenre: p.musicGenre ?? prev.musicGenre,
              zodiacSign: p.zodiacSign ?? prev.zodiacSign,
              dietaryRestrictions: Array.isArray(p.dietaryRestrictions)
                ? p.dietaryRestrictions
                : prev.dietaryRestrictions,
              learningMode: p.learningMode ?? prev.learningMode,
              knownInterests: Array.isArray(p.knownInterests)
                ? p.knownInterests
                : prev.knownInterests,
            }));
          }
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, []);

  // ── Save preferences ──
  const savePreferences = useCallback(async (newPrefs: PreferencesData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: newPrefs }),
      });
      if (res.ok) {
        toast.success('Préférences sauvegardées');
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
  const handleMusicChange = useCallback((value: string) => {
    const updated = { ...prefs, musicGenre: value || null };
    setPrefs(updated);
    savePreferences(updated);
  }, [prefs, savePreferences]);

  const handleZodiacChange = useCallback((value: string) => {
    const updated = { ...prefs, zodiacSign: value || null };
    setPrefs(updated);
    savePreferences(updated);
  }, [prefs, savePreferences]);

  const handleLearningToggle = useCallback((enabled: boolean) => {
    const updated = { ...prefs, learningMode: enabled };
    setPrefs(updated);
    savePreferences(updated);
  }, [prefs, savePreferences]);

  const openDietaryPicker = useCallback(() => {
    setSelectedDietary([...prefs.dietaryRestrictions]);
    setShowDietaryPicker(true);
  }, [prefs.dietaryRestrictions]);

  const handleDietaryToggle = useCallback((restriction: string) => {
    setSelectedDietary(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction],
    );
  }, []);

  const handleDietarySave = useCallback(() => {
    const updated = { ...prefs, dietaryRestrictions: selectedDietary };
    setPrefs(updated);
    savePreferences(updated);
    setShowDietaryPicker(false);
  }, [prefs, selectedDietary, savePreferences]);

  // ── Clear memory ──
  const handleClearMemory = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: DEFAULT_USER_PREFERENCES,
        }),
      });
      if (res.ok) {
        setPrefs(DEFAULT_USER_PREFERENCES);
        toast.success('Mémoire effacée — toutes les préférences ont été réinitialisées');
        setShowClearDialog(false);
      } else {
        toast.error('Erreur lors de la réinitialisation');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setClearing(false);
    }
  }, []);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
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
          <Brain className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h2 className="font-serif font-semibold text-[#e2e8f0] text-sm">Mémoire &amp; Préférences</h2>
          <p className="text-[10px] text-[#475569]">Préférences apprises et réglages manuels</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
         1. DETECTED PREFERENCES
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Préférences détectées
        </p>
        <div className="grid grid-cols-2 gap-2">
          {/* Music Genre */}
          <div className="glass-gold rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Genre musical</span>
            </div>
            <p className="text-sm font-medium text-[#e2e8f0]">
              {prefs.musicGenre
                ? prefs.musicGenre.charAt(0).toUpperCase() + prefs.musicGenre.slice(1)
                : <span className="text-[#475569] italic">Non défini</span>
              }
            </p>
          </div>

          {/* Zodiac Sign */}
          <div className="glass-gold rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Signe zodiac</span>
            </div>
            <p className="text-sm font-medium text-[#e2e8f0]">
              {prefs.zodiacSign
                ? prefs.zodiacSign.charAt(0).toUpperCase() + prefs.zodiacSign.slice(1)
                : <span className="text-[#475569] italic">Non défini</span>
              }
            </p>
          </div>

          {/* Dietary Restrictions */}
          <div className="glass-gold rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Régime</span>
            </div>
            {prefs.dietaryRestrictions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {prefs.dietaryRestrictions.slice(0, 3).map(r => (
                  <Badge key={r} className="bg-amber-400/10 text-amber-400 border-0 text-[9px] px-1.5 py-0.5 rounded-full">
                    {r}
                  </Badge>
                ))}
                {prefs.dietaryRestrictions.length > 3 && (
                  <Badge className="bg-white/[0.06] text-[#64748b] border-0 text-[9px] px-1.5 py-0.5 rounded-full">
                    +{prefs.dietaryRestrictions.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#475569] italic">Aucun</p>
            )}
          </div>

          {/* Known Interests */}
          <div className="glass-gold rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Heart className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-[#475569] uppercase tracking-wider">Centres d&apos;intérêt</span>
            </div>
            {prefs.knownInterests.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {prefs.knownInterests.slice(0, 3).map(interest => (
                  <Badge key={interest} className="bg-amber-400/10 text-amber-400 border-0 text-[9px] px-1.5 py-0.5 rounded-full">
                    {interest}
                  </Badge>
                ))}
                {prefs.knownInterests.length > 3 && (
                  <Badge className="bg-white/[0.06] text-[#64748b] border-0 text-[9px] px-1.5 py-0.5 rounded-full">
                    +{prefs.knownInterests.length - 3}
                  </Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#475569] italic">Aucun</p>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         2. MANUAL OVERRIDES
         ═══════════════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider mb-3">
          Réglages manuels
        </p>
        <div className="space-y-3">
          {/* Music Genre */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#94a3b8]">Genre musical préféré</Label>
            <Select
              value={prefs.musicGenre ?? '_none'}
              onValueChange={(v) => handleMusicChange(v === '_none' ? '' : v)}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-[#e2e8f0] text-sm h-10">
                <SelectValue placeholder="Choisir un genre" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="_none" className="text-[#64748b]">— Aucun —</SelectItem>
                {MUSIC_GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre} className="text-[#e2e8f0]">
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zodiac Sign */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#94a3b8]">Signe zodiac</Label>
            <Select
              value={prefs.zodiacSign ?? '_none'}
              onValueChange={(v) => handleZodiacChange(v === '_none' ? '' : v)}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 text-[#e2e8f0] text-sm h-10">
                <SelectValue placeholder="Choisir un signe" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="_none" className="text-[#64748b]">— Aucun —</SelectItem>
                {ZODIAC_SIGNS.map((sign) => (
                  <SelectItem key={sign} value={sign} className="text-[#e2e8f0]">
                    {sign.charAt(0).toUpperCase() + sign.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Restrictions (multi-select via dialog) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#94a3b8]">Restrictions alimentaires</Label>
            <Button
              variant="outline"
              onClick={openDietaryPicker}
              className="
                w-full justify-start h-10
                bg-white/[0.04] border-white/10
                text-[#e2e8f0] text-sm
                hover:bg-white/[0.06] hover:border-white/[0.15]
                rounded-xl transition-all duration-300
              "
            >
              {prefs.dietaryRestrictions.length > 0
                ? `${prefs.dietaryRestrictions.length} restriction${prefs.dietaryRestrictions.length > 1 ? 's' : ''} sélectionnée${prefs.dietaryRestrictions.length > 1 ? 's' : ''}`
                : 'Choisir des restrictions…'
              }
            </Button>
          </div>
        </div>
      </div>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         3. LEARNING MODE TOGGLE
         ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#e2e8f0]">Mode apprentissage</p>
            <p className="text-[10px] text-[#475569]">
              Suggestions proactives basées sur vos habitudes
            </p>
          </div>
        </div>
        <Switch
          checked={prefs.learningMode}
          onCheckedChange={handleLearningToggle}
          className="data-[state=checked]:bg-amber-400 data-[state=unchecked]:bg-white/[0.08]"
        />
      </div>

      <AnimatePresence>
        {prefs.learningMode && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-amber-400/50 ml-12 mb-4 leading-relaxed"
          >
            L&apos;assistant apprend de vos interactions pour vous proposer des suggestions personnalisées (recettes, musique, horoscope, etc.).
          </motion.p>
        )}
      </AnimatePresence>

      <Separator className="bg-white/[0.06] mb-5" />

      {/* ═══════════════════════════════════════════════════
         4. CLEAR MEMORY BUTTON
         ═══════════════════════════════════════════════════ */}
      <Button
        variant="outline"
        onClick={() => setShowClearDialog(true)}
        disabled={saving || clearing}
        className="
          w-full flex items-center justify-center gap-2
          h-11 min-h-[44px]
          bg-red-500/5 border-red-500/15
          hover:bg-red-500/10 hover:border-red-500/25
          text-red-400 font-medium text-sm
          transition-all duration-300
          rounded-xl
        "
      >
        <Trash2 className="w-4 h-4" />
        Effacer toute la mémoire
      </Button>

      {/* ═══════════════════════════════════════════════════
         DIALOG — Clear Memory Confirmation
         ═══════════════════════════════════════════════════ */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Effacer la mémoire
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Cette action est irréversible. Toutes les préférences apprises seront supprimées :
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 py-2 text-sm text-[#94a3b8]">
            <li className="flex items-center gap-2">
              <X className="w-3 h-3 text-red-400" />
              Genre musical
            </li>
            <li className="flex items-center gap-2">
              <X className="w-3 h-3 text-red-400" />
              Signe zodiac
            </li>
            <li className="flex items-center gap-2">
              <X className="w-3 h-3 text-red-400" />
              Restrictions alimentaires
            </li>
            <li className="flex items-center gap-2">
              <X className="w-3 h-3 text-red-400" />
              Centres d&apos;intérêt
            </li>
          </ul>
          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowClearDialog(false)}
              disabled={clearing}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleClearMemory}
              disabled={clearing}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300"
            >
              {clearing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Effacement…
                </>
              ) : (
                'Confirmer l&apos;effacement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════
         DIALOG — Dietary Restrictions Picker
         ═══════════════════════════════════════════════════ */}
      <Dialog open={showDietaryPicker} onOpenChange={setShowDietaryPicker}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-white/[0.08] p-6 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#e2e8f0]">
              Restrictions alimentaires
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              Sélectionnez vos restrictions alimentaires
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-1 py-2 max-h-64">
            {DIETARY_RESTRICTIONS.map((restriction) => {
              const isSelected = selectedDietary.includes(restriction);
              return (
                <motion.label
                  key={restriction}
                  htmlFor={`dietary-${restriction}`}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-amber-400/[0.06]'
                      : 'hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    id={`dietary-${restriction}`}
                    checked={isSelected}
                    onChange={() => handleDietaryToggle(restriction)}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200
                    ${isSelected
                      ? 'bg-amber-400 border-amber-400'
                      : 'border-white/[0.15] bg-white/[0.04]'
                    }
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-[#0c0a09]" />}
                  </div>
                  <span className={`text-sm transition-colors duration-200 ${
                    isSelected ? 'text-[#e2e8f0]' : 'text-[#94a3b8]'
                  }`}>
                    {restriction.charAt(0).toUpperCase() + restriction.slice(1)}
                  </span>
                </motion.label>
              );
            })}
          </div>
          <DialogFooter className="gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowDietaryPicker(false)}
              className="text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/[0.04] transition-all duration-300"
            >
              Annuler
            </Button>
            <Button
              onClick={handleDietarySave}
              disabled={saving}
              className="bg-gradient-gold text-[#0c0a09] font-semibold rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmer ({selectedDietary.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
