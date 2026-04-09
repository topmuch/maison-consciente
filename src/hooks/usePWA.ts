'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Reads the initial "standalone" display-mode from the browser.
 * Safe to call on the client only; returns false during SSR.
 */
function getInitialStandaloneState(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(getInitialStandaloneState);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Register service worker
    let updateInterval: ReturnType<typeof setInterval> | undefined;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          // Check for updates every 60 seconds
          updateInterval = setInterval(() => {
            registration.update();
          }, 60_000);
        })
        .catch((err) => {
          console.warn('[PWA] SW registration failed:', err);
        });
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
      console.log('[PWA] App installed');
    };

    // Listen for online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Listen for display-mode changes (e.g. user installs while tab is open)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    mql.addEventListener('change', handleDisplayChange);

    return () => {
      if (updateInterval) clearInterval(updateInterval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mql.removeEventListener('change', handleDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;
    setIsInstallable(false);

    return outcome === 'accepted';
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    promptInstall,
  };
}
