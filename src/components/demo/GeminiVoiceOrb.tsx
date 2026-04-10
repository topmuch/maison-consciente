'use client';

/* ═══════════════════════════════════════════════════════
   GEMINI VOICE ORB — Maellis Live Voice Control

   A stunning push-to-talk orb powered by Google Gemini Live.
   States: idle → connecting → listening → speaking → connected
   Falls back to Web Speech API if Gemini is unavailable.

   Usage:
     <GeminiVoiceOrb
       systemPrompt="Tu es Maellis..."
       onTranscript={(text) => console.log(text)}
       onResponse={(text) => console.log(text)}
     />
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Mic, MicOff, Volume2, Sparkles, Loader2, WifiOff, Radio } from 'lucide-react';
import { useGeminiLive, type VoiceState } from '@/hooks/useGeminiLive';

interface GeminiVoiceOrbProps {
  /** Custom system prompt for Maellis */
  systemPrompt?: string;
  /** Gemini voice name */
  voice?: string;
  /** Compact mode for embedded use */
  compact?: boolean;
  /** Callback when user speech is transcribed */
  onTranscript?: (text: string) => void;
  /** Callback when Maellis responds */
  onResponse?: (text: string) => void;
}

/* ─── Animation Variants ─── */

const idleGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 30px rgba(245, 158, 11, 0.2), 0 0 60px rgba(245, 158, 11, 0.08)',
      '0 0 50px rgba(245, 158, 11, 0.35), 0 0 100px rgba(245, 158, 11, 0.15)',
      '0 0 30px rgba(245, 158, 11, 0.2), 0 0 60px rgba(245, 158, 11, 0.08)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

const pulseRing1: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.6, 1],
    opacity: [0.5, 0, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  exit: { scale: 1.2, opacity: 0 },
};

const pulseRing2: Variants = {
  initial: { scale: 1, opacity: 0.25 },
  animate: {
    scale: [1, 2, 1],
    opacity: [0.25, 0, 0.25],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
  },
  exit: { scale: 1.4, opacity: 0 },
};

const processingSpin: Variants = {
  animate: {
    rotate: [0, 360],
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
};

const transcriptSlide: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.2 } },
};

/* ─── Sound Wave Bars ─── */

