/**
 * Maellis — Modules & Packs Configuration
 *
 * Central source of truth for all paid modules and bundles.
 * Prices are in EUR/month. Stripe Price IDs should be mapped
 * via the superadmin panel (SystemConfig table).
 *
 * Architecture: All API keys (SMTP, Sentry, Retell, Gemini)
 * are managed through the superadmin panel — NEVER in .env files.
 */

/* ── Types ── */

export interface ModuleFeature {
  icon: string;       // lucide icon name
  text: string;
  included: boolean;
}

export interface MaellisModule {
  id: string;
  name: string;
  description: string;
  price: number;           // EUR/month
  priceYearly: number;     // EUR/year (discounted)
  features: ModuleFeature[];
  popular?: boolean;
  badge?: string;          // e.g. "Best Value", "Recommandé"
  accentColor: string;     // Tailwind classes for the icon bg
  borderClass?: string;    // Tailwind classes for the card border
  stripeProductId?: string;  // To be set via superadmin → Stripe
}

export interface MaellisPack {
  id: string;
  name: string;
  description: string;
  price: number;
  priceYearly: number;
  includedModules: string[];  // module IDs
  features: ModuleFeature[];
  badge: string;
  accentGradient: string;     // CSS gradient for premium badge
  popular: boolean;
  stripeProductId?: string;
}

/* ── Individual Modules ── */

export const modules: MaellisModule[] = [
  {
    id: 'safe_departure',
    name: 'Safe Departure & Security',
    description: 'Check-out intelligent + sauvetage de réputation',
    price: 6.9,
    priceYearly: 69,
    accentColor: 'bg-emerald-600/20',
    features: [
      { icon: 'PhoneCall', text: "Appel vocal Retell AI le jour du départ", included: true },
      { icon: 'Brain', text: "Détection d'insatisfaction en temps réel", included: true },
      { icon: 'AlertTriangle', text: "Alerte immédiate à l'hôte (Retell call / Push)", included: true },
      { icon: 'ClipboardCheck', text: "Rapport IA StayReview avec notes par catégorie", included: true },
      { icon: 'Star', text: "Génération automatique d'avis public positif", included: true },
      { icon: 'TrendingUp', text: 'Score de sentiment -1.0 à +1.0 (Gemini)', included: true },
      { icon: 'Globe', text: 'Webhook Retell → Analyse async non-bloquante', included: true },
    ],
  },
  {
    id: 'daily_concierge',
    name: 'Daily Concierge & Care',
    description: 'Audit quotidien à 22h + résolution proactive',
    price: 9.9,
    priceYearly: 99,
    popular: true,
    badge: 'Recommandé',
    accentColor: 'bg-amber-500/20',
    features: [
      { icon: 'Clock', text: 'Audit quotidien automatique à 22h', included: true },
      { icon: 'PhoneCall', text: 'Appel vocal respectueux (demande permission)', included: true },
      { icon: 'RefreshCw', text: 'Gestion du silence → relance dans 1h si pas de réponse', included: true },
      { icon: 'Brain', text: 'Analyse sentiment Gemini 2.0 Flash-Lite', included: true },
      { icon: 'AlertTriangle', text: 'Alerte hôte instantanée si score < 4/5', included: true },
      { icon: 'ClipboardCheck', text: 'Rapport StayReview complet en fin de séjour', included: true },
      { icon: 'BarChart3', text: 'Dashboard analytics avec radar 6 axes', included: true },
      { icon: 'MessageSquare', text: "Questions adaptatives (Arrivée / Quotidien / Départ)", included: true },
    ],
  },
  {
    id: 'auto_upsell',
    name: 'Auto Upsell Intelligent',
    description: "L'IA présente activement vos services payants",
    price: 4.9,
    priceYearly: 49,
    accentColor: 'bg-purple-500/20',
    features: [
      { icon: 'Mic', text: 'Voix IA qui présente les services 2h après check-in', included: true },
      { icon: 'Sparkles', text: "Mise en surbrillance de l'onglet Services", included: true },
      { icon: 'Globe', text: 'Adaptation automatique à la langue du voyageur', included: true },
      { icon: 'MessageSquare', text: 'Personnalisation selon le profil du voyageur', included: true },
    ],
  },
  {
    id: 'smart_late_checkout',
    name: 'Smart Late Checkout Seller',
    description: 'Vente automatique des heures libres',
    price: 4.9,
    priceYearly: 49,
    accentColor: 'bg-rose-500/20',
    features: [
      { icon: 'Clock', text: 'Proposition Late Checkout le jour du départ (09h)', included: true },
      { icon: 'Calendar', text: 'Vérification automatique de la disponibilité', included: true },
      { icon: 'CreditCard', text: 'Paiement intégré via Stripe', included: true },
      { icon: 'MessageSquare', text: 'Confirmation vocale + modale interactive', included: true },
    ],
  },
  {
    id: 'guest_memory',
    name: 'Guest Memory',
    description: 'Mémoire des préférences voyageurs',
    price: 3.9,
    priceYearly: 39,
    accentColor: 'bg-sky-500/20',
    features: [
      { icon: 'Brain', text: "Mémorisation des préférences (température, oreiller, etc.)", included: true },
      { icon: 'Users', text: 'Reconnaissance automatique des voyageurs récurrents', included: true },
      { icon: 'Heart', text: 'Message de bienvenue personnalisé', included: true },
      { icon: 'BarChart3', text: 'Profil voyageur enrichi au fil des séjours', included: true },
    ],
  },
  {
    id: 'auto_language',
    name: 'Auto Language Adapt',
    description: 'Polyglotte automatique',
    price: 2.9,
    priceYearly: 29,
    accentColor: 'bg-teal-500/20',
    features: [
      { icon: 'Globe', text: 'Détection automatique de la langue (nom, pays)', included: true },
      { icon: 'MessageSquare', text: 'Traduction instantanée du guide du logement', included: true },
      { icon: 'Mic', text: 'Voix IA multilingue (FR, EN, ES, DE, IT, PT, NL)', included: true },
      { icon: 'Sparkles', text: 'Adaptation culturelle des recommandations', included: true },
    ],
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    description: 'Tableaux de bord complets',
    price: 4.9,
    priceYearly: 49,
    accentColor: 'bg-orange-500/20',
    features: [
      { icon: 'BarChart3', text: 'KPIs en temps réel (satisfaction, fréquence)', included: true },
      { icon: 'TrendingUp', text: 'Radar 6 axes (propreté, confort, équipements...)', included: true },
      { icon: 'ClipboardCheck', text: 'Rapports hebdomadaires automatisés', included: true },
      { icon: 'Star', text: 'Benchmark vs moyenne Airbnb', included: true },
    ],
  },
  {
    id: 'smart_shop',
    name: 'Smart Shop',
    description: 'Scan de courses + suivi budget en temps reel',
    price: 4.9,
    priceYearly: 49,
    popular: true,
    badge: 'Nouveau',
    accentColor: 'bg-emerald-500/20',
    features: [
      { icon: 'ScanBarcode', text: 'Scan code-barres avec prix auto (OpenFoodFacts)', included: true },
      { icon: 'Wallet', text: 'Suivi budget en temps reel avec alertes', included: true },
      { icon: 'BarChart3', text: 'Dashboard statistiques courses', included: true },
      { icon: 'Lightbulb', text: 'Suggestions alternatives moins cheres', included: true },
      { icon: 'Download', text: 'Export CSV/TXT des sessions', included: true },
      { icon: 'Smartphone', text: 'Mode hors-ligne (IndexedDB)', included: true },
      { icon: 'Vibrate', text: 'Alertes haptiques budget', included: true },
    ],
  },
];

