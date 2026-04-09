'use client';

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { getTemplate, type TemplateConfig } from '@/lib/templates-config';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Template Provider

   Injects CSS variables from the selected template onto
   the document root. Persists selection to localStorage
   and syncs with the server.
   ═══════════════════════════════════════════════════════ */

const STORAGE_KEY = 'maellis-template';

interface TemplateContextValue {
  template: TemplateConfig;
  setTemplate: (slug: string) => void;
  isTransitioning: boolean;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function useTemplate() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplate must be used within <TemplateProvider>');
  return ctx;
}

interface TemplateProviderProps {
  children: ReactNode;
  initialSlug?: string;
}

export function TemplateProvider({ children, initialSlug }: TemplateProviderProps) {
  const [currentSlug, setCurrentSlug] = useState<string>(initialSlug || 'nexus-modern');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TEMPLATES_BY_SLUG[stored]) {
      setCurrentSlug(stored);
    }
  }, []);

  const template = getTemplate(currentSlug);

  // Inject CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-template', template.slug);
    root.style.setProperty('font-family', template.fontFamily);

    // Enable transition for color changes
    root.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');

    // Inject all CSS variables
    Object.entries(template.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Set dark/light class based on template
    const isDark = template.slug === 'nexus-modern' || template.slug === 'luxury-gold' || template.slug === 'noel-festif' || template.slug === 'halloween-spooky';
    root.classList.toggle('dark', isDark);

    // Cleanup transition after animation
    const timer = setTimeout(() => {
      root.style.removeProperty('transition');
    }, 500);
    return () => clearTimeout(timer);
  }, [template]);

  const setTemplate = useCallback((slug: string) => {
    if (!TEMPLATES_BY_SLUG[slug]) return;

    setIsTransitioning(true);
    setCurrentSlug(slug);
    localStorage.setItem(STORAGE_KEY, slug);

    // Persist to server (fire-and-forget)
    fetch('/api/household/template', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateSlug: slug }),
    }).catch(() => {});

    setTimeout(() => setIsTransitioning(false), 500);
  }, []);

  return (
    <TemplateContext.Provider value={{ template, setTemplate, isTransitioning }}>
      {children}
    </TemplateContext.Provider>
  );
}

// Quick lookup for validation
const TEMPLATES_BY_SLUG: Record<string, boolean> = {
  'nexus-modern': true,
  'luxury-gold': true,
  'family-warmth': true,
  'airbnb-pro': true,
  'noel-festif': true,
  'halloween-spooky': true,
};
