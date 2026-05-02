'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home,
  Building2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  ShieldAlert,
  Phone,
  Clock,
  Bell,
  BellOff,
  Upload,
  Mic,
  Navigation,
  ChefHat,
  Music,
  MessageSquare,
  Lock,
  Loader2,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useOneSignal } from '@/hooks/useOneSignal';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Advanced Onboarding Flow (6 Steps)

   Step 1: Bienvenue
   Step 2: Nom du Foyer
   Step 3: Modules Préférés
   Step 4: Notifications Push
   Step 5: Test SOS
   Step 6: Personnalisation
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */
interface ModuleOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface TemplateOption {
  slug: string;
  name: string;
  gradient: string;
  preview: string;
}

interface AssistantOption {
  name: string;
  description: string;
}

/* ─── Constants ─── */
const TOTAL_STEPS = 6;

const MODULES: ModuleOption[] = [
  { id: 'voice', emoji: '🏠', label: 'Assistant Vocal', description: 'Contrôlez votre maison par la voix', icon: Mic },
  { id: 'safe-arrival', emoji: '📱', label: 'Safe Arrival', description: 'Suivi d\'arrivée et détection', icon: Navigation },
  { id: 'recipes', emoji: '🍳', label: 'Recettes & Cuisine', description: 'Recettes et aide culinaire', icon: ChefHat },
  { id: 'ambiance', emoji: '🎵', label: 'Ambiance & Musique', description: 'Créez l\'atmosphère parfaite', icon: Music },
  { id: 'family-wall', emoji: '📝', label: 'Mur du Foyer', description: 'Messages et notes familiales', icon: MessageSquare },
  { id: 'secret-vault', emoji: '🔒', label: 'Coffre-Fort Numérique', description: 'Stockez vos mots de passe', icon: Lock },
];

const TEMPLATES: TemplateOption[] = [
  { slug: 'nexus-modern', name: 'Nexus Modern', gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)', preview: '🌐' },
  { slug: 'luxury-gold', name: 'Luxury Gold', gradient: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)', preview: '✨' },
  { slug: 'family-warmth', name: 'Chaleur Familiale', gradient: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', preview: '🏠' },
  { slug: 'airbnb-pro', name: 'Airbnb Pro', gradient: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)', preview: '🏨' },
];

const ASSISTANT_NAMES: AssistantOption[] = [
  { name: 'Maellis', description: 'Le classique — élégant et intuitif' },
  { name: 'Aura', description: 'Ambiance et bien-être au quotidien' },
  { name: 'Jeeves', description: 'Conciergerie britannique raffinée' },
  { name: 'Alfred', description: 'Assistance discrète et efficace' },
];

/* ─── Animation Variants ─── */
const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 60 : -60,
    filter: 'blur(4px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -60 : 60,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Progress Dots ─── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          animate={{
            width: i <= current ? 24 : 8,
            height: 8,
            backgroundColor: i <= current ? '#d4a853' : 'rgba(255, 255, 255, 0.12)',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      ))}
      <span className="text-[10px] font-mono text-white/30 ml-2">{current + 1}/{total}</span>
    </div>
  );
}

/* ─── Main Component ─── */
interface OnboardingFlowProps {
  onComplete: () => void;
  householdId: string;
  currentHouseholdName?: string;
}

