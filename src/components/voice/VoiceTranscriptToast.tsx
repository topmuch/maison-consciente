'use client';

/* ═══════════════════════════════════════════════════════
   VOICE TRANSCRIPT TOAST — Recognized Text Overlay

   Shows temporarily recognized text at the bottom of the
   screen with a smooth fade-in/fade-out animation.
   Supports both listening indicator and final transcript.

   Dark Luxe theme: glass background, amber accents.

   Usage:
     <VoiceTranscriptToast
       transcript={voice.transcript}
       isListening={voice.isListening}
       engineState={voice.engineState}
     />
   ═══════════════════════════════════════════════════════ */

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Mic, Loader2 } from 'lucide-react';

/* ─── Types ─── */

interface VoiceTranscriptToastProps {
  /** The recognized text transcript */
  transcript: string;
  /** Whether the STT engine is actively listening */
  isListening: boolean;
  /** Current engine state */
  engineState?: string;
}

/* ─── Animation Variants ─── */

const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const dotPulse: Variants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ─── Component ─── */

export function VoiceTranscriptToast({
  transcript,
  isListening,
  engineState,
}: VoiceTranscriptToastProps) {
  // Determine what to show
  const showListeningIndicator = isListening && !transcript;
  const showTranscript = !!transcript;
  const showProcessing = engineState === 'processing';
  const show = showListeningIndicator || showTranscript || showProcessing;

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        {/* Listening indicator (no text yet) */}
        {showListeningIndicator && (
          <motion.div
            key="listening"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              flex items-center gap-3 px-5 py-3 rounded-2xl
              bg-[#0a0a12]/90 backdrop-blur-xl
              border border-amber-400/20
              shadow-[0_0_24px_rgba(251,191,36,0.08)]
            "
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                variants={dotPulse}
                animate="animate"
                className="w-2 h-2 rounded-full bg-amber-400 absolute -left-3"
              />
              <motion.div
                variants={dotPulse}
                animate="animate"
                className="w-2 h-2 rounded-full bg-amber-400 absolute -left-3"
                style={{ animationDelay: '0.3s' }}
              />
              <motion.div
                variants={dotPulse}
                animate="animate"
                className="w-2 h-2 rounded-full bg-amber-400 absolute -left-3"
                style={{ animationDelay: '0.6s' }}
              />
            </div>
            <Mic className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">
              En écoute…
            </span>
          </motion.div>
        )}

        {/* Processing indicator */}
        {showProcessing && (
          <motion.div
            key="processing"
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              flex items-center gap-3 px-5 py-3 rounded-2xl
              bg-[#0a0a12]/90 backdrop-blur-xl
              border border-amber-400/15
            "
          >
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-sm text-[#94a3b8] font-medium">
              Traitement…
            </span>
          </motion.div>
        )}

        {/* Final transcript */}
        {showTranscript && (
          <motion.div
            key={`transcript-${transcript}`}
            variants={toastVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="
              flex items-center gap-3 px-5 py-3 rounded-2xl
              bg-[#0a0a12]/90 backdrop-blur-xl
              border border-white/10
              max-w-[80vw] md:max-w-[400px]
            "
          >
            <Mic className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm text-[#e2e8f0] font-medium truncate">
              &ldquo;{transcript}&rdquo;
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
