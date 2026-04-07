/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Core Types
   ═══════════════════════════════════════════════════════ */

// ─── Roles ───
export type UserRole = "member" | "owner" | "superadmin";

// ─── Household ───
export type HouseholdType = "home" | "hospitality";

export interface HouseholdSettings {
  lang?: string;
  accent?: AccentColorName;
  quietHours?: [number, number];
  inviteCode?: string;
  [key: string]: unknown;
}

// ─── Accent Colors ───
export type AccentColorName = "gold" | "silver" | "copper" | "emerald";

export interface AccentTheme {
  id: AccentColorName;
  label: string;
  emoji: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
}

// ─── User Preferences ───
export interface UserPreferences {
  haptic?: boolean;
  theme?: "dark" | "light" | "system";
  [key: string]: unknown;
}

// ─── Auth Payload ───
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  householdId: string | null;
  name: string;
  avatar: string | null;
}

// ─── Zone Config ───
export interface ZoneConfig {
  activeHours?: [number, number];
  mood?: string;
  suggestions?: string[];
  [key: string]: unknown;
}

// ─── Interaction ───
export interface InteractionContext {
  hour: number;
  weekday: string;
  weather?: WeatherInfo;
  recentScans?: number;
  [key: string]: unknown;
}

export interface InteractionResponse {
  suggestion?: string;
  suggestionIcon?: string;
  recipe?: RecipeSummary;
  soundscape?: SoundscapeSummary;
  weather?: WeatherInfo;
  greeting?: string;
}

// ─── Weather ───
export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

// ─── Recipe ───
export interface RecipeSummary {
  id: string;
  title: string;
  description: string;
  prepTimeMin: number;
  tags: string[];
  imageUrl?: string;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: string[];
  steps: string[];
  householdId: string | null;
}

// ─── Soundscape ───
export interface SoundscapeSummary {
  id: string;
  title: string;
  category: string;
  sourceType: string;
  url: string;
}

// ─── Household State ───
export interface HouseholdState {
  presenceActive: boolean;
  activeZones: string[];
  lastScanAt: Date | null;
  currentHour: number;
  weekday: string;
  season: "spring" | "summer" | "autumn" | "winter";
}

// ─── API ───
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
