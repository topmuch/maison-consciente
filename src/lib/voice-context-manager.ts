/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Voice Context Manager
   
   Manages short-term conversational memory for the voice
   assistant. Tracks which activity was last discussed so
   follow-up questions ("c'est cher ?", "horaires", etc.)
   work without repeating the activity name.
   
   Uses an in-memory Map with 60-second TTL expiry.
   ═══════════════════════════════════════════════════════ */

/* ═══ TYPES ═══ */

export interface VoiceContext {
  householdId: string;
  lastActivityId: string | null;
  lastActivityTitle: string | null;
  lastActivityCategory: string | null;
  lastActivityPrice: string | null;
  lastActivityHours: string | null;
  lastActivityDistance: string | null;
  lastActivityAddress: string | null;
  lastActivityWhatsapp: string | null;
  lastActivityLink: string | null;
  lastActivityDescription: string | null;
  lastActivityIsPartner: boolean;
  setAt: number; // Date.now() timestamp
}

/* ═══ CONFIG ═══ */

// Context expires after 60 seconds of inactivity
const CONTEXT_TTL_MS = 60_000;

// In-memory store keyed by householdId
const contextStore = new Map<string, VoiceContext>();

/* ═══ FUNCTIONS ═══ */

/**
 * Set the last discussed activity in context.
 * Call this after listing activities or when user asks about a specific one.
 */
export function setActivityContext(
  householdId: string,
  activity: {
    id: string;
    title: string;
    category: string;
    priceHint?: string | null;
    hoursHint?: string | null;
    distance?: string | null;
    address?: string | null;
    whatsappNumber?: string | null;
    link?: string | null;
    description?: string | null;
    isPartner?: boolean;
  },
): void {
  const context: VoiceContext = {
    householdId,
    lastActivityId: activity.id,
    lastActivityTitle: activity.title,
    lastActivityCategory: activity.category,
    lastActivityPrice: activity.priceHint ?? null,
    lastActivityHours: activity.hoursHint ?? null,
    lastActivityDistance: activity.distance ?? null,
    lastActivityAddress: activity.address ?? null,
    lastActivityWhatsapp: activity.whatsappNumber ?? null,
    lastActivityLink: activity.link ?? null,
    lastActivityDescription: activity.description ?? null,
    lastActivityIsPartner: activity.isPartner ?? false,
    setAt: Date.now(),
  };

  contextStore.set(householdId, context);
}

/**
 * Get the current voice context for a household.
 * Returns null if context has expired (>60s) or doesn't exist.
 */
export function getVoiceContext(householdId: string): VoiceContext | null {
  const context = contextStore.get(householdId);

  if (!context) {
    return null;
  }

  // Check TTL
  if (Date.now() - context.setAt > CONTEXT_TTL_MS) {
    contextStore.delete(householdId);
    return null;
  }

  return context;
}

/**
 * Clear the voice context (e.g., on topic change).
 */
export function clearVoiceContext(householdId: string): void {
  contextStore.delete(householdId);
}

/**
 * Check if context is active and has an activity.
 */
export function hasActiveActivityContext(householdId: string): boolean {
  const context = getVoiceContext(householdId);
  return context !== null && context.lastActivityId !== null;
}

/**
 * Clean up expired contexts (call periodically).
 */
export function cleanupExpiredContexts(): void {
  const now = Date.now();

  for (const [key, context] of contextStore.entries()) {
    if (now - context.setAt > CONTEXT_TTL_MS) {
      contextStore.delete(key);
    }
  }
}
