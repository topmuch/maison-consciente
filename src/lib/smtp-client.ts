// ═══════════════════════════════════════════════════════════════
// MAISON CONSCIENTE — SMTP Client
//
// Nodemailer transport factory with connection caching,
// dry-run mode for development, and graceful error handling.
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

/* ── Environment variable readers ── */
function readSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "",
  };
}

function configSignature(config: SmtpConfig): string {
  return `${config.host}:${config.port}:${config.user}:${config.pass}:${config.fromEmail}:${config.secure}`;
}

/* ── Public API ── */

/**
 * Check if SMTP environment variables are properly configured.
 * Returns true if all required vars (host, user, pass, fromEmail) are set.
 */
export function isEmailConfigured(): boolean {
  const config = readSmtpConfig();
  return !!(
    config.host &&
    config.user &&
    config.pass &&
    config.fromEmail
  );
}

/**
 * Get or create a cached nodemailer transport.
 * On first call, verifies the SMTP connection.
 * In dry-run mode (missing SMTP vars), returns a test account transport.
 */
export async function getTransport(): Promise<nodemailer.Transporter> {
  const config = readSmtpConfig();

  // Check if config changed — invalidate cache if so
  if (cachedConfig && configSignature(config) !== configSignature(cachedConfig)) {
    cachedTransport = null;
    connectionVerified = false;
  }

  // Return cached transport if valid
  if (cachedTransport && connectionVerified) {
    return cachedTransport;
  }

  // Dry-run mode: no SMTP configured
  if (!isEmailConfigured()) {
    dryRunMode = true;
    console.warn(
      "[SmtpClient] SMTP not configured — running in dry-run mode. Emails will be logged to console."
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
  const config = readSmtpConfig();
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
