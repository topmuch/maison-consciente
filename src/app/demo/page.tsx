'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Diamond, ArrowLeft } from 'lucide-react';
import { DemoSelection } from '@/components/demo/DemoSelection';
import { DemoParticulier } from '@/components/demo/DemoParticulier';
import { DemoAirbnb } from '@/components/demo/DemoAirbnb';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Demo Page Router

   States:
   1. selection → DemoSelection (choose Particulier / Airbnb)
   2. particulier → DemoParticulier (full demo with voice)
   3. airbnb → DemoAirbnb (full demo with voice)
   ═══════════════════════════════════════════════════════ */

type DemoView = 'selection' | 'particulier' | 'airbnb';

export default function DemoPage() {
  const [view, setView] = useState<DemoView>('selection');

  const handleBackToSelection = useCallback(() => {
    setView('selection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (view === 'particulier') {
    return <DemoParticulier onBack={handleBackToSelection} />;
  }

  if (view === 'airbnb') {
    return <DemoAirbnb onBack={handleBackToSelection} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-amber-50/50 text-slate-800">
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
              <Diamond className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-serif text-gradient-gold text-lg tracking-wide">
              Maison Consciente
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <Link
              href="/connexion"
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors duration-200"
            >
              Connexion
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ DEMO SELECTION (with top padding for fixed navbar) ═══ */}
      <div className="pt-16">
        <DemoSelection
          onSelectParticulier={() => {
            setView('particulier');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectAirbnb={() => {
            setView('airbnb');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
}