function SoundWaveBars({ compact }: { compact: boolean }) {
  const barCount = 5;
  const barHeight = compact ? 'h-2.5' : 'h-4';
  const gap = compact ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`flex items-center justify-center ${gap}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`${barHeight} w-[3px] rounded-full bg-white`}
          animate={{
            scaleY: [0.3, 1, 0.3],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.08,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Status Badge ─── */

function StatusBadge({ state }: { state: VoiceState }) {
  const config: Record<VoiceState, { label: string; color: string; icon: React.ReactNode }> = {
    idle: {
      label: 'Gemini Live',
      color: 'bg-amber-50 text-amber-600 border-amber-200/60',
      icon: <Sparkles className="w-3 h-3" />,
    },
    connecting: {
      label: 'Connexion...',
      color: 'bg-slate-50 text-slate-500 border-slate-200/60',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    connected: {
      label: 'Prêt',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
      icon: <Radio className="w-3 h-3" />,
    },
    listening: {
      label: "J'écoute...",
      color: 'bg-amber-50 text-amber-600 border-amber-200/60',
      icon: <Mic className="w-3 h-3" />,
    },
    processing: {
      label: 'Traitement...',
      color: 'bg-violet-50 text-violet-600 border-violet-200/60',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    speaking: {
      label: 'Maellis répond...',
      color: 'bg-sky-50 text-sky-600 border-sky-200/60',
      icon: <Volume2 className="w-3 h-3" />,
    },
    error: {
      label: 'Erreur',
      color: 'bg-red-50 text-red-500 border-red-200/60',
      icon: <WifiOff className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[state];

  return (
    <motion.span
      key={state}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border shadow-sm ${color}`}
    >
      {icon}
      {label}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export function GeminiVoiceOrb({
  systemPrompt,
  voice = 'Charon',
  compact = false,
  onTranscript,
  onResponse,
}: GeminiVoiceOrbProps) {
  const gemini = useGeminiLive({
    voice,
    systemPrompt,
    autoConnect: false,
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  // Fire callbacks
  useEffect(() => {
    if (gemini.transcript && onTranscript) {
      onTranscript(gemini.transcript);
    }
  }, [gemini.transcript, onTranscript]);

  useEffect(() => {
    if (gemini.response && onResponse) {
      onResponse(gemini.response);
    }
  }, [gemini.response, onResponse]);

  // Orb sizes
  const orbSize = compact ? 'w-20 h-20' : 'w-32 h-32 sm:w-36 sm:h-36';
  const iconSize = compact ? 'w-8 h-8' : 'w-14 h-14 sm:w-16 sm:h-16';

  // Handle button interaction
  const handleClick = useCallback(async () => {
    if (!hasInteracted) {
      // First click → connect to Gemini
      setHasInteracted(true);
      gemini.connect();
      return;
    }

    if (gemini.state === 'idle' || gemini.state === 'error') {
      // Reconnect
      gemini.connect();
      return;
    }

    if (gemini.state === 'connected') {
      // Start listening
      await gemini.startListening();
      return;
    }

    if (gemini.state === 'listening') {
      // Stop listening
      gemini.stopListening();
      return;
    }

    if (gemini.state === 'speaking') {
      // Interrupt
      gemini.interrupt();
      return;
    }
  }, [gemini, hasInteracted]);

  // Orb visual classes based on state
  const getOrbStyle = (state: VoiceState) => {
    switch (state) {
      case 'idle':
        return {
          bg: 'from-amber-400 via-orange-400 to-amber-500',
          border: 'border-4 border-white/90',
          shadow: '0 0 80px rgba(245, 158, 11, 0.35), 0 0 40px rgba(245, 158, 11, 0.2), 0 25px 70px rgba(245, 158, 11, 0.25)',
          ringBg: 'from-amber-400 to-orange-500',
        };
      case 'connecting':
        return {
          bg: 'from-slate-300 via-slate-400 to-slate-500',
          border: 'border-4 border-white/90',
          shadow: '0 0 60px rgba(100, 116, 139, 0.3)',
          ringBg: 'from-slate-300 to-slate-400',
        };
      case 'connected':
        return {
          bg: 'from-emerald-400 via-emerald-500 to-teal-500',
          border: 'border-4 border-white/90',
          shadow: '0 0 80px rgba(16, 185, 129, 0.35), 0 0 40px rgba(16, 185, 129, 0.2), 0 25px 70px rgba(16, 185, 129, 0.25)',
          ringBg: 'from-emerald-400 to-teal-500',
        };
      case 'listening':
        return {
          bg: 'from-amber-500 via-orange-500 to-red-400',
          border: 'border-4 border-white/90',
          shadow: '0 0 100px rgba(245, 158, 11, 0.5), 0 0 50px rgba(239, 68, 68, 0.3), 0 25px 70px rgba(245, 158, 11, 0.35)',
          ringBg: 'from-amber-500 to-red-400',
        };
      case 'processing':
        return {
          bg: 'from-violet-400 via-purple-500 to-violet-600',
          border: 'border-4 border-white/90',
          shadow: '0 0 60px rgba(139, 92, 246, 0.3)',
          ringBg: 'from-violet-400 to-violet-600',
        };
      case 'speaking':
        return {
          bg: 'from-sky-400 via-blue-500 to-indigo-500',
          border: 'border-4 border-white/90',
          shadow: '0 0 100px rgba(14, 165, 233, 0.4), 0 0 50px rgba(99, 102, 241, 0.2), 0 25px 70px rgba(14, 165, 233, 0.3)',
          ringBg: 'from-sky-400 to-indigo-500',
        };
      case 'error':
        return {
          bg: 'from-red-400 to-red-600',
          border: 'border-4 border-white/90',
          shadow: '0 0 80px rgba(239, 68, 68, 0.35)',
          ringBg: 'from-red-400 to-red-600',
        };
    }
  };

  const orbStyle = getOrbStyle(gemini.state);

  // Icon rendering
  const renderContent = () => {
    switch (gemini.state) {
      case 'idle':
        return hasInteracted ? (
          <Sparkles className={`${iconSize} text-white`} />
        ) : (
          <Mic className={`${iconSize} text-white drop-shadow-lg`} />
        );
      case 'connecting':
        return (
          <motion.div variants={processingSpin} animate="animate">
            <Loader2 className={`${iconSize} text-white`} />
          </motion.div>
        );
      case 'connected':
        return <Mic className={`${iconSize} text-white`} />;
      case 'listening':
        return <Mic className={`${iconSize} text-white animate-pulse`} />;
      case 'processing':
        return (
          <motion.div variants={processingSpin} animate="animate">
            <Sparkles className={`${iconSize} text-white`} />
          </motion.div>
        );
      case 'speaking':
        return <SoundWaveBars compact={compact} />;
      case 'error':
        return <WifiOff className={`${iconSize} text-white`} />;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-5">
      {/* Status badge */}
      <AnimatePresence mode="wait">
        <StatusBadge state={gemini.state} />
      </AnimatePresence>

      {/* Orb container with pulse rings */}
      <motion.button
        onClick={handleClick}
        whileHover={gemini.state === 'connected' || gemini.state === 'idle' ? { scale: 1.08 } : undefined}
        whileTap={{ scale: 0.95 }}
        className={`relative ${orbSize} rounded-full flex items-center justify-center cursor-pointer select-none touch-manipulation bg-gradient-to-br ${orbStyle.bg} ${orbStyle.border} transition-all duration-500`}
        style={{ boxShadow: orbStyle.shadow }}
        aria-label={
          gemini.state === 'idle' && !hasInteracted
            ? 'Activer Maellis Gemini Live'
            : gemini.state === 'connected'
              ? 'Appuyez pour parler'
              : gemini.state === 'listening'
                ? "J'écoute — relâchez pour envoyer"
                : gemini.state === 'speaking'
                  ? 'Cliquez pour interrompre'
                  : 'Chargement...'
        }
      >
        {/* Idle glow animation */}
        {(gemini.state === 'idle' || gemini.state === 'connected') && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br opacity-50"
            style={{
              background: `radial-gradient(circle, transparent 40%, rgba(245, 158, 11, 0.1) 100%)`,
            }}
            variants={idleGlow}
            animate="animate"
          />
        )}

        {/* Pulse rings when listening */}
        <AnimatePresence>
          {gemini.state === 'listening' && (
            <>
              <motion.span
                key="ring-1"
                variants={pulseRing1}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute rounded-full border-2 border-amber-300/40 ${compact ? 'w-28 h-28' : 'w-44 h-44 sm:w-52 sm:h-52'}`}
              />
              <motion.span
                key="ring-2"
                variants={pulseRing2}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute rounded-full border border-amber-300/20 ${compact ? 'w-32 h-32' : 'w-56 h-56 sm:w-64 sm:h-64'}`}
              />
            </>
          )}
        </AnimatePresence>

        {/* Inner content */}
        <div className="relative z-10">
          {renderContent()}
        </div>
      </motion.button>

      {/* Prompt text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={gemini.state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-center text-xs sm:text-sm text-slate-500 max-w-[250px]"
        >
          {gemini.state === 'idle' && !hasInteracted && (
            <>Powered by <span className="font-semibold text-amber-600">Google Gemini Live</span></>
          )}
          {gemini.state === 'idle' && hasInteracted && (
            <>Cliquez pour vous <span className="font-semibold">reconnecter</span></>
          )}
          {gemini.state === 'connecting' && 'Connexion à Gemini...'}
          {gemini.state === 'connected' && 'Appuyez pour parler à Maellis'}
          {gemini.state === 'listening' && (
            <span className="font-semibold text-amber-600">Maellis vous écoute...</span>
          )}
          {gemini.state === 'processing' && 'Maellis réfléchit...'}
          {gemini.state === 'speaking' && (
            <span className="font-semibold text-sky-600">Maellis répond...</span>
          )}
          {gemini.state === 'error' && (
            <span className="text-red-500">{gemini.error ?? 'Erreur de connexion'}</span>
          )}
        </motion.p>
      </AnimatePresence>

      {/* Transcript display */}
      <AnimatePresence>
        {gemini.transcript && (
          <motion.div
            variants={transcriptSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-xs text-center px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm"
          >
            <p className="text-[10px] text-slate-400 mb-0.5">Vous avez dit :</p>
            <p className="text-sm text-slate-700 font-medium leading-snug">
              &quot;{gemini.transcript}&quot;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response display */}
      <AnimatePresence>
        {gemini.response && (
          <motion.div
            variants={transcriptSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-sm text-center px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 shadow-sm"
          >
            <p className="text-[10px] text-amber-500 mb-0.5 flex items-center justify-center gap-1">
              <Volume2 className="w-3 h-3" />
              Maellis
            </p>
            <p className="text-sm text-slate-700 font-medium leading-snug">
              {gemini.response}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
