'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AudioProvider } from '@/contexts/AudioContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { initPostHog } from '@/lib/analytics';
import { usePWA } from '@/hooks/usePWA';

/**
 * Internal component that registers the PWA service worker
 * and exposes install/network state. Rendered inside Providers
 * so the hook runs exactly once.
 */
function PWARegistrar() {
  usePWA();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AudioProvider>
        <I18nProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </I18nProvider>
      </AudioProvider>
      <PWARegistrar />
    </ThemeProvider>
  );
}
