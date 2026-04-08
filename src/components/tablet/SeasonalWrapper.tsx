"use client";

/* ═══════════════════════════════════════════════════════
   SeasonalWrapper — Decorative Season-Aware Overlay

   Adds subtle seasonal particle decorations and gradient
   accents on top of the tablet display. Optional manual
   season override for testing.
   ═══════════════════════════════════════════════════════ */

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { useSeason, type Season } from "@/hooks/useSeason";

interface Props {
  children: ReactNode;
  manualSeason?: Season;
  showParticles?: boolean;
}

/** Pre-defined floating particle positions */
const PARTICLES = [
  { top: "10%", left: "5%", delay: 0, size: 6 },
  { top: "25%", left: "85%", delay: 1.2, size: 4 },
  { top: "60%", left: "15%", delay: 2.5, size: 5 },
  { top: "45%", left: "70%", delay: 0.8, size: 3 },
  { top: "80%", left: "50%", delay: 3.1, size: 4 },
  { top: "15%", left: "60%", delay: 1.8, size: 3 },
];

export default function SeasonalWrapper({
  children,
  manualSeason,
  showParticles = true,
}: Props) {
  const theme = useSeason(manualSeason);

  return (
    <div className="relative">
      {/* Seasonal gradient overlay — very subtle */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${theme.gradientClass} pointer-events-none z-[2]`}
      />

      {/* Floating seasonal particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden">
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                backgroundColor: theme.particleColor,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.4, 0.2, 0.4, 0],
                scale: [0, 1, 0.8, 1.2, 0],
                y: [0, -20, 10, -15, 0],
                x: [0, 10, -5, 8, 0],
              }}
              transition={{
                duration: 8 + i,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      {children}
    </div>
  );
}
