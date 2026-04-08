'use client';

/* ═══════════════════════════════════════════════════════
   VOICE ORB — Floating Voice Control Button

   Circular pulsating button with 3 visual states:
   - Idle: soft amber glow, microphone icon
   - Listening: pulsing rings, active mic
   - Speaking: animated sound waves, speaker icon
   - Muted: dimmed, X overlay

   Tablet-optimized: min-h-[64px], touch-friendly.
   Dark Luxe theme compliant.

   Usage:
     <VoiceOrb
       isListening={voice.isListening}
       isSpeaking={voice.isSpeaking}
       isMuted={voice.isMuted}
       isSupported={voice.isFullySupported}
       onToggle={voice.toggleListening}
       onMuteToggle={voice.toggleMute}
     />
   ═══════════════════════════════════════════════════════ */

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

/* ─── Types ─── */

interface VoiceOrbProps {
  /** Whether the STT engine is actively listening */
  isListening: boolean;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Whether voice is muted */
  isMuted: boolean;
  /** Whether voice features are supported */
  isSupported: boolean;
  /** Toggle listening on/off */
  onToggle: () => boolean | void;
  /** Toggle mute on/off (right-click or long-press) */
  onMuteToggle?: () => void;
  /** Optional CSS class */
  className?: string;
}

/* ─── Animation Variants ─── */

const pulseRing: Variants = {
  initial: { scale: 1, opacity: 0.6 },
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.6, 0, 0.6],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  exit: { scale: 1, opacity: 0 },
};

const pulseRing2: Variants = {
  initial: { scale: 1, opacity: 0.4 },
  animate: {
    scale: [1, 1.8, 1],
    opacity: [0.4, 0, 0.4],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
  },
  exit: { scale: 1, opacity: 0 },
};

const speakWaves: Variants = {
  animate: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ─── Component ─── */

export function VoiceOrb({
  isListening,
  isSpeaking,
  isMuted,
  isSupported,
  onToggle,
  onMuteToggle,
  className = '',
}: VoiceOrbProps) {
  if (!isSupported) return null;

  const isIdle = !isListening && !isSpeaking;
  const isMutedState = isMuted;

  const handleClick = () => {
    if (isMutedState) {
      onMuteToggle?.();
    } else {
      onToggle();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onMuteToggle?.();
  };

  // Determine button color classes
  const orbClasses = isMutedState
    ? 'bg-white/5 border-white/10 opacity-50'
    : isListening
      ? 'bg-amber-400/20 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
      : isSpeaking
        ? 'bg-amber-400/10 border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
        : 'bg-white/5 border-white/15 hover:bg-amber-400/10 hover:border-amber-400/30';

  const iconColor = isMutedState
    ? 'text-[#475569]'
    : isListening
      ? 'text-amber-400'
      : isSpeaking
        ? 'text-amber-400'
        : 'text-[#94a3b8]';

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: isIdle ? 1.05 : 1 }}
      className={`
        relative z-50 flex items-center justify-center
        w-16 h-16 min-h-[64px] min-w-[64px]
        rounded-full border backdrop-blur-xl
        transition-colors duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50
        select-none touch-manipulation
        ${orbClasses}
        ${className}
      `}
      aria-label={
        isMutedState
          ? 'Voix désactivée — cliquez pour activer'
          : isListening
            ? 'En écoute — cliquez pour arrêter'
            : isSpeaking
              ? 'Synthèse vocale en cours'
              : 'Activer la commande vocale'
      }
      title={
        isMutedState
          ? 'Voix désactivée'
          : isListening
            ? 'En écoute...'
            : 'Commande vocale'
      }
    >
      {/* Listening pulse rings */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.span
              key="ring1"
              variants={pulseRing}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 rounded-full border-2 border-amber-400/40"
            />
            <motion.span
              key="ring2"
              variants={pulseRing2}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 rounded-full border border-amber-400/20"
            />
          </>
        )}
      </AnimatePresence>

      {/* Speaking pulse */}
      {isSpeaking && !isListening && (
        <motion.span
          variants={speakWaves}
          animate="animate"
          className="absolute inset-[-4px] rounded-full border border-amber-400/20"
        />
      )}

      {/* Icon */}
      <motion.div
        animate={
          isMutedState
            ? { scale: 1 }
            : isListening
              ? { scale: [1, 1.1, 1] }
              : {}
        }
        transition={
          isListening
            ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      >
        {isMutedState ? (
          <VolumeX className={`w-6 h-6 ${iconColor}`} />
        ) : isListening ? (
          <Mic className={`w-6 h-6 ${iconColor}`} />
        ) : isSpeaking ? (
          <Volume2 className={`w-6 h-6 ${iconColor}`} />
        ) : (
          <Mic className={`w-6 h-6 ${iconColor}`} />
        )}
      </motion.div>
    </motion.button>
  );
}
