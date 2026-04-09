"use client";

/* ═══════════════════════════════════════════════════════
   CommandOrb — Visual Voice State Indicator

   Circular pulsating orb with 6 visual states:
   - idle: dim amber glow, small size
   - listening: pulsing amber orb (wake word detected), large
   - waiting_command: cyan pulsing (waiting for command text)
   - processing: green spinning glow
   - conversation_window: soft purple pulse (follow-up mode)
   - speaking: animated wave rings

   Inner circle with gradient, outer ring with glow.
   Framer Motion animations, Dark Luxe theme.
   ═══════════════════════════════════════════════════════ */

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Mic, Loader2, Ear, MessageCircle, Volume2 } from "lucide-react";

/* ── Types ── */

interface CommandOrbProps {
  state: "idle" | "listening" | "waiting_command" | "processing" | "conversation_window" | "speaking";
  onClick?: () => void;
  transcript?: string;
  size?: "sm" | "md" | "lg";
}

/* ── Size Map ── */

const sizeMap = {
  sm: { orb: "w-12 h-12 min-h-[48px] min-w-[48px]", icon: "w-5 h-5", ring: 1.8, glow: 16 },
  md: { orb: "w-16 h-16 min-h-[64px] min-w-[64px]", icon: "w-6 h-6", ring: 2.0, glow: 24 },
  lg: { orb: "w-24 h-24 min-h-[96px] min-w-[96px]", icon: "w-8 h-8", ring: 2.2, glow: 36 },
};

/* ── State Color Config ── */

const stateConfig = {
  idle: {
    gradient: "from-amber-500/20 to-amber-700/10",
    border: "border-amber-400/15 hover:border-amber-400/30",
    bg: "bg-amber-400/5 hover:bg-amber-400/10",
    glowColor: "rgba(251, 191, 36, 0.08)",
    ringColor: "border-amber-400/20",
    iconColor: "text-amber-400/60",
  },
  listening: {
    gradient: "from-amber-400/30 to-amber-600/20",
    border: "border-amber-400/50",
    bg: "bg-amber-400/15",
    glowColor: "rgba(251, 191, 36, 0.35)",
    ringColor: "border-amber-400/40",
    iconColor: "text-amber-400",
  },
  waiting_command: {
    gradient: "from-cyan-400/30 to-cyan-600/20",
    border: "border-cyan-400/50",
    bg: "bg-cyan-400/15",
    glowColor: "rgba(56, 189, 248, 0.4)",
    ringColor: "border-cyan-400/40",
    iconColor: "text-cyan-400",
  },
  processing: {
    gradient: "from-emerald-400/30 to-emerald-600/20",
    border: "border-emerald-400/50",
    bg: "bg-emerald-400/15",
    glowColor: "rgba(52, 211, 153, 0.4)",
    ringColor: "border-emerald-400/40",
    iconColor: "text-emerald-400",
  },
  conversation_window: {
    gradient: "from-violet-400/30 to-violet-600/20",
    border: "border-violet-400/50",
    bg: "bg-violet-400/15",
    glowColor: "rgba(139, 92, 246, 0.35)",
    ringColor: "border-violet-400/40",
    iconColor: "text-violet-400",
  },
  speaking: {
    gradient: "from-amber-400/25 to-copper-light/20",
    border: "border-amber-400/40",
    bg: "bg-amber-400/10",
    glowColor: "rgba(251, 191, 36, 0.25)",
    ringColor: "border-amber-400/30",
    iconColor: "text-amber-400",
  },
} as const;

type OrbState = keyof typeof stateConfig;

/* ── Animation Variants ── */

const pulseRingVariant: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.6, 1],
    opacity: [0.5, 0, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  exit: { scale: 1, opacity: 0 },
};

const pulseRing2Variant: Variants = {
  initial: { scale: 1, opacity: 0.3 },
  animate: {
    scale: [1, 2.0, 1],
    opacity: [0.3, 0, 0.3],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.7 },
  },
  exit: { scale: 1, opacity: 0 },
};

const waveRingVariant = (index: number): Variants => ({
  initial: { scale: 1, opacity: 0.4 },
  animate: {
    scale: [1, 1.4 + index * 0.15, 1],
    opacity: [0.4, 0, 0.4],
    transition: {
      duration: 1.8 + index * 0.3,
      repeat: Infinity,
      ease: "easeInOut",
      delay: index * 0.25,
    },
  },
  exit: { scale: 1, opacity: 0 },
});

