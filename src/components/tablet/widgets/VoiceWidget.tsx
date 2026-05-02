"use client";

/* ═══════════════════════════════════════════════════════
   VoiceWidget — Wraps HybridVoiceControl

   Simple wrapper around the existing voice control component
   with proper styling for the widget grid.
   ═══════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { HybridVoiceControl } from "@/components/voice/HybridVoiceControl";

export function VoiceWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="glass rounded-2xl p-5"
    >
      <div className="divider-gold mb-6" />
      <HybridVoiceControl householdId="tablet" compact />
    </motion.div>
  );
}
