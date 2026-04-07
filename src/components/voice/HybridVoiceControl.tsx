'use client';

/* ═══════════════════════════════════════════════════════
   HYBRID VOICE CONTROL — Maellis Voice Assistant UI

   A rich voice control component with:
   - Animated push-to-talk orb (Dark Luxe themed)
   - Wake word detection indicator
   - 4 visual states: idle, listening, processing, speaking
   - Live transcript display
   - Compact mode for tablet embedding

   States:
   - idle:     Soft golden glow, pulse, "Appuyez pour parler"
   - listening: Bright amber, expanding ripple, "J'écoute..."
   - processing: Spinning animation, dimmed color
   - speaking: Sound wave bars, response text shown

   Usage:
     <HybridVoiceControl
       householdId="hh-123"
       wakeWordEnabled
       onCommandProcessed={(intent, response) => console.log(intent, response)}
     />

     <HybridVoiceControl
       householdId="hh-123"
       compact
       rate={1.1}
       volume={0.9}
     />
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useVoiceResponse, type VoiceState } from '@/hooks/useVoiceResponse';
import { cn } from '@/lib/utils';

/* ─── Types ─── */

interface HybridVoiceControlProps {
  householdId: string;
  /** Whether wake word detection is enabled */
  wakeWordEnabled?: boolean;
  /** The wake word to detect (default: "Maellis") */
  wakeWord?: string;
  /** Compact mode for tablet embedding */
  compact?: boolean;
  /** TTS rate (0.5-2.0) */
  rate?: number;
  /** TTS volume (0-1) */
  volume?: number;
  /** Callback when a voice command is processed */
  onCommandProcessed?: (intent: string, response: string) => void;
}

/* ─── Animation Variants ─── */

const idleGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px oklch(0.78 0.14 85 / 15%), 0 0 60px oklch(0.78 0.14 85 / 5%)',
      '0 0 30px oklch(0.78 0.14 85 / 25%), 0 0 80px oklch(0.78 0.14 85 / 10%)',
      '0 0 20px oklch(0.78 0.14 85 / 15%), 0 0 60px oklch(0.78 0.14 85 / 5%)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pulseRing1: Variants = {
  initial: { scale: 1, opacity: 0.6 },
  animate: {
    scale: [1, 1.6, 1],
    opacity: [0.6, 0, 0.6],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
  exit: { scale: 1.2, opacity: 0 },
};

const pulseRing2: Variants = {
  initial: { scale: 1, opacity: 0.3 },
  animate: {
    scale: [1, 2.0, 1],
    opacity: [0.3, 0, 0.3],
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
  },
  exit: { scale: 1.4, opacity: 0 },
};

const processingSpin: Variants = {
  animate: {
    rotate: [0, 360],
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
};

const speakingPulse: Variants = {
  animate: {
    scale: [1, 1.08, 1],
    transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

const transcriptSlide: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } },
};

/* ─── Sound Wave Bars Component ─── */

