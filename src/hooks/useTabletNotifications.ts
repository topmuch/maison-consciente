'use client';

/* ═══════════════════════════════════════════════════════
   USE TABLET NOTIFICATIONS — Polling Hook

   Polls the server every 5 s for pending notifications
   and speaks each one via TTS (2 s gap between messages).
   Also polls notification prefs every 60 s to check
   quiet hours on the client side.

   Cleanup: clears intervals, timeout chains, and
   cancels any in-flight speech on unmount.

   NOTE: Respects prefers-reduced-motion. The consuming
   component should use this media query to disable
   visual animations. The hook itself only handles
   polling + TTS, which are non-visual.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';
import {
  getPendingNotifications,
  getNotificationPrefs,
} from '@/actions/notification-actions';
import type { NotificationLogEntry, QuietHoursConfig } from '@/lib/notification-config';

/* ── Public return type ── */

export interface TabletNotificationReturn {
  /** true while unread notifications are being spoken */
  hasPending: boolean;
  /** Most recent notification message (null when idle) */
  lastMessage: string | null;
  /** Most recent notification type string (null when idle) */
  lastType: string | null;
  /** Whether TTS is currently speaking */
  isSpeaking: boolean;
  /** Whether currently inside quiet hours (client-side) */
  quietHours: boolean;
}

/* ── Quiet-hours helper (pure, no side-effects) ── */

function isNowInQuietHours(config: QuietHoursConfig): boolean {
  if (!config.enabled) return false;

  const hour = new Date().getHours();

  // Same-day range  (e.g. 1:00–5:00)
  if (config.start <= config.end) {
    return hour >= config.start && hour < config.end;
  }

  // Overnight range (e.g. 22:00–7:00)
  return hour >= config.start || hour < config.end;
}

/* ── Gap between consecutive notification speeches ── */
const SPEAK_GAP_MS = 2000;

/* ── Buffer after last speech trigger before clearing hasPending ── */
const SPEAK_BUFFER_MS = 8000;

/* ═══════════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════ */

export function useTabletNotifications(
  token: string,
): TabletNotificationReturn {
  const { speak, stop, isSpeaking } = useVoiceResponse();

  /* ── State ── */
  const [hasPending, setHasPending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastType, setLastType] = useState<string | null>(null);
  const [quietHours, setQuietHours] = useState(false);

  /* ── Refs (stable across renders) ── */
  const speakRef = useRef(speak);
  const stopRef = useRef(stop);
  const quietConfigRef = useRef<QuietHoursConfig | null>(null);

  // Interval handles
  const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prefsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // All pending setTimeout IDs (for cleanup)
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Keep TTS refs current ── */
  useEffect(() => { speakRef.current = speak; }, [speak]);
  useEffect(() => { stopRef.current = stop; }, [stop]);

  /* ═══════════════════════════════════════════════════════
     fetchPrefs — polls every 60 s
     ═══════════════════════════════════════════════════════ */

  const fetchPrefs = useCallback(async () => {
    try {
      const prefs = await getNotificationPrefs(token);
      quietConfigRef.current = prefs.quietHours ?? null;
      setQuietHours(isNowInQuietHours(prefs.quietHours));
    } catch {
      // Prefs fetch is non-critical — silent fail
    }
  }, [token]);

  /* ═══════════════════════════════════════════════════════
     speakChain — speaks an array of notifications with
     a 2 s gap between each, then clears hasPending.
     ═══════════════════════════════════════════════════════ */

  const speakChain = useCallback(
    (notifications: NotificationLogEntry[]) => {
      // Cancel any previous timeout chain
      for (const id of timeoutIdsRef.current) {
        clearTimeout(id);
      }
      timeoutIdsRef.current = [];

      if (notifications.length === 0) return;

      const inQuiet =
        quietConfigRef.current !== null
          ? isNowInQuietHours(quietConfigRef.current)
          : false;

      // Schedule each notification
      notifications.forEach((notif, index) => {
        const tid = setTimeout(() => {
          // speak() is a no-op when TTS is unsupported or muted
          // (checked internally by useVoiceResponse)
          if (!inQuiet) {
            speakRef.current(notif.message);
          }
        }, index * SPEAK_GAP_MS);
        timeoutIdsRef.current.push(tid);
      });

      // After the last notification + buffer, clear pending flag
      const clearDelay = (notifications.length - 1) * SPEAK_GAP_MS + SPEAK_BUFFER_MS;
      const clearTid = setTimeout(() => {
        setHasPending(false);
      }, clearDelay);
      timeoutIdsRef.current.push(clearTid);
    },
    // quietConfigRef is a ref (stable), no deps needed
    [],
  );

  /* ═══════════════════════════════════════════════════════
     fetchNotifications — polls every 5 s
     ═══════════════════════════════════════════════════════ */

  const fetchNotifications = useCallback(async () => {
    try {
      const pending = await getPendingNotifications(token);

      if (pending.length === 0) return;

      // Update state from first notification
      const first = pending[0];
      setLastMessage(first.message);
      setLastType(first.type);
      setHasPending(true);

      // Kick off the speak chain
      speakChain(pending);
    } catch {
      // Notification fetch is non-critical — silent fail
    }
  }, [token, speakChain]);

  /* ═══════════════════════════════════════════════════════
     Main polling effect
     ═══════════════════════════════════════════════════════ */

  useEffect(() => {
    if (!token) return;

    // Deferred initial fetch via setTimeout to avoid
    // synchronous setState-in-effect (lint rule).
    // The intervals below handle all subsequent polls.
    const initId = setTimeout(() => {
      fetchPrefs();
      fetchNotifications();
    }, 0);

    // Poll notifications every 5 seconds
    notifIntervalRef.current = setInterval(fetchNotifications, 5000);

    // Poll prefs every 60 seconds (they rarely change)
    prefsIntervalRef.current = setInterval(fetchPrefs, 60000);

    return () => {
      clearTimeout(initId);

      // Clear notification interval
      if (notifIntervalRef.current !== null) {
        clearInterval(notifIntervalRef.current);
        notifIntervalRef.current = null;
      }

      // Clear prefs interval
      if (prefsIntervalRef.current !== null) {
        clearInterval(prefsIntervalRef.current);
        prefsIntervalRef.current = null;
      }

      // Clear all pending timeouts in the speak chain
      for (const id of timeoutIdsRef.current) {
        clearTimeout(id);
      }
      timeoutIdsRef.current = [];

      // Cancel any in-flight speech
      stopRef.current();
    };
  }, [token, fetchNotifications, fetchPrefs]);

  return { hasPending, lastMessage, lastType, isSpeaking, quietHours };
}
