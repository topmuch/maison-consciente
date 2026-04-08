'use client';

/* ═══════════════════════════════════════════════════════
   VOICE MODULE — Barrel Export

   Re-exports all voice-related components and hooks
   for convenient single-point import.

   Usage:
     import {
       VoiceOrb, VoiceSettingsPanel, VoiceTranscriptToast,
       HybridVoiceControl, useVoiceResponse
     } from '@/components/voice';
   ═══════════════════════════════════════════════════════ */

export { VoiceOrb } from './VoiceOrb';
export { VoiceSettingsPanel } from './VoiceSettingsPanel';
export { VoiceTranscriptToast } from './VoiceTranscriptToast';
export { HybridVoiceControl } from './HybridVoiceControl';
