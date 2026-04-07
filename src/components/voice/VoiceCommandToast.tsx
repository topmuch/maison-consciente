"use client";

/* ═══════════════════════════════════════════════════════
   VoiceCommandToast — Feedback Toast for Voice Commands

   Fixed-position toast notification showing voice feedback:
   - Listening: amber left border + pulsing dot
   - Success: emerald left border + check icon
   - Error: rose left border + X icon
   - Info: slate left border + info icon

   Slides in from bottom. Glass-morphism styling.
   Auto-hide after configurable duration (default 3000ms for
   success/error, 0 for listening/info = no auto-hide).
   ═══════════════════════════════════════════════════════ */

import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

/* ── Types ── */

interface VoiceCommandToastProps {
  visible: boolean;
  type: "listening" | "success" | "error" | "info";
  message: string;
  duration?: number; // ms, 0 = no auto-hide
  onClose?: () => void;
}

/* ── Visual Config ── */

const typeConfig = {
  listening: {
    leftBorder: "border-l-amber-400",
    bgAccent: "bg-amber-400",
    textColor: "text-amber-200",
    icon: (
      <span className="flex items-center gap-[3px] shrink-0 w-5 justify-center">
        <motion.span
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
        />
        <motion.span
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.25 }}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
        />
        <motion.span
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
        />
      </span>
    ),
  },
  success: {
    leftBorder: "border-l-emerald-400",
    bgAccent: "bg-emerald-400",
    textColor: "text-emerald-200",
    icon: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  },
  error: {
    leftBorder: "border-l-rose-400",
    bgAccent: "bg-rose-400",
    textColor: "text-rose-200",
    icon: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  },
  info: {
    leftBorder: "border-l-slate-400",
    bgAccent: "bg-slate-400",
    textColor: "text-slate-200",
    icon: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
  },
} as const;

/* ── Default Duration by Type ── */

const defaultDuration = {
  listening: 0,
  success: 3000,
  error: 3000,
  info: 0,
} as const;

/* ── Component ── */

export default function VoiceCommandToast({
  visible,
  type,
  message,
  duration,
  onClose,
}: VoiceCommandToastProps) {
  const cfg = typeConfig[type];
  const autoDuration = duration ?? defaultDuration[type];

  // Auto-hide timer
  const handleAutoClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!visible || autoDuration === 0) return;

    const timer = setTimeout(handleAutoClose, autoDuration);
    return () => clearTimeout(timer);
  }, [visible, autoDuration, handleAutoClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 150 }}
          className={`
            fixed bottom-24 left-1/2 -translate-x-1/2 z-[110]
            max-w-[420px] w-[90vw]
            bg-white/[0.06] backdrop-blur-2xl
            border border-l-[3px] ${cfg.leftBorder}
            border-white/10
            rounded-2xl px-5 py-3.5
            shadow-2xl
            flex items-center gap-3
          `}
        >
          {/* Icon / pulsing dots */}
          {cfg.icon}

          {/* Message */}
          <span className={`text-sm flex-1 ${cfg.textColor}`}>
            {message}
          </span>

          {/* Close button (only for non-listening types) */}
          {type !== "listening" && onClose && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="
                shrink-0 flex items-center justify-center
                w-6 h-6 rounded-full
                bg-white/[0.06] hover:bg-white/10
                border border-white/10
                transition-colors duration-200
              "
              aria-label="Fermer"
            >
              <X className="w-3 h-3 text-white/40" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
