'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════
   GLASS CARD — Reusable glassmorphism card
   ═══════════════════════════════════════════════════════ */

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'gold';
  glow?: boolean;
  animate?: boolean;
}

const glassClassMap: Record<string, string> = {
  default: 'glass',
  strong: 'glass-strong',
  gold: 'glass-gold',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export function GlassCard({
  children,
  className = '',
  variant = 'default',
  glow = false,
  animate = false,
}: GlassCardProps) {
  const glassClass = glassClassMap[variant] || glassClassMap.default;
  const glowClass = glow ? 'glow-gold' : '';

  const combinedClasses = [
    glassClass,
    'rounded-2xl',
    'inner-glow',
    glowClass,
    className,
  ].filter(Boolean).join(' ');

  if (animate) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className={combinedClasses}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={combinedClasses}>{children}</div>;
}