/* ── Bundles / Packs ── */

export const packs: MaellisPack[] = [
  {
    id: 'global_host_pro',
    name: 'Pack Maellis Global Host Pro',
    description:
      "La solution ultime pour hôtes professionnels. Sécurité, Revenus Passifs et Expérience Client 5 étoiles.",
    price: 29.9,
    priceYearly: 299,
    includedModules: [
      'safe_departure',
      'daily_concierge',
      'auto_upsell',
      'smart_late_checkout',
      'guest_memory',
      'auto_language',
      'analytics_reports',
    ],
    badge: 'Best Value',
    accentGradient: 'linear-gradient(135deg, #d4af37 0%, #7c3aed 50%, #d4af37 100%)',
    popular: true,
    features: [
      { icon: 'ShieldCheck', text: 'Safe Departure & Security (Sauvetage avis)', included: true },
      { icon: 'ClipboardCheck', text: 'Daily Concierge (Audit quotidien 22h)', included: true },
      { icon: 'Brain', text: 'Guest Memory (Mémoire préférences)', included: true },
      { icon: 'Sparkles', text: 'Auto Upsell Intelligent (Présentation services)', included: true },
      { icon: 'Clock', text: 'Smart Late Checkout Seller (Vente heures libres)', included: true },
      { icon: 'Globe', text: 'Auto Language Adapt (Polyglotte automatique)', included: true },
      { icon: 'BarChart3', text: 'Analytics & Reports complets', included: true },
    ],
  },
];

/* ── Helpers ── */

/** Get a module by its ID */
export function getModuleById(id: string): MaellisModule | undefined {
  return modules.find((m) => m.id === id);
}

/** Get a pack by its ID */
export function getPackById(id: string): MaellisPack | undefined {
  return packs.find((p) => p.id === id);
}

/** Calculate total price of individual modules in a pack */
export function getPackSavings(pack: MaellisPack): number {
  const total = pack.includedModules.reduce((sum, modId) => {
    const mod = getModuleById(modId);
    return sum + (mod?.price ?? 0);
  }, 0);
  return Math.round((total - pack.price) * 100) / 100;
}

/** Monthly bundle for Safe Departure + Daily Concierge only */
export const hospitalityBundle = {
  id: 'hospitality_bundle',
  name: 'Bundle Hospitality',
  includedModules: ['safe_departure', 'daily_concierge'] as const,
  price: 14.9,
  individualTotal: 16.8,
  savings: 1.9,
};
