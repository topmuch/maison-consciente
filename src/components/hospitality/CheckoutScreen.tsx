'use client';

/* ═══════════════════════════════════════════════════════
   CHECKOUT SCREEN — Checkout Final

   Full-screen farewell card with:
   - TTS farewell message
   - QR code checkout confirmation
   - Departure checklist (pre-checked)
   - 30s inactivity auto-reset
   Dark Luxe theme with Framer Motion animations.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { Check, RotateCcw, Volume2, Loader2 } from 'lucide-react';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';

/* ── Types ── */
interface CheckoutScreenProps {
  onReset: () => void;
  guestName?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  emoji: string;
  checked: boolean;
}

/* ── Animation Variants ── */
const fadeUp = (delay: number) => ({
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
});

const slideInLeft = (delay: number) => ({
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
});

const scaleSpring = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

/* ── Inactivity timeout: 30 seconds ── */
const INACTIVITY_MS = 30_000;

/* ═══ MAIN COMPONENT ═══ */
export function CheckoutScreen({ onReset, guestName }: CheckoutScreenProps) {
  const { speak, isSpeaking, isSupported } = useVoiceResponse();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'keys', label: 'Clés rendues', emoji: '🔑', checked: true },
    { id: 'windows', label: 'Fenêtres fermées', emoji: '🪟', checked: true },
    { id: 'trash', label: 'Poubelles sorties', emoji: '🗑️', checked: true },
    { id: 'lights', label: 'Lumières éteintes', emoji: '💡', checked: true },
  ]);
  const [showInactivity, setShowInactivity] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpoken = useRef(false);

  /* ── Generate QR code ── */
  useEffect(() => {
    QRCode.toDataURL('https://maison-consciente.app/checkout/confirmed', {
      width: 200,
      margin: 2,
      color: {
        dark: '#d4a853',
        light: '#0a0a12',
      },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, []);

  /* ── TTS farewell on mount ── */
  useEffect(() => {
    if (!hasSpoken.current && isSupported) {
      hasSpoken.current = true;
      const timer = setTimeout(() => {
        speak('Merci pour votre séjour. Bon voyage !');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [speak, isSupported]);

  /* ── Inactivity detection ── */
  const startInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivity(true);
      // Auto-reset 3 seconds after showing inactivity notice
      inactivityTimerRef.current = setTimeout(() => {
        onReset();
      }, 3000);
    }, INACTIVITY_MS);
  }, [onReset]);

  const resetInactivity = useCallback(() => {
    setShowInactivity(false);
    startInactivityTimer();
  }, [startInactivityTimer]);

  // Start inactivity timer on mount (no direct setState in effect)
  useEffect(() => {
    startInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [startInactivityTimer]);

  /* ── Toggle checklist item ── */
  const toggleItem = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const personalName = guestName || 'Voyageur';
  const allChecked = checklist.every((item) => item.checked);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050510]/95 backdrop-blur-md"
      onClick={resetInactivity}
      onTouchStart={resetInactivity}
      onKeyDown={resetInactivity}
      role="dialog"
      aria-label="Écran de départ"
    >
      <div className="w-full max-w-md mx-4">
        {/* Grand farewell card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden relative">
          {/* Decorative top gradient line */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          {/* Subtle ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 p-8 space-y-8">
            {/* ═══ Farewell message ═══ */}
            <motion.div
              variants={fadeUp(0)}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <h1 className="text-3xl font-serif text-gradient-gold mb-3">
                Merci pour votre séjour !
              </h1>
              <p className="text-sm text-[#64748b]">
                {personalName}, nous espérons vous revoir bientôt.
              </p>
              {/* TTS indicator */}
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-1.5 mt-3"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-400/70">En cours...</span>
                </motion.div>
              )}
            </motion.div>

            {/* ═══ QR Code ═══ */}
            <motion.div
              variants={scaleSpring}
              initial="hidden"
              animate="visible"
              className="flex justify-center"
            >
              <div className="p-4 bg-black/30 rounded-2xl border border-white/[0.08] inline-block">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code confirmation de départ"
                    className="w-44 h-44 rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-amber-400/40 animate-spin" />
                  </div>
                )}
                <p className="text-[10px] text-[#475569] text-center mt-2 font-mono">
                  Confirmation de départ
                </p>
              </div>
            </motion.div>

            {/* ═══ Departure Checklist ═══ */}
            <motion.div
              variants={fadeUp(0.3)}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-sm font-medium text-[#e2e8f0] mb-3 text-center">
                Checklist de départ
              </h3>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <motion.button
                    key={item.id}
                    variants={slideInLeft(0.4 + index * 0.1)}
                    initial="hidden"
                    animate="visible"
                    onClick={toggleItem}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 min-h-[48px] cursor-pointer ${
                      item.checked
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-black/20 border-white/[0.06] hover:border-white/[0.12]'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                        item.checked
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-[#475569]'
                      }`}
                    >
                      {item.checked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    <span className="text-sm mr-1">{item.emoji}</span>
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        item.checked
                          ? 'text-emerald-300 line-through opacity-70'
                          : 'text-[#e2e8f0]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </div>
              {allChecked && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-400/70 text-center mt-2"
                >
                  Tout est prêt pour votre départ ✓
                </motion.p>
              )}
            </motion.div>

            {/* ═══ Manual reset button ═══ */}
            <motion.div
              variants={fadeUp(0.8)}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="inline-flex items-center gap-2 text-xs text-[#475569] hover:text-[#64748b] transition-colors duration-300 cursor-pointer py-2 px-4 rounded-lg hover:bg-white/[0.03]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retour à l&apos;écran principal
              </button>
            </motion.div>
          </div>
        </div>

        {/* ═══ Inactivity overlay ═══ */}
        <AnimatePresence>
          {showInactivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.5 }}
              className="text-center mt-6"
            >
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="text-sm text-[#64748b]"
              >
                Retour à l&apos;écran principal...
              </motion.p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetInactivity();
                }}
                className="text-xs text-amber-400/60 hover:text-amber-400 mt-2 underline cursor-pointer transition-colors"
              >
                Annuler
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
