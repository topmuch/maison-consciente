'use client';

import { useState, useCallback } from 'react';
import { DemoSelection } from '@/components/demo/DemoSelection';
import { DemoParticulier } from '@/components/demo/DemoParticulier';
import { DemoAirbnb } from '@/components/demo/DemoAirbnb';
import { SiteNavbar } from '@/components/layout/SiteNavbar';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Demo Page Router

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Subtle amber gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-background to-orange-50/40 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10" />
      </div>

      {/* Navbar */}
      <div className="relative z-10">
        <SiteNavbar activePage="/demo" />
      </div>

      {/* Demo Selection content */}
      <main className="relative z-10 flex-1">
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
      </main>
    </div>
  );
}
