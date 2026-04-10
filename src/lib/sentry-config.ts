/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Sentry Configuration Wrapper

   Conditionally initializes Sentry only when SENTRY_DSN is set
   and the environment is production. Falls back to console.error
   in all other cases.

   Usage:
     import { reportError, reportMessage } from "@/lib/sentry-config";
     reportError(err, { userId: "..." });
     reportMessage("Deployment complete", { version: "1.2.0" });
   ═══════════════════════════════════════════════════════ */

/* ── Lazy-loaded Sentry references ────────────────────────── */

let captureException: ((error: unknown, context?: Record<string, unknown>) => void) | null = null;
let captureMessage: ((message: string, context?: Record<string, unknown>) => void) | null = null;

let _initialized = false;

/* ── Initialize Sentry (call once at app startup) ─────────── */

export async function initSentry(): Promise<void> {
  if (_initialized) return;

  const dsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === "production";

  if (!dsn || !isProduction) {
    console.info("[SENTRY] Disabled — DSN not set or not in production");
    return;
  }

  try {
    // Dynamic import — only loads Sentry SDK when actually needed
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || "production",
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
      // Only send errors in production
      enabled: isProduction,
    });

    captureException = (error: unknown, context?: Record<string, unknown>) => {
      Sentry.captureException(error, {
        extra: context,
        tags: { source: "server" },
      } as Parameters<typeof Sentry.captureException>[1]);
    };

    captureMessage = (message: string, context?: Record<string, unknown>) => {
      Sentry.captureMessage(message, {
        extra: context,
        tags: { source: "server" },
      } as Parameters<typeof Sentry.captureMessage>[1]);
    };

    _initialized = true;
    console.info("[SENTRY] Initialized successfully");
  } catch (error) {
    console.warn("[SENTRY] Failed to initialize:", error);
    _initialized = true; // Don't retry
  }
}

/* ── Public API ───────────────────────────────────────────── */

/**
 * Report an error to Sentry (if enabled) or console.error as fallback.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  // Always console.error as fallback
  console.error("[ERROR]", error, context ? `\nContext: ${JSON.stringify(context)}` : "");

  if (captureException) {
    captureException(error, context);
  }
}

/**
 * Report a message to Sentry (if enabled) or console.warn as fallback.
 */
export function reportMessage(message: string, context?: Record<string, unknown>): void {
  if (captureMessage) {
    captureMessage(message, context);
  } else {
    console.warn("[SENTRY]", message, context ? `\nContext: ${JSON.stringify(context)}` : "");
  }
}

/**
 * Check whether Sentry is actively capturing errors.
 */
export function isSentryEnabled(): boolean {
  return captureException !== null && captureMessage !== null;
}

/**
 * Export the DSN for reference (does not expose the value).
 */
export function getSentryDsn(): string | undefined {
  return process.env.SENTRY_DSN;
}
