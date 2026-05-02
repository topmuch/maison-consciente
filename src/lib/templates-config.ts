/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Templates Configuration

   6 visual identity templates including 2 seasonal ones.
   Each template defines CSS variables, layout mode, and font.
   ═══════════════════════════════════════════════════════ */

export interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  preview: string; // emoji for visual selector
  gradient: string; // CSS gradient for card preview
  cssVariables: Record<string, string>;
  layoutMode: "sidebar" | "top-nav" | "bottom-nav";
  fontFamily: string;
  seasonal?: { startMonth: number; endMonth: number } | null;
  tags: string[];
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  "nexus-modern": {
    slug: "nexus-modern",
    name: "Nexus Modern",
    description: "Épuré et technologique — design minimaliste noir & or",
    preview: "🌐",
    gradient: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    cssVariables: {
      "--bg-primary": "#020617",
      "--bg-secondary": "#0f172a",
      "--bg-card": "#1e293b",
      "--text-primary": "#f8fafc",
      "--text-secondary": "#94a3b8",
      "--accent": "#d4a853",
      "--accent-light": "#f0d68a",
      "--accent-dark": "#b8923f",
      "--border": "rgba(212, 168, 83, 0.15)",
      "--glow": "rgba(212, 168, 83, 0.3)",
    },
    layoutMode: "sidebar",
    fontFamily: "'Inter', sans-serif",
    seasonal: null,
    tags: ["défaut", "moderne", "sombre"],
  },
  "luxury-gold": {
    slug: "luxury-gold",
    name: "Luxury Gold",
    description: "Opulent et raffiné — dorures intenses et contrastes",
    preview: "✨",
    gradient: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
    cssVariables: {
      "--bg-primary": "#0a0a0f",
      "--bg-secondary": "#1a1a2e",
      "--bg-card": "#16213e",
      "--text-primary": "#faf5e4",
      "--text-secondary": "#c4a35a",
      "--accent": "#d4a853",
      "--accent-light": "#f0d68a",
      "--accent-dark": "#b8923f",
      "--border": "rgba(212, 168, 83, 0.2)",
      "--glow": "rgba(212, 168, 83, 0.4)",
    },
    layoutMode: "sidebar",
    fontFamily: "'Playfair Display', serif",
    seasonal: null,
    tags: ["luxe", "premium", "doré"],
  },
  "family-warmth": {
    slug: "family-warmth",
    name: "Chaleur Familiale",
    description: "Accueillant et doux — tons chaleureux pour le foyer",
    preview: "🏠",
    gradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
    cssVariables: {
      "--bg-primary": "#fefce8",
      "--bg-secondary": "#fef9c3",
      "--bg-card": "#ffffff",
      "--text-primary": "#1c1917",
      "--text-secondary": "#57534e",
      "--accent": "#f59e0b",
      "--accent-light": "#fcd34d",
      "--accent-dark": "#d97706",
      "--border": "rgba(245, 158, 11, 0.2)",
      "--glow": "rgba(245, 158, 11, 0.3)",
    },
    layoutMode: "bottom-nav",
    fontFamily: "'Inter', sans-serif",
    seasonal: null,
    tags: ["famille", "lumineux", "doux"],
  },
  "airbnb-pro": {
    slug: "airbnb-pro",
    name: "Airbnb Pro",
    description: "Professionnel et moderne — optimisé pour l'hospitalité",
    preview: "🏨",
    gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
    cssVariables: {
      "--bg-primary": "#ffffff",
      "--bg-secondary": "#f5f5f5",
      "--bg-card": "#ffffff",
      "--text-primary": "#222222",
      "--text-secondary": "#717171",
      "--accent": "#ff385c",
      "--accent-light": "#ff6b81",
      "--accent-dark": "#e01e3c",
      "--border": "rgba(0, 0, 0, 0.08)",
      "--glow": "rgba(255, 56, 92, 0.3)",
    },
    layoutMode: "top-nav",
    fontFamily: "'Inter', sans-serif",
    seasonal: null,
    tags: ["hospitalité", "propre", "airbnb"],
  },
  "noel-festif": {
    slug: "noel-festif",
    name: "Noël Festif",
    description: "Magie de Noël — rouge, vert argenté et neige",
    preview: "🎄",
    gradient: "linear-gradient(135deg, #0c1821 0%, #1b2838 50%, #0c1821 100%)",
    cssVariables: {
      "--bg-primary": "#0c1821",
      "--bg-secondary": "#1b2838",
      "--bg-card": "#1a2530",
      "--text-primary": "#fff5f5",
      "--text-secondary": "#94a3b8",
      "--accent": "#dc2626",
      "--accent-light": "#f87171",
      "--accent-dark": "#991b1b",
      "--accent-secondary": "#16a34a",
      "--border": "rgba(220, 38, 38, 0.2)",
      "--glow": "rgba(220, 38, 38, 0.4)",
    },
    layoutMode: "sidebar",
    fontFamily: "'Playfair Display', serif",
    seasonal: { startMonth: 11, endMonth: 1 },
    tags: ["noël", "fêtes", "saisonnier"],
  },
  "halloween-spooky": {
    slug: "halloween-spooky",
    name: "Halloween",
    description: "Frissons et magie — orange, violet et ombres",
    preview: "🎃",
    gradient: "linear-gradient(135deg, #0f0a1a 0%, #1a1030 100%)",
    cssVariables: {
      "--bg-primary": "#0f0a1a",
      "--bg-secondary": "#1a1030",
      "--bg-card": "#251b3d",
      "--text-primary": "#fef3c7",
      "--text-secondary": "#a78bfa",
      "--accent": "#f97316",
      "--accent-light": "#fb923c",
      "--accent-dark": "#ea580c",
      "--accent-secondary": "#7c3aed",
      "--border": "rgba(249, 115, 22, 0.2)",
      "--glow": "rgba(249, 115, 22, 0.4)",
    },
    layoutMode: "sidebar",
    fontFamily: "'Inter', sans-serif",
    seasonal: { startMonth: 10, endMonth: 10 },
    tags: ["halloween", "saisonnier", "spécial"],
  },
};

/** Get a template by slug, fallback to nexus-modern */
export function getTemplate(slug: string): TemplateConfig {
  return TEMPLATES[slug] || TEMPLATES["nexus-modern"];
}

/** Get all templates as an array */
export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATES);
}

/** Get the seasonal template for a given month (1-12), or null */
export function getSeasonalTemplate(month: number): TemplateConfig | null {
  for (const template of Object.values(TEMPLATES)) {
    if (template.seasonal) {
      const { startMonth, endMonth } = template.seasonal;
      if (startMonth <= endMonth) {
        if (month >= startMonth && month <= endMonth) return template;
      } else {
        // Wraps around year (e.g., Nov-Jan)
        if (month >= startMonth || month <= endMonth) return template;
      }
    }
  }
  return null;
}

/** Get the non-seasonal templates only */
export function getBaseTemplates(): TemplateConfig[] {
  return getAllTemplates().filter((t) => !t.seasonal);
}

/** Get the seasonal templates only */
export function getSeasonalTemplates(): TemplateConfig[] {
  return getAllTemplates().filter((t) => !!t.seasonal);
}
