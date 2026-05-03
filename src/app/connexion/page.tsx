'use client';

import { AuthPage } from '@/components/auth/auth-page';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Connexion Page
   Wraps AuthPage with a back link to homepage.
   ═══════════════════════════════════════════════════════ */

export default function ConnexionPage() {
  return (
    <AuthPage
      onBack={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }}
    />
  );
}