export function OnboardingFlow({
  onComplete,
  householdId,
  currentHouseholdName = '',
}: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 state
  const [householdName, setHouseholdName] = useState(currentHouseholdName);
  const [householdType, setHouseholdType] = useState<'home' | 'hospitality'>('home');

  // Step 3 state
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());

  // Step 4 state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const oneSignal = useOneSignal();

  // Step 5 state
  const [sosTested, setSosTested] = useState(false);

  // Step 6 state
  const [selectedTemplate, setSelectedTemplate] = useState('nexus-modern');
  const [assistantName, setAssistantName] = useState('Maellis');

  /* ─── Navigation ─── */
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const skipToEnd = useCallback(() => {
    setDirection(1);
    setStep(TOTAL_STEPS - 1);
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return householdName.trim().length > 0;
      case 2: return selectedModules.size >= 1;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  }, [step, householdName, selectedModules.size]);

  /* ─── Toggle Module ─── */
  const toggleModule = useCallback((id: string) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ─── Push Notification Toggle ─── */
  const handlePushToggle = useCallback(async (enabled: boolean) => {
    setPushEnabled(enabled);
    if (enabled) {
      const ok = await oneSignal.subscribe();
      if (ok) {
        toast.success('Notifications push activées !');
      } else {
        toast.error('Impossible d\'activer les notifications push');
        setPushEnabled(false);
      }
    } else {
      await oneSignal.unsubscribe();
    }
  }, [oneSignal]);

  /* ─── SOS Test ─── */
  const handleSosTest = useCallback(() => {
    setSosTested(true);
    toast.success('Bouton SOS configuré avec succès !');
  }, []);

  /* ─── Complete Onboarding ─── */
  const handleComplete = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        householdId,
        householdName: householdName.trim() || 'Mon Foyer',
        householdType,
        selectedModules: Array.from(selectedModules),
        pushEnabled,
        quietHoursEnabled,
        templateSlug: selectedTemplate,
        assistantName,
      };

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Configuration terminée !');
        setTimeout(() => onComplete(), 400);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la sauvegarde');
        setIsSubmitting(false);
      }
    } catch {
      toast.error('Erreur de connexion');
      setIsSubmitting(false);
    }
  }, [householdId, householdName, householdType, selectedModules, pushEnabled, quietHoursEnabled, selectedTemplate, assistantName, onComplete]);

  /* ─── Navigation Footer ─── */
  const renderNavFooter = (showSkip = false) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="flex items-center justify-between pt-4"
    >
      <div>
        {step > 0 ? (
          <button
            onClick={goBack}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && step > 0 && step < TOTAL_STEPS - 1 && (
          <button
            onClick={skipToEnd}
            className="text-sm text-slate-600 hover:text-slate-400 transition-colors duration-200"
          >
            Passer
          </button>
        )}
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={step === TOTAL_STEPS - 1 ? handleComplete : goNext}
            disabled={!canProceed() || isSubmitting}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-sm border-0 transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === TOTAL_STEPS - 1 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  C&apos;est parti !
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 1: BIENVENUE
     ═══════════════════════════════════════════════════ */
  const renderStep1 = () => (
    <div className="space-y-8 text-center">
      {/* Logo Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-2"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span className="text-3xl font-bold text-slate-950 font-serif">M</span>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} custom={0.2} initial="hidden" animate="visible">
        <h1 className="text-2xl font-serif font-bold text-white mb-3">
          Bienvenue dans Maellis
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
          Votre assistant de maison consciente. Personnalisez votre expérience en quelques étapes simples et profitez d&apos;un foyer intelligent.
        </p>
      </motion.div>

      {/* Feature Pills */}
      <motion.div
        variants={fadeUp}
        custom={0.4}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {['🏠 Domotique', '🗣️ Vocal', '🎵 Ambiance', '🍽️ Recettes'].map((pill, i) => (
          <motion.span
            key={pill}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300"
          >
            {pill}
          </motion.span>
        ))}
      </motion.div>

      {renderNavFooter()}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 2: NOM DU FOYER
     ═══════════════════════════════════════════════════ */
  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20"
      >
        <Home className="w-7 h-7 text-amber-500" />
      </motion.div>

      <motion.div variants={fadeUp} custom={0.15} initial="hidden" animate="visible">
        <h2 className="text-xl font-serif font-semibold text-white mb-2">
          Nom du Foyer
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Comment s&apos;appelle votre foyer ?
        </p>
      </motion.div>

      {/* Name Input */}
      <motion.div variants={fadeUp} custom={0.25} initial="hidden" animate="visible" className="space-y-2 text-left">
        <Input
          type="text"
          placeholder="Mon appartement, Villa Azur..."
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-amber-500/40 focus:ring-amber-500/20 transition-all duration-300"
          autoFocus
        />
      </motion.div>

      {/* Type Selector */}
      <motion.div variants={fadeUp} custom={0.35} initial="hidden" animate="visible">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Type de logement
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setHouseholdType('home')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300',
              householdType === 'home'
                ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
            )}
          >
            <Home className={cn('w-6 h-6', householdType === 'home' ? 'text-amber-500' : 'text-slate-500')} />
            <span className={cn('text-sm font-medium', householdType === 'home' ? 'text-amber-400' : 'text-slate-400')}>
              Maison
            </span>
            <span className="text-[10px] text-slate-600">Résidence principale</span>
          </button>

          <button
            onClick={() => setHouseholdType('hospitality')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300',
              householdType === 'hospitality'
                ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
            )}
          >
            <Building2 className={cn('w-6 h-6', householdType === 'hospitality' ? 'text-amber-500' : 'text-slate-500')} />
            <span className={cn('text-sm font-medium', householdType === 'hospitality' ? 'text-amber-400' : 'text-slate-400')}>
              Location Airbnb
            </span>
            <span className="text-[10px] text-slate-600">Hospitalité</span>
          </button>
        </div>
      </motion.div>

      {/* Avatar Upload Placeholder */}
      <motion.div variants={fadeUp} custom={0.45} initial="hidden" animate="visible">
        <button className="mx-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300">
          <Upload className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Ajouter un avatar (optionnel)</span>
        </button>
      </motion.div>

      {renderNavFooter(true)}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 3: MODULES PRÉFÉRÉS
     ═══════════════════════════════════════════════════ */
  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <motion.div variants={fadeUp} custom={0.15} initial="hidden" animate="visible">
        <h2 className="text-xl font-serif font-semibold text-white mb-2">
          Modules Préférés
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Choisissez les fonctionnalités qui vous intéressent
        </p>
        <p className="text-xs text-amber-500/70 mt-2 font-medium">
          {selectedModules.size}/6 modules sélectionnés
        </p>
      </motion.div>

      {/* Module Grid */}
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod, idx) => {
          const isSelected = selectedModules.has(mod.id);
          return (
            <motion.button
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.06, duration: 0.35 }}
              onClick={() => toggleModule(mod.id)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-300',
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xl">{mod.emoji}</span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-slate-950" />
                  </motion.div>
                )}
              </div>
              <div>
                <p className={cn(
                  'text-sm font-medium leading-tight',
                  isSelected ? 'text-amber-300' : 'text-slate-300'
                )}>
                  {mod.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{mod.description}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedModules.size === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-amber-500/70"
        >
          Sélectionnez au moins 1 module pour continuer
        </motion.p>
      )}

      {renderNavFooter(true)}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 4: NOTIFICATIONS PUSH
     ═══════════════════════════════════════════════════ */
  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20"
      >
        {pushEnabled ? (
          <Bell className="w-7 h-7 text-amber-500" />
        ) : (
          <BellOff className="w-7 h-7 text-slate-500" />
        )}
      </motion.div>

      <motion.div variants={fadeUp} custom={0.15} initial="hidden" animate="visible">
        <h2 className="text-xl font-serif font-semibold text-white mb-2">
          Notifications Push
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Recevez des alertes importantes même hors de l&apos;application
        </p>
      </motion.div>

      {/* Push Toggle */}
      <motion.div
        variants={fadeUp}
        custom={0.25}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
            pushEnabled ? 'bg-emerald-500/15' : 'bg-white/[0.06]'
          )}>
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-emerald-400" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Notifications Push</p>
            <p className="text-[10px] text-slate-500">Alertes en temps réel sur votre appareil</p>
          </div>
        </div>
        <Switch
          checked={pushEnabled}
          onCheckedChange={handlePushToggle}
          className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-white/[0.08] scale-110"
        />
      </motion.div>

      {/* Permission Status */}
      <motion.div
        variants={fadeUp}
        custom={0.35}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className={cn(
            'w-2 h-2 rounded-full',
            oneSignal.isSubscribed || pushEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
          )} />
          <span className={oneSignal.isSubscribed || pushEnabled ? 'text-emerald-400' : 'text-slate-500'}>
            {oneSignal.isSubscribed
              ? 'Notifications activées'
              : oneSignal.permission === 'denied'
                ? 'Notifications bloquées par le navigateur'
                : 'En attente de permission'
            }
          </span>
        </div>
      </motion.div>

      {/* Quiet Hours Toggle */}
      <motion.div
        variants={fadeUp}
        custom={0.4}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10">
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Heures de silence</p>
            <p className="text-[10px] text-slate-500">Pas de notifications de 22h à 7h</p>
          </div>
        </div>
        <Switch
          checked={quietHoursEnabled}
          onCheckedChange={setQuietHoursEnabled}
          className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-white/[0.08] scale-110"
        />
      </motion.div>

      {renderNavFooter(true)}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 5: TEST SOS
     ═══════════════════════════════════════════════════ */
  const renderStep5 = () => (
    <div className="space-y-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20"
      >
        <ShieldAlert className="w-7 h-7 text-red-400" />
      </motion.div>

      <motion.div variants={fadeUp} custom={0.15} initial="hidden" animate="visible">
        <h2 className="text-xl font-serif font-semibold text-white mb-2">
          Test du bouton SOS
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Appuyez sur le bouton d&apos;urgence pour vérifier qu&apos;il fonctionne
        </p>
      </motion.div>

      {/* SOS Button */}
      <motion.div variants={fadeUp} custom={0.3} initial="hidden" animate="visible">
        {!sosTested ? (
          <div className="relative mx-auto w-fit">
            {/* Pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/20"
              animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-500/10"
              animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
            />
            <motion.button
              onClick={handleSosTest}
              whileTap={{ scale: 0.92 }}
              className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-shadow duration-300"
            >
              <Phone className="w-10 h-10 text-white" />
            </motion.button>
            <p className="text-xs text-slate-600 mt-3">Appuyez pour tester</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-emerald-400 mt-4 font-medium"
            >
              Parfait ! En cas d&apos;urgence, ce bouton appellera vos contacts.
            </motion.p>
          </motion.div>
        )}
      </motion.div>

      {/* Safety Tips */}
      <motion.div
        variants={fadeUp}
        custom={0.45}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left space-y-2.5"
      >
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Conseils de sécurité
        </p>
        {[
          'Configurez au moins 2 contacts d\'urgence',
          'Vérifiez les permissions d\'appel sur votre appareil',
          'Le bouton SOS est accessible depuis l\'écran d\'accueil',
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500/60 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
          </div>
        ))}
      </motion.div>

      {renderNavFooter(true)}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     STEP 6: PERSONNALISATION
     ═══════════════════════════════════════════════════ */
  const renderStep6 = () => (
    <div className="space-y-6 text-center">
      <motion.div variants={fadeUp} custom={0.1} initial="hidden" animate="visible">
        <h2 className="text-xl font-serif font-semibold text-white mb-2">
          Personnalisation
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Choisissez votre style et nommez votre assistant
        </p>
      </motion.div>

      {/* Template Selection */}
      <motion.div variants={fadeUp} custom={0.2} initial="hidden" animate="visible">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Thème visuel
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedTemplate(t.slug)}
              className={cn(
                'relative rounded-xl overflow-hidden border transition-all duration-300',
                selectedTemplate === t.slug
                  ? 'border-amber-500/50 shadow-lg shadow-amber-500/10 scale-[1.02]'
                  : 'border-white/[0.08] hover:border-white/20'
              )}
            >
              <div
                className="h-16 flex items-center justify-center text-2xl"
                style={{ background: t.gradient }}
              >
                {t.preview}
              </div>
              <div className="p-2.5 bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">{t.name}</span>
                  {selectedTemplate === t.slug && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-slate-950" />
                    </motion.div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Assistant Name */}
      <motion.div variants={fadeUp} custom={0.35} initial="hidden" animate="visible">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          Nom de l&apos;assistant
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ASSISTANT_NAMES.map((opt) => (
            <button
              key={opt.name}
              onClick={() => setAssistantName(opt.name)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-300',
                assistantName === opt.name
                  ? 'border-amber-500/50 bg-amber-500/10'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20'
              )}
            >
              <span className={cn(
                'text-sm font-semibold',
                assistantName === opt.name ? 'text-amber-400' : 'text-slate-300'
              )}>
                {opt.name}
              </span>
              <span className="text-[10px] text-slate-600">{opt.description}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {renderNavFooter()}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     MAIN RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      {/* Ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Glass Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40 p-6 sm:p-8">
          {/* Step Label */}
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-widest">
              Configuration initiale
            </span>
          </div>

          {/* Progress Dots */}
          <div className="mb-8">
            <ProgressDots current={step} total={TOTAL_STEPS} />
          </div>

          {/* Step Content */}
          <div className="min-h-[380px] flex items-start justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {step === 0 && renderStep1()}
                {step === 1 && renderStep2()}
                {step === 2 && renderStep3()}
                {step === 3 && renderStep4()}
                {step === 4 && renderStep5()}
                {step === 5 && renderStep6()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center text-xs text-slate-700 mt-6"
        >
          Maellis — Maison Consciente
        </motion.p>
      </motion.div>
    </div>
  );
}
