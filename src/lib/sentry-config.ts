/* ═══════════════════════════════════════════════════════════════
   MAISON CONSCIENTE — Sentry Configuration Wrapper

   Conditionally initializes Sentry only when SENTRY_DSN is set
   (from SystemConfig DB or .env) and environment is production.
   Falls back to console.error in all other cases.

   Configuration priority: DB (SuperAdmin) → .env variables

   Usage:
     import { reportError, reportMessage } from "@/lib/sentry-config";
     reportError(err, { userId: "..." });
     reportMessage("Deployment complete", { version: "1.2.0" });
   ═══════════════════════════════════════════════════════════════ */

/* ── Lazy-loaded Sentry references ────────────────────────── */

let captureException: ((error: unknown, context?: Record<string, unknown>) => void) | null = null;
let captureMessage: ((message: string, context?: Record<string, unknown>) => void) | null = null;

let _initialized = false;

/* ── DB-backed config reader ── */

async function readSentryConfigFromDB(): Promise<Partial<{
  dsn: string;
  environment: string;
  tracesSampleRate: string;
}>> {
  try {
    const { db } = await import("@/lib/db");
    const { decryptSecret } = await import("@/lib/aes-crypto");

    const keys = ["sentry_dsn", "sentry_environment", "sentry_traces_sample_rate"];
    const rows = await db.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const rowMap = new Map(rows.map((r) => [r.key, r.value]));

    return {
      dsn: rowMap.has("sentry_dsn") ? decryptSecret(rowMap.get("sentry_dsn")!) : "",
      environment: rowMap.get("sentry_environment") || "",
      tracesSampleRate: rowMap.get("sentry_traces_sample_rate") || "",
    };
  } catch {
    // DB not available — fall back to env vars entirely
    return {};
  }
}

/* ── Initialize Sentry (call once at app startup) ─────────── */

export async function initSentry(): Promise<void> {
  if (_initialized) return;

  // Read from DB first, then fall back to env
  const dbConfig = await readSentryConfigFromDB();
  const dsn = dbConfig.dsn || process.env.SENTRY_DSN;
  const environment = dbConfig.environment || process.env.SENTRY_ENVIRONMENT || "production";
  const tracesSampleRate = parseFloat(
    dbConfig.tracesSampleRate || process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"
  );
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
      environment,
      tracesSampleRate,
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
    console.info("[SENTRY] Initialized successfully (DB config)");
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
 * Get the Sentry DSN source — does not expose the actual value.
 * Returns "db" if configured via SuperAdmin panel, "env" if from .env, or "none".
 */
export async function getSentryDsnSource(): Promise<string> {
  try {
    const { db } = await import("@/lib/db");
    const row = await db.systemConfig.findUnique({
      where: { key: "sentry_dsn" },
    });
    if (row && row.value) return "db";
  } catch {
    // DB not available
  }
  return process.env.SENTRY_DSN ? "env" : "none";
}