const orbScaleVariants: Record<OrbState, any> = {
  idle: { scale: 1, transition: { duration: 0.3 } },
  listening: {
    scale: [1, 1.06, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  waiting_command: {
    scale: [1, 1.1, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
  processing: {
    scale: 1.12,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  conversation_window: {
    scale: [1, 1.04, 1],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
  speaking: {
    scale: [1, 1.03, 1],
    transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
  },
};

/* ── Icon by State ── */

function OrbIcon({ state, iconSize }: { state: OrbState; iconSize: string }) {
  switch (state) {
    case "processing":
      return <Loader2 className={`${iconSize} animate-spin text-emerald-400`} />;
    case "waiting_command":
      return <Ear className={`${iconSize} text-cyan-400`} />;
    case "conversation_window":
      return <MessageCircle className={`${iconSize} text-violet-400`} />;
    case "speaking":
      return <Volume2 className={`${iconSize} text-amber-400`} />;
    case "listening":
      return <Mic className={`${iconSize} text-amber-400`} />;
    default:
      return <Mic className={`${iconSize} text-amber-400/60`} />;
  }
}

/* ── Main Component ── */

export default function CommandOrb({
  state,
  onClick,
  transcript,
  size = "md",
}: CommandOrbProps) {
  const cfg = sizeMap[size];
  const colors = stateConfig[state];
  const isActive = state !== "idle";
  const isListening = state === "listening";
  const isWaiting = state === "waiting_command";
  const isProcessing = state === "processing";
  const isConversation = state === "conversation_window";
  const isSpeaking = state === "speaking";

  const ariaLabel = {
    idle: "Assistant vocal inactif — touchez ou dites Maison",
    listening: "Écoute en arrière-plan — dites Maison",
    waiting_command: "En attente de votre commande",
    processing: "Exécution de la commande…",
    conversation_window: "Mode conversation — dites une commande",
    speaking: "Réponse vocale en cours",
  }[state];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Outer ring with glow */}
      <motion.button
        type="button"
        variants={orbScaleVariants as any}
        animate={state}
        whileTap={{ scale: 0.88 }}
        onClick={onClick}
        className={`
          relative flex items-center justify-center
          ${cfg.orb} rounded-full
          border backdrop-blur-xl
          transition-colors duration-300 cursor-pointer
          select-none touch-manipulation
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50
          ${colors.border} ${colors.bg}
        `}
        aria-label={ariaLabel}
        style={{
          boxShadow: isActive
            ? `0 0 ${cfg.glow}px ${colors.glowColor}, 0 0 ${cfg.glow * 2}px ${colors.glowColor.replace(/[\d.]+\)$/, "0.1)")}`
            : `0 0 ${cfg.glow * 0.5}px ${colors.glowColor}`,
        }}
      >
        {/* Inner circle gradient */}
        <div
          className={`
            absolute inset-1 rounded-full
            bg-gradient-to-br ${colors.gradient}
            pointer-events-none
          `}
        />

        {/* Listening: double pulse rings (amber) */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.span
                key="listen-ring-1"
                variants={pulseRingVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute inset-0 rounded-full border-2 ${colors.ringColor}`}
              />
              <motion.span
                key="listen-ring-2"
                variants={pulseRing2Variant}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 rounded-full border border-amber-400/15"
              />
            </>
          )}
        </AnimatePresence>

        {/* Waiting command: cyan single pulse ring */}
        <AnimatePresence>
          {isWaiting && (
            <motion.span
              key="wait-ring"
              variants={pulseRingVariant}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`absolute inset-0 rounded-full border-2 ${colors.ringColor}`}
            />
          )}
        </AnimatePresence>

        {/* Processing: green spinning ring */}
        <AnimatePresence>
          {isProcessing && (
            <motion.span
              key="proc-ring"
              initial={{ rotate: 0, opacity: 0.6 }}
              animate={{
                rotate: 360,
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                opacity: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
              }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 rounded-full border-2 border-dashed ${colors.ringColor}`}
            />
          )}
        </AnimatePresence>

        {/* Conversation window: soft purple pulse */}
        <AnimatePresence>
          {isConversation && (
            <>
              <motion.span
                key="conv-ring-1"
                variants={pulseRingVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute inset-0 rounded-full border ${colors.ringColor}`}
              />
              <motion.span
                key="conv-ring-2"
                variants={pulseRing2Variant}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 rounded-full border border-violet-400/15"
              />
            </>
          )}
        </AnimatePresence>

        {/* Speaking: animated wave rings */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={`wave-ring-${i}`}
                  variants={waveRingVariant(i)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={`absolute inset-0 rounded-full border ${i === 0 ? "border-2" : "border"} ${colors.ringColor}`}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={
            isActive
              ? { scale: [1, 1.08, 1] }
              : { scale: 1 }
          }
          transition={
            isActive
              ? { duration: isSpeaking ? 0.6 : 1.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.3 }
          }
          className="relative z-10"
        >
          <OrbIcon state={state} iconSize={cfg.icon} />
        </motion.div>
      </motion.button>

      {/* Transcript text */}
      <AnimatePresence>
        {transcript && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={`
              max-w-[200px] text-center text-xs leading-relaxed
              text-[#94a3b8] truncate
              select-none pointer-events-none
            `}
          >
            &ldquo;{transcript}&rdquo;
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
