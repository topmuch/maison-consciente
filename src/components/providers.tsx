'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AudioProvider } from '@/contexts/AudioContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { initPostHog } from '@/lib/analytics';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AudioProvider>
        <I18nProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </I18nProvider>
      </AudioProvider>
    </ThemeProvider>
  );
}
