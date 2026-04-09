'use client';

/* ═══════════════════════════════════════════════════════
   MAELLIS — ThemeProvider
   
   Injects CSS variables from the selected template onto
   document.documentElement. Persists selection in localStorage.
   Provides smooth color transitions on template change.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, createContext, useContext, useState, type ReactNode } from 'react';
import { getTemplate, type TemplateConfig } from '@/lib/templates-config';

const STORAGE_KEY = 'maellis-template';
const TRANSITION_DURATION = 300; // ms

interface ThemeContextValue {
  templateSlug: string;
  template: TemplateConfig;
  setTemplateSlug: (slug: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  templateSlug: 'nexus-modern',
  template: getTemplate('nexus-modern'),
  setTemplateSlug: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  templateSlug: string;
  children: ReactNode;
}

export function ThemeProvider({ templateSlug: initialSlug, children }: ThemeProviderProps) {
  const [templateSlug, setTemplateSlugState] = useState(initialSlug);
  const isTransitioning = useRef(false);

  const template = getTemplate(templateSlug);

  /* ── Apply CSS variables ── */
  const applyTemplate = useCallback((slug: string) => {
    const tpl = getTemplate(slug);
    const root = document.documentElement;

    // Enable smooth transition
    if (!isTransitioning.current) {
      isTransitioning.current = true;
      root.style.setProperty('--template-transition', `background-color ${TRANSITION_DURATION}ms ease, color ${TRANSITION_DURATION}ms ease, border-color ${TRANSITION_DURATION}ms ease`);
    }

    // Inject CSS custom properties
    Object.entries(tpl.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Set font family
    root.style.setProperty('font-family', tpl.fontFamily);

    // Set data attribute for CSS selectors
    root.setAttribute('data-template', slug);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // Storage full or unavailable
    }

    // Remove transition after animation completes
    setTimeout(() => {
      root.style.removeProperty('--template-transition');
      isTransitioning.current = false;
    }, TRANSITION_DURATION + 50);
  }, []);

  /* ── On mount / slug change ── */
  useEffect(() => {
    applyTemplate(templateSlug);
  }, [templateSlug, applyTemplate]);

  /* ── Set template slug ── */
  const setTemplateSlug = useCallback((slug: string) => {
    setTemplateSlugState(slug);
  }, []);

  return (
    <ThemeContext.Provider value={{ templateSlug, template, setTemplateSlug }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Read the persisted template slug from localStorage (client-side only).
 */
export function getStoredTemplateSlug(): string {
  if (typeof window === 'undefined') return 'nexus-modern';
  try {
    return localStorage.getItem(STORAGE_KEY) || 'nexus-modern';
  } catch {
    return 'nexus-modern';
  }
}
