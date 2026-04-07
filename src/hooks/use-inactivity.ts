'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useInactivity — Tracks user inactivity and returns idle state.
 *
 * @param timeout — Idle threshold in ms (default: 120000 = 2min for demo; use 7200000 for 2h)
 * @param enabled — Whether the hook is active (default: true)
 * @returns { isIdle, lastActivity, resetTimer }
 */

interface UseInactivityOptions {
  timeout?: number;
  enabled?: boolean;
}

export function useInactivity({
  timeout = 120000,
  enabled = true,
}: UseInactivityOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    setIsIdle(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    if (typeof window === 'undefined' || !enabled) {
      return;
    }

    // Reset on mount
    resetTimer();

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;

    for (const event of events) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of events) {
        window.removeEventListener(event, resetTimer);
      }
    };
  }, [resetTimer, enabled]);

  return { isIdle, lastActivity, resetTimer };
}
