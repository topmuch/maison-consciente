'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════
// Signature Loading Animation — "Maison Consciente"
// Premium MC monogram with golden glow, sparkle particles,
// clip-path text reveal, and refined progress line
// ═══════════════════════════════════════════════════════════════

/** Monogram stroke paths — each draws in sequence with staggered delays */
const MONOGRAM_PATHS = [
  // Path 0: M — left outer stroke
  { d: 'M22 68 L22 16', length: 52, delay: 0, width: 2.8, cap: 'round' },
  // Path 1: M — right outer stroke
  { d: 'M78 68 L78 16', length: 52, delay: 0.2, width: 2.8, cap: 'round' },
  // Path 2: M — inner left V leg (down to center)
  { d: 'M22 16 L50 50', length: 40, delay: 0.4, width: 2.2, cap: 'round' },
  // Path 3: M — inner right V leg (down from center)
  { d: 'M78 16 L50 50', length: 40, delay: 0.55, width: 2.2, cap: 'round' },
  // Path 4: C — top serif
  { d: 'M58 16 L62 16', length: 4, delay: 0.75, width: 2.2, cap: 'round' },
  // Path 5: C — main curve arc
  { d: 'M58 16 C28 16 12 34 12 52 C12 70 28 76 52 72', length: 120, delay: 0.85, width: 2.8, cap: 'round' },
  // Path 6: C — bottom serif
  { d: 'M52 72 L58 72', length: 6, delay: 1.2, width: 2.2, cap: 'round' },
  // Path 7: Diamond gem at top center
  { d: 'M50 4 L56 12 L50 20 L44 12 Z', length: 36, delay: 1.4, width: 1.8, cap: 'round', join: 'round' },
];

/** Sparkle particle positions — scattered around the monogram */
const SPARKLES = [
  { x: 10, y: 8, size: 3, opacity: 0.5, delay: 0, duration: 3.2 },
  { x: 88, y: 12, size: 2, opacity: 0.35, delay: 0.6, duration: 3.8 },
  { x: 6, y: 55, size: 2.5, opacity: 0.4, delay: 1.1, duration: 3.5 },
  { x: 92, y: 60, size: 3, opacity: 0.45, delay: 0.3, duration: 3.0 },
  { x: 18, y: 75, size: 2, opacity: 0.3, delay: 0.9, duration: 4.0 },
  { x: 82, y: 78, size: 2.5, opacity: 0.35, delay: 1.4, duration: 3.6 },
  { x: 50, y: 85, size: 2, opacity: 0.3, delay: 0.5, duration: 3.3 },
  { x: 35, y: 2, size: 2, opacity: 0.25, delay: 1.8, duration: 3.9 },
];

/** Draw-in variant for each SVG path */
const pathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay },
      opacity: { duration: 0.15, delay },
    },
  }),
};

export function SignatureLoading() {
  const mounted = true;
  const glowControls = useAnimation();

  useEffect(() => {
    // Start pulsing glow after logo finishes drawing (~2.2s)
    const timer = setTimeout(() => {
      glowControls.start('pulse');
    }, 2200);
    return () => clearTimeout(timer);
  }, [glowControls]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4 bg-[#020617] overflow-hidden relative">
      {/* ── Breathing radial gradient background ── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        {/* Large diffuse glow */}
        <motion.div
          className="w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 65%)',
            filter: 'blur(100px)',
          }}
          initial={{ opacity: 0.12, scale: 0.95 }}
          animate={{
            opacity: [0.12, 0.2, 0.12],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Smaller focused glow */}
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary-light) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          initial={{ opacity: 0.08, scale: 0.9 }}
          animate={{
            opacity: [0.08, 0.18, 0.08],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* ── Sparkle Particles ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {mounted && SPARKLES.map((s, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              backgroundColor: 'var(--accent-primary)',
            }}
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{
              opacity: [0, s.opacity, 0],
              y: [-8, -30, -55],
              scale: [0, 1, 0.5],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              delay: s.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* ── MC Monogram SVG ── */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <motion.svg
          width="100"
          height="90"
          viewBox="0 0 100 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial="idle"
          animate={glowControls}
          variants={{
            idle: { filter: 'drop-shadow(0 0 4px var(--accent-primary)) drop-shadow(0 0 12px var(--accent-primary-glow))' },
            pulse: {
              filter: [
                'drop-shadow(0 0 6px var(--accent-primary)) drop-shadow(0 0 18px var(--accent-primary-glow))',
                'drop-shadow(0 0 14px var(--accent-primary-light)) drop-shadow(0 0 36px var(--accent-primary-glow-strong))',
                'drop-shadow(0 0 6px var(--accent-primary)) drop-shadow(0 0 18px var(--accent-primary-glow))',
              ],
              transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            },
          }}
        >
          {MONOGRAM_PATHS.map((p, i) => (
            <motion.path
              key={i}
              d={p.d}
              stroke={
                i === 7
                  ? 'var(--accent-primary-light)'
                  : i >= 4
                    ? 'var(--accent-primary-light)'
                    : 'var(--accent-primary)'
              }
              strokeWidth={p.width}
              strokeLinecap={p.cap as 'round' | 'butt' | 'square'}
              strokeLinejoin={(p.join as 'round' | 'miter' | 'bevel') || 'round'}
              variants={pathVariants}
              initial="hidden"
              animate="visible"
              custom={p.delay}
            />
          ))}
        </motion.svg>
      </motion.div>

      {/* ── Brand Name — Clip-Path Reveal ── */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 0.4 }}
        >
          <motion.h1
            className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-gradient-gold relative"
            style={{ display: 'inline-block' }}
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ delay: 2.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            Maison Consciente
          </motion.h1>
        </motion.div>

        {/* ── Diamond Separator ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 2.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="flex items-center gap-3"
        >
          <motion.div
            className="h-px w-8"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.4 }}
            transition={{ delay: 2.7, duration: 0.5 }}
            originX={1}
          />
          <svg width="8" height="8" viewBox="0 0 8 8" className="shrink-0">
            <motion.path
              d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="0.8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: 2.65, duration: 0.6 }}
            />
          </svg>
          <motion.div
            className="h-px w-8"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.4 }}
            transition={{ delay: 2.7, duration: 0.5 }}
            originX={0}
          />
        </motion.div>

        {/* ── Subtitle — Fade + Scale ── */}
        <motion.p
          className="text-xs uppercase tracking-[0.25em] font-medium"
          style={{ color: 'var(--accent-primary)', opacity: 0.5 }}
          initial={{ opacity: 0, scale: 0.95, y: 6 }}
          animate={{ opacity: 0.5, scale: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          L&apos;Habitation Intelligente
        </motion.p>
      </div>

      {/* ── Golden Progress Line ── */}
      <motion.div
        className="relative z-10 w-48 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'oklch(1 0 0 / 6%)' }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 3.0, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        {/* Animated sweep */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--accent-primary), var(--accent-primary-light), transparent)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            delay: 3.2,
          }}
        />
        {/* Subtle ambient glow line */}
        <motion.div
          className="absolute inset-y-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent 20%, var(--accent-primary-glow) 50%, transparent 80%)',
          }}
          animate={{ x: ['-60%', '160%'] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3.0,
          }}
        />
      </motion.div>

      {/* ── Bottom Decorative Line ── */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 3.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="w-40 h-px relative z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
          opacity: 0.15,
        }}
      />
    </div>
  );
}
