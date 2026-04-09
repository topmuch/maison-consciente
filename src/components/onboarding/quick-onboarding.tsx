'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Home,
  Wifi,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ─── Confetti Particle Component ─── */
function ConfettiParticle({ delay, color, x, size }: {
  delay: number;
  color: string;
  x: number;
  size: number;
}) {
  return (
    <motion.div
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size * 1.6,
        backgroundColor: color,
        left: `${x}%`,
        top: '-5%',
        borderRadius: size > 6 ? '2px' : '50%',
      }}
      initial={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, 300, 500],
        rotate: [0, 180, 720],
        scale: [1, 1, 0.5],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 2.5,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

/* ─── Confetti Burst ─── */
function ConfettiBurst() {
  const colors = [
    '#f59e0b', '#fbbf24', '#f97316', '#ef4444',
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899',
    '#14b8a6', '#eab308',
  ];

  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.6,
    color: colors[i % colors.length],
    x: 10 + Math.random() * 80,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </div>
  );
}

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

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0, scale: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    scale: 1,
    transition: {
      pathLength: { duration: 0.8, ease: 'easeInOut', delay: 0.2 },
      opacity: { duration: 0.3, delay: 0.1 },
      scale: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.1 },
    },
  },
};

/* ─── Progress Dots ─── */
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <motion.div
            className="rounded-full"
            animate={{
              width: i <= current ? 28 : 10,
              height: 10,
              backgroundColor: i <= current ? '#f59e0b' : 'rgba(255, 255, 255, 0.15)',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
          {i < total - 1 && (
            <div className="w-6 h-px bg-white/10" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Step Icon Wrapper ─── */
function StepIcon({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20"
    >
      {children}
    </motion.div>
  );
}

/* ─── Main Component ─── */
interface QuickOnboardingProps {
  onComplete: () => void;
  householdId: string;
  currentHouseholdName?: string;
}

export function QuickOnboarding({
  onComplete,
  householdId,
  currentHouseholdName = '',
}: QuickOnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 state
  const [householdName, setHouseholdName] = useState(currentHouseholdName);

  // Step 2 state
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const totalSteps = 3;

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const skipToEnd = useCallback(async () => {
    setDirection(1);
    setStep(2);
  }, []);

  /* ─── Step 3: Auto-complete on mount ─── */
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(async () => {
        try {
          await fetch('/api/onboarding/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              householdId,
              householdName: householdName.trim() || undefined,
              wifiSsid: wifiSsid.trim() || undefined,
              wifiPassword: wifiPassword || undefined,
            }),
          });
        } catch {
          // Non-critical — onboarding data saving failed silently
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, householdId, householdName, wifiSsid, wifiPassword]);

  const handleComplete = () => {
    setIsSubmitting(true);
    // Small delay for smooth transition feel
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  /* ─── Step 1: Household Name ─── */
  const renderStep1 = () => (
    <div className="space-y-6 text-center">
      <StepIcon>
        <Home className="w-7 h-7 text-amber-500" />
      </StepIcon>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="text-xl font-serif font-semibold text-slate-100 mb-2">
          Nom de votre logement
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Donnez un nom unique à votre espace pour personnaliser l&apos;expérience.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-2"
      >
        <Label
          htmlFor="onboarding-name"
          className="text-xs font-medium text-slate-500 uppercase tracking-wider"
        >
          Nom du logement
        </Label>
        <Input
          id="onboarding-name"
          type="text"
          placeholder="Mon appartement Nice"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          className="h-11 rounded-xl bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/40 focus:ring-amber-500/20 transition-all duration-300"
          autoFocus
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex items-center justify-between pt-2"
      >
        <button
          onClick={skipToEnd}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
        >
          Passer
        </button>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={goNext}
            className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm border-0 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              Suivant
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );

  /* ─── Step 2: WiFi ─── */
  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      <StepIcon>
        <Wifi className="w-7 h-7 text-amber-500" />
      </StepIcon>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="text-xl font-serif font-semibold text-slate-100 mb-2">
          Code WiFi
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Ajoutez vos informations WiFi pour que l&apos;assistant puisse les communiquer à vos invités.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="space-y-4 text-left"
      >
        <div className="space-y-2">
          <Label
            htmlFor="onboarding-ssid"
            className="text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            Nom du réseau (SSID)
          </Label>
          <div className="relative group">
            <Wifi className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors group-focus-within:text-amber-500" />
            <Input
              id="onboarding-ssid"
              type="text"
              placeholder="MonWiFi_5G"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              className="h-11 pl-10 rounded-xl bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/40 focus:ring-amber-500/20 transition-all duration-300"
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="onboarding-wifi-pass"
            className="text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            Mot de passe WiFi
          </Label>
          <div className="relative group">
            <Input
              id="onboarding-wifi-pass"
              type={showWifiPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              className="h-11 pr-10 rounded-xl bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-600 focus:border-amber-500/40 focus:ring-amber-500/20 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowWifiPassword(!showWifiPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-amber-500 transition-colors duration-200"
              aria-label={showWifiPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showWifiPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600">
          Facultatif — vous pourrez modifier ces informations plus tard.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="flex items-center justify-between pt-2"
      >
        <button
          onClick={goBack}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
        >
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={goNext}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200"
          >
            Passer
          </button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={goNext}
              className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm border-0 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Suivant
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  /* ─── Step 3: Celebration ─── */
  const renderStep3 = () => (
    <div className="space-y-6 text-center relative">
      <ConfettiBurst />

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.1 }}
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/30"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="w-10 h-10 text-amber-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            variants={checkmarkVariants as any}
            initial="hidden"
            animate="visible"
            style={{ pathLength: 0 }}
            custom={1}
          />
          <motion.path
            d="M8 12l2.5 2.5L16 9"
            variants={checkmarkVariants as any}
            initial="hidden"
            animate="visible"
            style={{ pathLength: 0 }}
            custom={2}
          />
        </motion.svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-serif font-semibold text-slate-100">
            Tout est prêt !
          </h2>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
          Votre logement est configuré. L&apos;assistant connaît maintenant les informations de base pour aider vos invités.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="space-y-2"
      >
        {householdName.trim() && (
          <p className="text-xs text-slate-500">
            Logement : <span className="text-amber-500 font-medium">{householdName}</span>
          </p>
        )}
        {wifiSsid.trim() && (
          <p className="text-xs text-slate-500">
            WiFi : <span className="text-amber-500 font-medium">{wifiSsid}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm border-0 transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Accéder au tableau de bord
            </span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 p-4">
      {/* Subtle ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glass Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40 p-8">
          {/* Step Label */}
          <div className="text-center mb-6">
            <span className="text-xs font-medium text-slate-600 uppercase tracking-widest">
              Configuration initiale
            </span>
          </div>

          {/* Progress Dots */}
          <div className="mb-8">
            <ProgressDots current={step} total={totalSteps} />
          </div>

          {/* Step Content */}
          <div className="min-h-[320px] flex items-start justify-center">
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
          Maison Consciente — Bienvenue
        </motion.p>
      </motion.div>
    </div>
  );
}
