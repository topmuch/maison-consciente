'use client';

import { useState, useEffect, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   OneSignal Push Notification Hook

   Initializes OneSignal Web SDK dynamically and provides
   subscribe/unsubscribe methods. Stores player ID on backend.
   ═══════════════════════════════════════════════════════ */

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

interface OneSignalState {
  isSubscribed: boolean;
  isInitialized: boolean;
  permission: NotificationPermission;
  playerId: string | null;
}

function getOneSignal(): OneSignal | undefined {
  if (typeof window === 'undefined') return undefined;
  const os = window.OneSignal;
  if (Array.isArray(os) || !os) return undefined;
  return os;
}

export function useOneSignal() {
  const [state, setState] = useState<OneSignalState>({
    isSubscribed: false,
    isInitialized: false,
    permission: 'default',
    playerId: null,
  });

  // Initialize OneSignal SDK
  useEffect(() => {
    if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) {
      console.warn('[OneSignal] App ID not configured');
      return;
    }

    // Check if script already loaded
    if (document.querySelector('script[src*="OneSignalSDK"]')) {
      initOneSignal();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.setAttribute('data-app-id', ONESIGNAL_APP_ID);
    document.head.appendChild(script);

    script.onload = () => initOneSignal();
    script.onerror = () => console.error('[OneSignal] Failed to load SDK');
  }, []);

  function initOneSignal() {
    const os = getOneSignal();
    if (!os) {
      // SDK not ready yet, retry
      const timer = setTimeout(() => {
        const retry = getOneSignal();
        if (retry) configureOneSignal(retry);
      }, 1000);
      return () => clearTimeout(timer);
    }
    configureOneSignal(os);
  }

  function configureOneSignal(os: OneSignal) {
    os.push(() => {
      os.init({
        appId: ONESIGNAL_APP_ID,
        notifyButton: { enable: false },
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'sw.js',
        allowLocalhostAsSecureOrigin: true,
      });

      // Check current state
      os.isPushNotificationsEnabled().then((enabled: boolean) => {
        setState(prev => ({ ...prev, isSubscribed: enabled }));
      });

      os.getUserId().then((id: string | null) => {
        setState(prev => ({ ...prev, playerId: id }));
      });

      os.getNotificationPermission().then((perm: NotificationPermission) => {
        setState(prev => ({ ...prev, permission: perm, isInitialized: true }));
      });

      // Listen for subscription changes
      os.on('subscriptionChange', (isSubscribed: boolean) => {
        setState(prev => ({ ...prev, isSubscribed }));
        if (isSubscribed) {
          os.getUserId().then((id: string | null) => {
            if (id) {
              setState(prev => ({ ...prev, playerId: id }));
              // Sync with backend
              fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: id }),
              }).catch(() => {});
            }
          });
        }
      });
    });
  }

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    const os = getOneSignal();
    if (!os) {
      console.error('[OneSignal] SDK not initialized');
      return false;
    }

    try {
      await os.registerForPushNotifications();
      const playerId = await os.getUserId();

      if (playerId) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        });
        setState(prev => ({ ...prev, isSubscribed: true, playerId }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('[OneSignal] Subscribe failed:', err);
      return false;
    }
  }, []);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    const os = getOneSignal();
    if (!os) return false;

    try {
      await os.setSubscription(false);
      setState(prev => ({ ...prev, isSubscribed: false, playerId: null }));

      await fetch('/api/push/subscribe', { method: 'DELETE' }).catch(() => {});
      return true;
    } catch (err) {
      console.error('[OneSignal] Unsubscribe failed:', err);
      return false;
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
