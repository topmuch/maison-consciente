// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — SMTP Client
//
// Nodemailer transport factory with connection caching,
// dry-run mode for development, and graceful error handling.
// Reads configuration from SystemConfig DB first, falls back
// to environment variables (.env).
// ═══════════════════════════════════════════════════════════════

import nodemailer from "nodemailer";

/* ── Types ── */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<Record<string, unknown>>;
  priority?: "high" | "normal" | "low";
  headers?: Record<string, string>;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dryRun?: boolean;
}

/* ── Module state ── */
let cachedTransport: nodemailer.Transporter | null = null;
let cachedConfig: SmtpConfig | null = null;
let connectionVerified = false;
let dryRunMode = false;

/* ── DB-backed config reader ── */

/**
 * Read SMTP configuration from SystemConfig DB first.
 * Falls back to environment variables if DB values are empty.
 * This enables runtime configuration via the SuperAdmin panel.
 */
async function readSmtpConfigFromDB(): Promise<Partial<SmtpConfig>> {
  try {
    const { db } = await import("@/lib/db");
    const { decryptSecret } = await import("@/lib/aes-crypto");

    const keys = [
      "smtp_host",
      "smtp_port",
      "smtp_secure",
      "smtp_user",
      "smtp_pass",
      "smtp_from_email",
    ];

    const rows = await db.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const rowMap = new Map(rows.map((r) => [r.key, r.value]));

    const get = (key: string): string => {
      const val = rowMap.get(key);
      if (!val) return "";
      return val;
    };

    const getDecrypted = (key: string): string => {
      const val = rowMap.get(key);
      if (!val) return "";
      return decryptSecret(val);
    };

    return {
      host: get("smtp_host"),
      port: get("smtp_port") ? parseInt(get("smtp_port"), 10) : undefined,
      secure: get("smtp_secure") === "true" ? true : undefined,
      user: getDecrypted("smtp_user"),
      pass: getDecrypted("smtp_pass"),
      fromEmail: get("smtp_from_email"),
    };
  } catch {
    // DB not available — fall back to env vars entirely
    return {};
  }
}

/* ── Legacy environment variable readers (fallback) ── */

function readSmtpConfigFromEnv(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "",
  };
}

/**
 * Merge DB config with env fallback.
 * DB values take priority over env vars.
 */
function mergeConfig(db: Partial<SmtpConfig>, env: SmtpConfig): SmtpConfig {
  return {
    host: db.host || env.host,
    port: db.port || env.port,
    secure: db.secure !== undefined ? db.secure : env.secure,
    user: db.user || env.user,
    pass: db.pass || env.pass,
    fromEmail: db.fromEmail || env.fromEmail,
  };
}

function configSignature(config: SmtpConfig): string {
  return `${config.host}:${config.port}:${config.user}:${config.pass}:${config.fromEmail}:${config.secure}`;
}

/* ── Public API ── */

/**
 * Check if SMTP is properly configured (from DB or env vars).
 * Returns true if all required fields (host, user, pass, fromEmail) are set.
 */
export async function isEmailConfigured(): Promise<boolean> {
  const dbConfig = await readSmtpConfigFromDB();
  const envConfig = readSmtpConfigFromEnv();
  const merged = mergeConfig(dbConfig, envConfig);
  return !!(
    merged.host &&
    merged.user &&
    merged.pass &&
    merged.fromEmail
  );
}

/**
 * Synchronous check — only reads env vars.
 * Useful for quick checks where async is not available.
 */
export function isEmailConfiguredSync(): boolean {
  const config = readSmtpConfigFromEnv();
  return !!(
    config.host &&
    config.user &&
    config.pass &&
    config.fromEmail
  );
}

/**
 * Get or create a cached nodemailer transport.
 * On first call, reads config from DB → env fallback, verifies connection.
 * In dry-run mode (no SMTP configured), returns a test account transport.
 */
export async function getTransport(): Promise<nodemailer.Transporter> {
  const dbConfig = await readSmtpConfigFromDB();
  const envConfig = readSmtpConfigFromEnv();
  const config = mergeConfig(dbConfig, envConfig);

  // Check if config changed — invalidate cache if so
  if (cachedConfig && configSignature(config) !== configSignature(cachedConfig)) {
    cachedTransport = null;
    connectionVerified = false;
  }

  // Return cached transport if valid
  if (cachedTransport && connectionVerified) {
    return cachedTransport;
  }

  // Check if configured
  const configured = !!(
    config.host &&
    config.user &&
    config.pass &&
    config.fromEmail
  );

  // Dry-run mode: no SMTP configured
  if (!configured) {
    dryRunMode = true;
    console.warn(
      "[SmtpClient] SMTP not configured (DB + env) — running in dry-run mode. Emails will be logged to console."
    );

    // Create a test account for local development logging
    const testAccount = await nodemailer.createTestAccount();
    cachedTransport = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedConfig = config;
    connectionVerified = true;
    return cachedTransport;
  }

  // Production: create real transport
  try {
    cachedTransport = nodemailer.createTransport({
      service: undefined,
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: true,
      rateDelta: 1000,
    } as nodemailer.TransportOptions);

    // Verify connection
    await cachedTransport.verify();
    connectionVerified = true;
    cachedConfig = config;
    console.log(
      `[SmtpClient] Transport connected successfully to ${config.host}:${config.port}`
    );
    return cachedTransport;
  } catch (err) {
    cachedTransport = null;
    connectionVerified = false;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SmtpClient] Failed to create/verify transport: ${message}`);
    throw new Error(`SMTP connection failed: ${message}`);
  }
}

/**
 * Send an email via the cached transport.
 * In dry-run mode, logs the email content to console instead.
 * Always returns a SendResult — never throws.
 */
export async function sendMail(options: MailOptions): Promise<SendResult> {
  const dbConfig = await readSmtpConfigFromDB();
  const envConfig = readSmtpConfigFromEnv();
  const config = mergeConfig(dbConfig, envConfig);
  const fromAddress = options.from || config.fromEmail || "noreply@maisonconsciente.com";

  try {
    const transport = await getTransport();

    const mailPayload: nodemailer.SendMailOptions = {
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
      attachments: options.attachments,
      headers: {
        "X-Priority": options.priority === "high"
          ? "1"
          : options.priority === "low"
            ? "5"
            : "3",
        "X-Mailer": "Maison Consciente / Maellis",
        ...(options.headers || {}),
      },
    };

    const info = await transport.sendMail(mailPayload);

    if (dryRunMode) {
      // In dry-run mode, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("[SmtpClient] DRY-RUN — Email logged (not sent):");
      console.log(`  To: ${options.to}`);
      console.log(`  Subject: ${options.subject}`);
      console.log(`  Preview URL: ${previewUrl}`);
    } else {
      console.log(
        `[SmtpClient] Email sent to ${options.to} — MessageId: ${info.messageId}`
      );
    }

    return {
      success: true,
      messageId: info.messageId,
      dryRun: dryRunMode,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SmtpClient] sendMail failed for ${options.to}: ${message}`);
    return {
      success: false,
      error: message,
      dryRun: dryRunMode,
    };
  }
}

/**
 * Reset the transport cache. Useful for testing or config changes.
 */
export function resetTransportCache(): void {
  cachedTransport = null;
  cachedConfig = null;
  connectionVerified = false;
  dryRunMode = false;
}
