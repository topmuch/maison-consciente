'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   GOLDEN BUTTON — Luxury reusable button
   ═══════════════════════════════════════════════════════ */

interface GoldenButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
}

const sizeMap: Record<string, string> = {
  sm: 'h-9 px-4 text-xs rounded-lg',
  md: 'h-11 px-6 text-sm rounded-xl',
  lg: 'h-13 px-8 text-base rounded-xl',
};

const variantMap: Record<string, string> = {
  primary:
    'bg-gradient-gold text-[#0a0a12] font-semibold shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)]',
  outline:
    'bg-transparent border border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.08] hover:border-[var(--accent-primary)]/40',
  ghost:
    'bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/[0.06]',
};

export function GoldenButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
}: GoldenButtonProps) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const variantClass = variantMap[variant] || variantMap.primary;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.25 }}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-300 ease-out
        ${sizeClass}
        ${variantClass}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
