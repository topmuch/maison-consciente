/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Zod Validation Schemas
   ═══════════════════════════════════════════════════════ */

import { z } from "zod";

// ─── Auth ───
export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2, "Minimum 2 caractères").max(50),
  password: z.string().min(8, "Minimum 8 caractères").max(100),
  householdName: z.string().min(1).max(100).optional(),
  householdType: z.enum(["home", "hospitality"]).optional().default("home"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// ─── Zone ───
export const createZoneSchema = z.object({
  name: z.string().min(1, "Nom requis").max(50),
  icon: z.string().max(20).optional().default("home"),
  color: z.string().max(7).optional().default("#d4a853"),
  config: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updateZoneSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().max(20).optional(),
  color: z.string().max(7).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ─── Message ───
export const createMessageSchema = z.object({
  content: z.string().min(1, "Message requis").max(2000),
  type: z.enum(["note", "alert", "reminder"]).optional().default("note"),
});

// ─── Household ───
export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["home", "hospitality"]).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(1, "Code requis").max(20),
});

// ─── Recipe ───
export const createRecipeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  prepTimeMin: z.number().int().min(0).optional().default(0),
  tags: z.array(z.string().max(30)).optional().default([]),
  ingredients: z.array(z.string()).optional().default([]),
  steps: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional().nullable(),
});

// ─── Soundscape ───
export const createSoundscapeSchema = z.object({
  title: z.string().min(1).max(100),
  category: z.enum(["nature", "instrumental", "urban"]).optional().default("nature"),
  sourceType: z.enum(["local", "youtube"]).optional().default("local"),
  url: z.string().min(1),
});

// ─── Scan ───
export const scanSchema = z.object({
  slug: z.string().min(1, "Slug QR requis"),
});

// ─── User preferences ───
export const updatePreferencesSchema = z.object({
  haptic: z.boolean().optional(),
  theme: z.enum(["dark", "light", "system"]).optional(),
});

// ─── Household settings ───
export const updateSettingsSchema = z.object({
  lang: z.string().length(2).optional(),
  accent: z.enum(["gold", "silver", "copper", "emerald"]).optional(),
  quietHours: z.tuple([z.number().min(0).max(23), z.number().min(0).max(23)]).optional(),
});

// ─── Hospitality: Guest Access ───
export const createGuestAccessSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  expiresAt: z.string().datetime().transform(s => new Date(s)),
});

export const updateGuestAccessSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  expiresAt: z.string().datetime().transform(s => new Date(s)).optional(),
  isActive: z.boolean().optional(),
});

// ─── Hospitality: Point of Interest ───
export const createPOISchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  category: z.enum(["coffee", "restaurant", "pharmacy", "activity"]),
  distanceMin: z.number().int().min(0).max(999),
  description: z.string().max(500).optional().default(""),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: z.string().url().optional().nullable(),
  address: z.string().max(200).optional().default(""),
});

export const updatePOISchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(["coffee", "restaurant", "pharmacy", "activity"]).optional(),
  distanceMin: z.number().int().min(0).max(999).optional(),
  description: z.string().max(500).optional(),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: z.string().url().optional().nullable(),
  address: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
});

// ─── Household Settings V2: Identity / SEO / Preferences ───
export const householdIdentitySchema = z.object({
  contactPhone: z
    .string()
    .regex(/^[+]?[\d\s\-().]{7,20}$/, "Format téléphone invalide (ex: +33 1 23 45 67 89)")
    .optional()
    .or(z.literal("")),
  contactEmail: z
    .string()
    .email("Email de contact invalide")
    .optional()
    .or(z.literal("")),
  contactAddress: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(300, "Maximum 300 caractères")
    .optional()
    .or(z.literal("")),
});

export const householdSeoSchema = z.object({
  seoTitle: z
    .string()
    .min(5, "Minimum 5 caractères")
    .max(70, "Maximum 70 caractères pour SEO")
    .optional()
    .or(z.literal("")),
  seoDescription: z
    .string()
    .min(20, "Minimum 20 caractères")
    .max(160, "Maximum 160 caractères pour SEO")
    .optional()
    .or(z.literal("")),
  seoKeywords: z
    .array(z.string().max(40))
    .max(15, "Maximum 15 mots-clés")
    .optional()
    .default([]),
  seoOgImage: z
    .string()
    .url("URL de l'image invalide")
    .optional()
    .or(z.literal("")),
});

export const householdPreferencesSchema = z.object({
  timezone: z
    .string()
    .regex(
      /^[A-Za-z_]+\/[A-Za-z_]+$/,
      "Fuseau invalide (ex: Europe/Paris)"
    )
    .optional(),
  isQuietMode: z.boolean().optional(),
});

// ─── Voice Settings ───
export const voiceSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  rate: z.number().min(0.5).max(2).optional(),
  volume: z.number().min(0).max(1).optional(),
  language: z.string().optional(),
  conversationWindow: z.number().int().min(1).max(60).optional(),
  assistantName: z.string().min(1).max(50).optional(),
  wakeWordEnabled: z.boolean().optional(),
});

/** Combined schema for PATCH /api/household/settings */
export const updateHouseholdSettingsSchema = householdIdentitySchema
  .merge(householdSeoSchema)
  .merge(householdPreferencesSchema)
  .extend({ voiceSettings: voiceSettingsSchema.optional() })
  .partial();

// ─── Billing: Checkout ───
export const checkoutSchema = z.object({
  plan: z.enum(["comfort", "prestige", "starter", "pro"]),
});

// ─── DeepL Translation ───
export const translateRecipeSchema = z.object({
  recipeId: z.string().uuid("ID de recette invalide"),
  targetLang: z.string().length(2, "Code langue invalide (ex: en, es, de)"),
});
