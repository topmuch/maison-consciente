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

function configureOneSignal(setState: React.Dispatch<React.SetStateAction<OneSignalState>>) {
  const os = getOneSignal();
  if (!os) return;

  os.push(() => {
    os.init({
      appId: ONESIGNAL_APP_ID,
      notifyButton: { enable: false },
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: 'sw.js',
      allowLocalhostAsSecureOrigin: true,
    });

    os.isPushNotificationsEnabled().then((enabled: boolean) => {
      setState(prev => ({ ...prev, isSubscribed: enabled }));
    });

    os.getUserId().then((id: string | null) => {
      setState(prev => ({ ...prev, playerId: id }));
    });

    os.getNotificationPermission().then((perm: NotificationPermission) => {
      setState(prev => ({ ...prev, permission: perm, isInitialized: true }));
    });

    os.on('subscriptionChange', (isSubscribed: boolean) => {
      setState(prev => ({ ...prev, isSubscribed }));
      if (isSubscribed) {
        os.getUserId().then((id: string | null) => {
          if (id) {
            setState(prev => ({ ...prev, playerId: id }));
            fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId: id }),
            }).catch(() => { /* fire-and-forget */ });
          }
        });
      }
    });
  });
}

export function useOneSignal() {
  const isConfigured = typeof window !== 'undefined' && !!ONESIGNAL_APP_ID;

  const [state, setState] = useState<OneSignalState>({
    isSubscribed: false,
    isInitialized: !isConfigured, // Skip init phase if no app ID
    permission: 'default',
    playerId: null,
  });

  // Initialize OneSignal SDK
  useEffect(() => {
    if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) {
      return;
    }

    function tryInit() {
      const os = getOneSignal();
      if (os) {
        configureOneSignal(setState);
        return;
      }
      // SDK not ready yet, retry after a short delay
      const timer = setTimeout(tryInit, 1000);
    }

    // Check if script already loaded
    if (document.querySelector('script[src*="OneSignalSDK"]')) {
      tryInit();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.async = true;
    script.setAttribute('data-app-id', ONESIGNAL_APP_ID);
    document.head.appendChild(script);

    script.onload = tryInit;
    script.onerror = () => {
      console.error('[OneSignal] Failed to load SDK');
      setState(prev => ({ ...prev, isInitialized: true }));
    };
  }, []);

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

      await fetch('/api/push/subscribe', { method: 'DELETE' }).catch(() => { /* fire-and-forget */ });
      return true;
    } catch (err) {
      console.error('[OneSignal] Unsubscribe failed:', err);
      return false;
    }
  }, []);

  return { ...state, subscribe, unsubscribe };
}
