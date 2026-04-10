'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Diamond, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { AuthPage } from '@/components/auth/auth-page';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { AppShell } from '@/components/layout/app-shell';
import { ViewRouter } from '@/components/layout/view-router';

/* ═══════════════════════════════════════════════════════════════
   MAELLIS — Application Root Router

   States:
   1. loading   → Checking session
   2. unauth    → AuthPage (login/register)
   3. onboarding→ OnboardingFlow (6-step wizard)
   4. app       → AppShell + ViewRouter (main application)
   ═══════════════════════════════════════════════════════════════ */

type AppState = 'loading' | 'unauth' | 'onboarding' | 'app';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('loading');
  const { setAuth, clearAuth, user } = useAuthStore();
  const { setView } = useAppStore();

  /* ── Check session on mount ── */
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (res.ok && data.success) {
        // Set auth state in store
        setAuth({
          userId: data.user.id,
          email: data.user.email,
          householdId: data.user.householdId,
          role: data.user.role,
          name: data.user.name,
          avatar: data.user.avatar,
          householdName: data.household?.name,
          householdType: data.household?.type,
        } as any);

        // Determine onboarding state
        if (data.onboardingCompleted) {
          setAppState('app');
        } else {
          setAppState('onboarding');
        }
      } else {
        clearAuth();
        setAppState('unauth');
      }
    } catch {
      clearAuth();
      setAppState('unauth');
    }
  }, [setAuth, clearAuth]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  /* ── Handle onboarding completion ── */
  const handleOnboardingComplete = useCallback(() => {
    setAppState('app');
    setView('dashboard');
  }, [setView]);

  /* ── Handle successful login/register ── */
  const handleAuthSuccess = useCallback(() => {
    // Re-check session after auth to get household + onboarding state
    checkSession();
  }, [checkSession]);

  /* ═══════════════════════════════════════════════════
     LOADING SCREEN
     ═══════════════════════════════════════════════════ */
  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-animated-gradient noise-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-dark)] flex items-center justify-center shadow-lg shadow-[oklch(0.78_0.14_85/20%)]">
            <Diamond className="w-8 h-8 text-[#0a0a12]" />
          </div>

          {/* Spinner */}
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-[oklch(0.20_0.02_260)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-primary)] animate-spin" />
          </div>

          {/* Brand */}
          <div className="text-center">
            <h1 className="font-serif text-gradient-gold text-xl tracking-wide">
              Maison Consciente
            </h1>
            <p className="text-xs text-[oklch(0.50_0.02_260)] mt-1 tracking-widest uppercase">
              Connexion en cours…
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════
     UNAUTHENTICATED → Auth Page
     ═══════════════════════════════════════════════════ */
  if (appState === 'unauth') {
    return <AuthPage />;
  }

  /* ═══════════════════════════════════════════════════
     ONBOARDING → 6-Step Wizard
     ═══════════════════════════════════════════════════ */
  if (appState === 'onboarding') {
    return (
      <OnboardingFlow
        householdId={user?.householdId || ''}
        currentHouseholdName={useAuthStore.getState().householdName || ''}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  /* ═══════════════════════════════════════════════════
     AUTHENTICATED → App Shell + View Router
     ═══════════════════════════════════════════════════ */
  return (
    <AppShell>
      <ViewRouter />
    </AppShell>
  );
}
