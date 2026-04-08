/* ═══════════════════════════════════════════════════════════════
   LUMIÈRE & CHALEUR — Maellis Design System
   Couleurs qui inspirent la confiance, le confort et l'innovation
   ═══════════════════════════════════════════════════════════════ */

export const THEME = {
  // Couleurs principales
  primary: {
    light: '#FFD700',   // Or doux
    DEFAULT: '#FFA500', // Orange vif
    dark: '#FF8C00',    // Orange foncé
  },
  secondary: {
    light: '#87CEEB',   // Bleu ciel
    DEFAULT: '#4682B4', // Bleu acier
    dark: '#1E3A8A',    // Bleu nuit
  },

  // Arrière-plans
  background: {
    light: '#F8FAFC',   // Gris très clair
    DEFAULT: '#FFFFFF',  // Blanc pur
    dark: '#1E293B',    // Gris foncé élégant
  },

  // Surfaces (cartes, panneaux)
  surface: {
    light: '#FFFFFF',
    DEFAULT: '#F1F5F9',
    dark: '#334155',
  },

  // Texte
  text: {
    primary: '#1E293B',
    secondary: '#64748B',
    muted: '#94A3B8',
  },

  // États
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/* Tailwind-friendly gradient classes for each mode */
export const GRADIENTS = {
  particulier: {
    primary: 'from-blue-500 to-purple-600',
    primaryHover: 'from-blue-600 to-purple-700',
    subtle: 'from-blue-50 to-purple-50',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    accent: 'blue',
  },
  airbnb: {
    primary: 'from-amber-500 to-orange-600',
    primaryHover: 'from-amber-600 to-orange-700',
    subtle: 'from-amber-50 to-orange-50',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    accent: 'amber',
  },
} as const;
