"use client";

/* ═══════════════════════════════════════════════════════
   SleepProvider — Elegant Inactivity Screen Saver

   Detects user inactivity and displays a monumental
   clock after a configurable timeout. Wakes instantly
   on touch, mouse, or keyboard input.

   Features:
   - 1.5s fade-in/out transitions
   - Monumental serif clock (text-9xl → text-[12rem])
   - French date display
   - Touch/mouse/keyboard wake listeners
   - No reflow — GPU-composited via Framer Motion
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerHaptic } from "@/lib/haptic";

interface Props {
  /** Inactivity timeout in ms (default: 2 min) */
  timeoutMs?: number;
  children: ReactNode;
}

export function SleepProvider({ timeoutMs = 120_000, children }: Props) {
  const [isSleeping, setIsSleeping] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const wake = useCallback(() => {
    if (isSleeping) {
      triggerHaptic("light");
    }
    setLastActivity(Date.now());
    setIsSleeping(false);
  }, [isSleeping]);

  /* ─── Inactivity check ─── */
  useEffect(() => {
    const check = setInterval(() => {
      if (!isSleeping && Date.now() - lastActivity > timeoutMs) {
        setIsSleeping(true);
      }
    }, 5_000);

    return () => clearInterval(check);
  }, [lastActivity, timeoutMs, isSleeping]);

  /* ─── Wake listeners ─── */
  useEffect(() => {
    const events = ["touchstart", "mousemove", "keydown", "click"] as const;

    events.forEach((evt) => window.addEventListener(evt, wake));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, wake));
    };
  }, [wake]);

  /* ─── Sleep clock (live update when sleeping) ─── */
  const [sleepClock, setSleepClock] = useState(new Date());
  useEffect(() => {
    if (!isSleeping) return;
    const timer = setInterval(() => setSleepClock(new Date()), 1_000);
    return () => clearInterval(timer);
  }, [isSleeping]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isSleeping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center cursor-pointer select-none"
            onClick={wake}
            onTouchStart={wake}
            role="button"
            aria-label="Touchez l'écran pour réveiller"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="text-center"
            >
              {/* Monumental Clock */}
              <p className="text-9xl md:text-[12rem] font-serif font-light text-amber-100/80 tracking-tight leading-none tabular-nums">
                {sleepClock.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Date */}
              <p className="text-xl md:text-2xl text-slate-400/60 mt-6 font-light tracking-widest uppercase">
                {sleepClock.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>

              {/* Wake hint */}
              <div className="mt-16 text-slate-600/80 text-sm animate-pulse">
                Touchez l&apos;écran pour réveiller
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
