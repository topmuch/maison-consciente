/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Stripe Configuration
   
   Billing is optional — if env vars are missing, 
   Stripe functions will gracefully degrade.
   ═══════════════════════════════════════════════════════ */

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!secretKey || !publishableKey) {
  console.warn(
    "[STRIPE] STRIPE_SECRET_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set. Billing features are disabled."
  );
}

export const stripe = secretKey
  ? new Stripe(secretKey, {
      apiVersion: "2025-04-30.basil",
      typescript: true,
    })
  : (null as unknown as Stripe);

/* ─── Publishable key for client ─── */
export const STRIPE_PUBLISHABLE_KEY = publishableKey || "";

/* ─── Price IDs (map plan key → Stripe Price ID) ─── */
export const PRICE_MAP: Record<string, string> = {
  comfort: process.env.STRIPE_PRICE_COMFORT || "price_comfort_placeholder",
  prestige: process.env.STRIPE_PRICE_PRESTIGE || "price_prestige_placeholder",
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter_placeholder",
  pro: process.env.STRIPE_PRICE_PRO || "price_pro_placeholder",
};

/* ─── Plan metadata ─── */
export const PLANS = {
  free: {
    name: "Libre",
    price: "Gratuit",
    interval: null,
    features: [
      "1 zone",
      "3 recettes",
      "Messagerie basique",
      "Scanner QR",
    ],
    limits: { zones: 1, recipes: 3, members: 2 },
  },
  comfort: {
    name: "Confort",
    price: "4,99€/mois",
    interval: "month" as const,
    features: [
      "Zones illimitées",
      "Audio complet",
      "Recettes illimitées",
      "Humeur & rituels",
    ],
    limits: { zones: -1, recipes: -1, members: 5 },
  },
  prestige: {
    name: "Prestige",
    price: "9,99€/mois",
    interval: "month" as const,
    popular: true,
    features: [
      "Tout Confort",
      "Analytics avancés",
      "Support prioritaire",
      "Accès bêta",
      "Export données",
    ],
    limits: { zones: -1, recipes: -1, members: -1 },
  },
  starter: {
    name: "Starter",
    price: "12€/mois",
    interval: "month" as const,
    features: [
      "Check-in digital",
      "Guide local",
      "Multi-langue",
      "5 chambres",
    ],
    limits: { zones: 5, rooms: 5, members: 10 },
  },
  pro: {
    name: "Pro",
    price: "29€/mois",
    interval: "month" as const,
    popular: true,
    features: [
      "Tout Starter",
      "Chambres illimitées",
      "Analytics",
      "API",
      "White-label",
    ],
    limits: { zones: -1, rooms: -1, members: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/* ─── Feature flag ─── */
export const isBillingEnabled = !!(secretKey && publishableKey);
