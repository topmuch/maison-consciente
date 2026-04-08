/* ═══════════════════════════════════════════════════════
   haptic.ts — Haptic Feedback Engine

   Typed wrapper around the Vibration API.
   Silent fallback on iOS/Safari (no console errors).
   100% local — no external dependencies.
   ═══════════════════════════════════════════════════════ */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: [15, 40, 15],
  heavy: [30, 80, 30],
  success: [20, 30, 20],
  error: [100, 50, 100],
};

/**
 * Trigger a haptic vibration on supported devices (Android).
 * Silently no-ops on iOS/Safari or unsupported environments.
 */
export function triggerHaptic(type: HapticPattern = "light"): void {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(PATTERNS[type]);
    } catch {
      /* Silent fallback */
    }
  }
}

/**
 * React hook for easy haptic integration in components.
 * Returns the triggerHaptic function — call with a pattern name.
 *
 * @example
 * const haptic = useHaptic();
 * <button onClick={() => haptic("success")}>Save</button>
 */
export function useHaptic() {
  return triggerHaptic;
}
