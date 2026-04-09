'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import dynamic from 'next/dynamic';

/* ── Dynamic components ── */
const DemoSelection = dynamic(() => import('@/components/demo/DemoSelection'), { ssr: false });
const DemoParticulier = dynamic(() => import('@/components/demo/DemoParticulier'), { ssr: false });
const DemoAirbnb = dynamic(() => import('@/components/demo/DemoAirbnb'), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   MAELLIS — LUXE LUMINEUX DEFAULT
   The default experience immediately shows the Wahoo effect
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const [demoView, setDemoView] = useState<'select' | 'particulier' | 'airbnb'>('select');

  // Demo Selection — Wahoo immediate effect
  if (demoView === 'select') {
    return (
      <DemoSelection
        onSelectParticulier={() => setDemoView('particulier')}
        onSelectAirbnb={() => setDemoView('airbnb')}
      />
    );
  }

  if (demoView === 'particulier') {
    return <DemoParticulier onBack={() => setDemoView('select')} />;
  }

  if (demoView === 'airbnb') {
    return <DemoAirbnb onBack={() => setDemoView('select')} />;
  }

  return null;
}
