'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

// ═══════════════════════════════════════════════════════
// Elegant Standby Mode — Maison Consciente
// After inactivity, deep black + pulsing golden glow
// Ambient floating particles + breathing ring + concentric rings
// Smooth transition to active state on next interaction
// ═══════════════════════════════════════════════════════

interface StandbyOverlayProps {
  isActive: boolean;
  onDismiss: () => void;
}

// Pre-generate deterministic particle configs
function generateParticles(count: number) {
  const particles: Array<{ id: number; x: number; size: number; duration: number; delay: number; opacity: number; drift: number }> = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: 10 + (Math.sin(i * 7.3 + 1.2) * 0.5 + 0.5) * 80, // 10-90%
      size: 2 + ((i * 3.7) % 3), // 2-4px
      duration: 6 + ((i * 2.3) % 7), // 6-12s
      delay: ((i * 1.7) % 5), // 0-5s stagger
      opacity: 0.1 + ((i * 0.19) % 0.31), // 0.1-0.4
      drift: -15 - ((i * 4.1) % 20), // upward drift amount
    });
  }
  return particles;
}

export function StandbyOverlay({ isActive, onDismiss }: StandbyOverlayProps) {
  const particles = useMemo(() => generateParticles(15), []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="standby-overlay cursor-pointer"
          onClick={onDismiss}
          onTouchStart={onDismiss}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onDismiss();
          }}
          role="button"
          tabIndex={0}
          aria-label="Réveiller l'interface — cliquez ou appuyez"
        >
          {/* ═══ Ambient Floating Particles ═══ */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${p.x}%`,
                bottom: '10%',
                width: p.size,
                height: p.size,
                background: 'var(--accent-primary)',
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, p.opacity, 0],
                y: [0, p.drift],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: 'easeOut',
                delay: p.delay,
              }}
            />
          ))}

          {/* ═══ Outer Halo ═══ */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.08, 0.15, 0.08],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* ═══ Breathing Ring (around central orb) ═══ */}
          <motion.div
            animate={{
              scale: [0.95, 1.1, 0.95],
              opacity: [0.08, 0.15, 0.08],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 320,
              height: 320,
              border: '1px solid var(--accent-primary)',
              boxShadow: '0 0 40px 0 var(--accent-primary)',
            }}
          />

          {/* ═══ Main Pulsing Orb (280px) ═══ */}
          <motion.div
            animate={{
              scale: [0.95, 1.05, 0.95],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 280,
              height: 280,
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* ═══ Concentric Inner Ring — 60% (168px) ═══ */}
          <motion.div
            animate={{
              scale: [0.96, 1.04, 0.96],
              opacity: [0.12, 0.22, 0.12],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 168,
              height: 168,
              border: '1px solid var(--accent-primary)',
            }}
          />

          {/* ═══ Concentric Inner Ring — 30% (84px) ═══ */}
          <motion.div
            animate={{
              scale: [0.97, 1.03, 0.97],
              opacity: [0.15, 0.28, 0.15],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4,
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 84,
              height: 84,
              border: '1px solid var(--accent-primary)',
            }}
          />

          {/* ═══ Inner Bright Core ═══ */}
          <motion.div
            animate={{
              scale: [0.3, 0.4, 0.3],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute w-[60px] h-[60px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, var(--accent-primary-light) 0%, var(--accent-primary) 40%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          {/* ═══ Diamond Icon in Center ═══ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: 1.2, duration: 1.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="absolute pointer-events-none"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="logo-glow"
            >
              <path
                d="M14 4L24 14L14 24L4 14Z"
                stroke="var(--accent-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="var(--accent-primary)"
                fillOpacity="0.1"
              />
            </svg>
          </motion.div>

          {/* ═══ "Veille Élégante" Text with Serif Font ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
            className="standby-text flex flex-col items-center gap-2"
          >
            <p className="font-serif text-sm tracking-[0.15em] uppercase" style={{ color: 'var(--accent-primary)' }}>
              Veille Élégante
            </p>
            <p className="text-[10px] tracking-widest uppercase opacity-40">
              Touchez pour réveiller
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
