// ═══════════════════════════════════════════════════════
// Accent Color System — Maison Consciente
// Stores accent preferences and applies CSS variables
// ═══════════════════════════════════════════════════════

export type AccentColor = 'gold' | 'silver' | 'copper' | 'emerald';

export interface AccentTheme {
  id: AccentColor;
  label: string;
  emoji: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  glow: string;
  glowStrong: string;
  gradientStart: string;
  gradientEnd: string;
  secondary: string;
  tertiary: string;
}

export const ACCENT_THEMES: Record<AccentColor, AccentTheme> = {
  gold: {
    id: 'gold',
    label: 'Or',
    emoji: '✨',
    primary: '#d4a853',
    primaryLight: '#f0d78c',
    primaryDark: '#a17c2e',
    glow: 'oklch(0.78 0.14 85 / 15%)',
    glowStrong: 'oklch(0.78 0.14 85 / 25%)',
    gradientStart: '#d4a853',
    gradientEnd: '#f0d78c',
    secondary: '#c77d5a',
    tertiary: '#8b5cf6',
  },
  silver: {
    id: 'silver',
    label: 'Argent',
    emoji: '🪙',
    primary: '#c0c7d0',
    primaryLight: '#e2e8f0',
    primaryDark: '#8892a0',
    glow: 'oklch(0.78 0.01 260 / 15%)',
    glowStrong: 'oklch(0.78 0.01 260 / 25%)',
    gradientStart: '#c0c7d0',
    gradientEnd: '#e2e8f0',
    secondary: '#94a3b8',
    tertiary: '#a78bfa',
  },
  copper: {
    id: 'copper',
    label: 'Cuivre',
    emoji: '🔥',
    primary: '#c77d5a',
    primaryLight: '#e8a88c',
    primaryDark: '#9a5a3a',
    glow: 'oklch(0.65 0.18 20 / 15%)',
    glowStrong: 'oklch(0.65 0.18 20 / 25%)',
    gradientStart: '#c77d5a',
    gradientEnd: '#e8a88c',
    secondary: '#d4a853',
    tertiary: '#8b5cf6',
  },
  emerald: {
    id: 'emerald',
    label: 'Émeraude',
    emoji: '💚',
    primary: '#34d399',
    primaryLight: '#6ee7b7',
    primaryDark: '#059669',
    glow: 'oklch(0.70 0.15 160 / 15%)',
    glowStrong: 'oklch(0.70 0.15 160 / 25%)',
    gradientStart: '#34d399',
    gradientEnd: '#6ee7b7',
    secondary: '#d4a853',
    tertiary: '#8b5cf6',
  },
};

export function applyAccentTheme(theme: AccentTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  root.style.setProperty('--accent-primary', theme.primary);
  root.style.setProperty('--accent-primary-light', theme.primaryLight);
  root.style.setProperty('--accent-primary-dark', theme.primaryDark);
  root.style.setProperty('--accent-primary-glow', theme.glow);
  root.style.setProperty('--accent-primary-glow-strong', theme.glowStrong);
  root.style.setProperty('--accent-secondary', theme.secondary);
  root.style.setProperty('--accent-tertiary', theme.tertiary);
}

export function getAccentTheme(id: AccentColor): AccentTheme {
  return ACCENT_THEMES[id] || ACCENT_THEMES.gold;
}

export function persistAccentColor(id: AccentColor): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mc-accent-color', id);
  }
}

export function getPersistedAccentColor(): AccentColor {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('mc-accent-color');
    if (stored && ACCENT_THEMES[stored as AccentColor]) {
      return stored as AccentColor;
    }
  }
  return 'gold';
}