function SoundWaveBars({ compact }: { compact: boolean }) {
  const barCount = 5;
  const barHeight = compact ? 'h-3' : 'h-5';
  const gap = compact ? 'gap-0.5' : 'gap-1';

  return (
    <div className={cn('flex items-center justify-center', gap)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(barHeight, 'w-[3px] rounded-full bg-gradient-to-t from-amber-600 to-amber-400')}
          animate={{
            scaleY: [0.4, 1, 0.4],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Main Component ─── */

export function HybridVoiceControl({
  householdId,
  wakeWordEnabled = false,
  wakeWord = 'Maellis',
  compact = false,
  rate = 1.0,
  volume = 0.8,
  onCommandProcessed,
}: HybridVoiceControlProps) {
  const voice = useVoiceResponse();
  const [isPressed, setIsPressed] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showWakeHint, setShowWakeHint] = useState(true);

  // Sync household ID and settings
  useEffect(() => {
    voice.setHouseholdId(householdId);
    voice.setRate(rate);
    voice.setVolume(volume);
  }, [householdId, rate, volume, voice]);

  // Watch for responses to fire callback
  useEffect(() => {
    if (voice.lastResponse && voice.state === 'speaking' && onCommandProcessed) {
      // Extract a basic intent from the response (the API returns the actionType)
      onCommandProcessed('processed', voice.lastResponse);
    }
  }, [voice.lastResponse, onCommandProcessed]);

  // Wake word hint auto-dismiss
  useEffect(() => {
    if (showWakeHint && wakeWordEnabled) {
      const timer = setTimeout(() => setShowWakeHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showWakeHint, wakeWordEnabled]);

  // Handle press-to-talk
  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
    voice.startListening();
  }, [voice]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (voice.state === 'listening') {
      voice.stopListening();
    }
  }, [voice]);

  const handleClick = useCallback(() => {
    // Fallback for devices that don't properly fire pointer events
    if (voice.state === 'idle') {
      voice.startListening();
    } else if (voice.state === 'listening') {
      voice.stopListening();
    } else {
      voice.stopSpeaking();
    }
  }, [voice]);

  // Orb size
  const orbSize = compact ? 'w-16 h-16' : 'w-24 h-24';
  const iconSize = compact ? 'w-6 h-6' : 'w-8 h-8';

  // State-based styling
  const getOrbClasses = (state: VoiceState) => {
    switch (state) {
      case 'idle':
        return cn(
          orbSize,
          'rounded-full cursor-pointer select-none touch-manipulation',
          'bg-gradient-to-br from-amber-500/80 via-amber-600/70 to-amber-800/80',
          'border border-amber-400/30',
          'hover:from-amber-400/90 hover:via-amber-500/80 hover:to-amber-700/90',
          'hover:border-amber-400/50',
          'transition-all duration-300',
        );
      case 'listening':
        return cn(
          orbSize,
          'rounded-full cursor-pointer select-none touch-manipulation',
          'bg-gradient-to-br from-amber-400/90 via-amber-500/80 to-amber-700/90',
          'border-2 border-amber-300/60',
          'shadow-[0_0_40px_oklch(0.78_0.14_85_/_30%),_0_0_80px_oklch(0.78_0.14_85_/_15%)]',
        );
      case 'processing':
        return cn(
          orbSize,
          'rounded-full cursor-wait select-none',
          'bg-gradient-to-br from-amber-700/50 via-amber-800/40 to-amber-900/50',
          'border border-amber-600/30',
          'opacity-70',
        );
      case 'speaking':
        return cn(
          orbSize,
          'rounded-full cursor-pointer select-none touch-manipulation',
          'bg-gradient-to-br from-amber-400/80 via-amber-500/70 to-amber-700/80',
          'border border-amber-400/40',
        );
      default:
        return cn(orbSize, 'rounded-full');
    }
  };

  // Icon based on state
  const renderIcon = (state: VoiceState) => {
    const iconColor =
      state === 'idle' ? 'text-amber-100' : 'text-white';

    switch (state) {
      case 'idle':
        return <Mic className={cn(iconSize, iconColor)} />;
      case 'listening':
        return <Mic className={cn(iconSize, 'text-white animate-pulse')} />;
      case 'processing':
        return (
          <motion.div variants={processingSpin} animate="animate">
            <Sparkles className={cn(iconSize, 'text-amber-300/70')} />
          </motion.div>
        );
      case 'speaking':
        return <Volume2 className={cn(iconSize, 'text-white')} />;
      default:
        return <Mic className={cn(iconSize, iconColor)} />;
    }
  };

  // Status text
  const getStatusText = (state: VoiceState): string | null => {
    switch (state) {
      case 'idle':
        return null;
      case 'listening':
        return "J'écoute...";
      case 'processing':
        return 'Traitement...';
      case 'speaking':
        return null;
      default:
        return null;
    }
  };

  const statusText = getStatusText(voice.state);

  return (
    <div className={cn('flex flex-col items-center gap-3', compact ? 'gap-2' : 'gap-4')}>
      {/* Wake word indicator */}
      <AnimatePresence>
        {wakeWordEnabled && showWakeHint && voice.state === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              'flex items-center gap-1.5',
              'px-3 py-1 rounded-full',
              'glass-gold text-amber-300/80',
              'text-xs font-medium',
            )}
          >
            <Sparkles className="w-3 h-3" />
            <span>Dites &quot;{wakeWord}&quot; pour m&apos;activer</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wake word detected flash */}
      <AnimatePresence>
        {wakeWordDetected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-amber-400 text-sm font-semibold"
          >
            ✓ {wakeWord} détecté
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb container with ripple rings */}
      <div className="relative flex items-center justify-center">
        {/* Listening ripple rings */}
        <AnimatePresence>
          {voice.state === 'listening' && (
            <>
              <motion.span
                key="ring-1"
                variants={pulseRing1}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  'absolute rounded-full',
                  'border-2 border-amber-400/40',
                  compact ? 'w-20 h-20' : 'w-32 h-32',
                )}
              />
              <motion.span
                key="ring-2"
                variants={pulseRing2}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  'absolute rounded-full',
                  'border border-amber-400/20',
                  compact ? 'w-24 h-24' : 'w-40 h-40',
                )}
              />
            </>
          )}
        </AnimatePresence>

        {/* The orb button */}
        <motion.button
          type="button"
          variants={voice.state === 'idle' ? idleGlow : voice.state === 'speaking' ? speakingPulse : undefined}
          animate={voice.state === 'idle' || voice.state === 'speaking' ? 'animate' : undefined}
          whileTap={{ scale: isPressed ? 0.92 : 0.95 }}
          whileHover={voice.state === 'idle' ? { scale: 1.05 } : undefined}
          className={cn(
            'relative z-10 flex items-center justify-center',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617]',
            getOrbClasses(voice.state),
          )}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (isPressed && voice.state === 'listening') {
              setIsPressed(false);
              voice.stopListening();
            }
          }}
          onClick={handleClick}
          aria-label={
            voice.state === 'idle'
              ? 'Appuyez pour parler'
              : voice.state === 'listening'
                ? 'En écoute — relâchez pour envoyer'
                : voice.state === 'processing'
                  ? 'Traitement en cours'
                  : 'Synthèse vocale en cours — appuyez pour arrêter'
          }
          title={
            voice.state === 'idle'
              ? 'Appuyez pour parler'
              : voice.state === 'listening'
                ? "J'écoute..."
                : voice.state === 'processing'
                  ? 'Traitement...'
                  : 'Cliquez pour arrêter'
          }
        >
          {/* Inner glow overlay */}
          <div
            className={cn(
              'absolute inset-0 rounded-full',
              voice.state === 'listening'
                ? 'bg-gradient-radial from-amber-300/20 to-transparent'
                : 'bg-gradient-radial from-amber-400/10 to-transparent',
            )}
          />

          {/* Icon */}
          <div className="relative z-10">
            {voice.state === 'speaking' ? (
              <SoundWaveBars compact={compact} />
            ) : (
              renderIcon(voice.state)
            )}
          </div>
        </motion.button>
      </div>

      {/* Unavailable notice */}
      {!voice.isAvailable && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          Reconnaissance vocale non disponible dans ce navigateur
        </p>
      )}

      {/* Status text */}
      <AnimatePresence mode="wait">
        {statusText && (
          <motion.p
            key={statusText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-sm font-medium text-center',
              voice.state === 'listening'
                ? 'text-amber-400'
                : voice.state === 'processing'
                  ? 'text-amber-300/60'
                  : 'text-muted-foreground',
            )}
          >
            {statusText}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Transcript display */}
      <AnimatePresence>
        {voice.transcript && (
          <motion.div
            variants={transcriptSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'w-full max-w-xs text-center',
              'px-4 py-2 rounded-xl',
              'glass-gold',
            )}
          >
            <p className="text-xs text-amber-200/70 mb-0.5">Vous avez dit :</p>
            <p className="text-sm text-amber-100 font-medium leading-snug">
              &quot;{voice.transcript}&quot;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response display */}
      <AnimatePresence>
        {voice.lastResponse && (voice.state === 'speaking' || voice.state === 'idle') && (
          <motion.div
            variants={transcriptSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'w-full max-w-sm text-center',
              'px-4 py-2.5 rounded-xl',
              'glass',
            )}
          >
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center justify-center gap-1">
              <Volume2 className="w-3 h-3" />
              Maellis
            </p>
            <p className="text-sm text-foreground font-medium leading-snug">
              {voice.lastResponse}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {voice.error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400/80 text-center max-w-[200px]"
          >
            {voice.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
