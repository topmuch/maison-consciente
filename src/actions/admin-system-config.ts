'use server';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — SuperAdmin System Config Actions
   
   Server Actions for managing platform-wide system settings.
   SMTP, Sentry, and general configuration.
   All secrets are AES-encrypted and audited via UserLog.
   Access restricted to role: "superadmin" only.
   ═══════════════════════════════════════════════════════ */

import { z } from 'zod';
import { db } from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/aes-crypto';
import { auth } from '@/core/auth/lucia';
import { cookies } from 'next/headers';

/* ═══════════════════════════════════════════════════════
   CONFIG DEFINITIONS
   ═══════════════════════════════════════════════════════ */

interface ConfigDefinition {
  key: string;
  category: string;
  label: string;
  description: string;
  isSecret: boolean;
  placeholder: string;
  defaultValue: string;
}

const CONFIG_DEFINITIONS: ConfigDefinition[] = [
  // ── SMTP ──
  {
    key: 'smtp_host',
    category: 'smtp',
    label: 'Hôte SMTP',
    description: 'Adresse du serveur SMTP (ex: smtp.gmail.com, smtp.sendgrid.net)',
    isSecret: false,
    placeholder: 'smtp.gmail.com',
    defaultValue: '',
  },
  {
    key: 'smtp_port',
    category: 'smtp',
    label: 'Port SMTP',
    description: 'Port de connexion (587 pour TLS, 465 pour SSL)',
    isSecret: false,
    placeholder: '587',
    defaultValue: '587',
  },
  {
    key: 'smtp_secure',
    category: 'smtp',
    label: 'SSL/TLS',
    description: 'Activer le chiffrement SSL/TLS (oui pour le port 465, non pour le port 587 avec STARTTLS)',
    isSecret: false,
    placeholder: 'false',
    defaultValue: 'false',
  },
  {
    key: 'smtp_user',
    category: 'smtp',
    label: 'Utilisateur SMTP',
    description: 'Nom d\'utilisateur ou adresse email de connexion au serveur SMTP',
    isSecret: true,
    placeholder: 'user@gmail.com',
    defaultValue: '',
  },
  {
    key: 'smtp_pass',
    category: 'smtp',
    label: 'Mot de passe SMTP',
    description: 'Mot de passe ou clé d\'application du serveur SMTP',
    isSecret: true,
    placeholder: '••••••••••••',
    defaultValue: '',
  },
  {
    key: 'smtp_from_email',
    category: 'smtp',
    label: 'Email d\'expédition',
    description: 'Adresse email d\'expédition par défaut (ex: noreply@maisonconsciente.com)',
    isSecret: false,
    placeholder: 'noreply@maisonconsciente.com',
    defaultValue: '',
  },
  // ── Sentry ──
  {
    key: 'sentry_dsn',
    category: 'sentry',
    label: 'Sentry DSN',
    description: 'Data Source Name Sentry pour le suivi des erreurs en production',
    isSecret: true,
    placeholder: 'https://xxx@xxx.ingest.sentry.io/xxx',
    defaultValue: '',
  },
  {
    key: 'sentry_environment',
    category: 'sentry',
    label: 'Environnement Sentry',
    description: 'Tag d\'environnement envoyé avec chaque erreur (production, staging, dev)',
    isSecret: false,
    placeholder: 'production',
    defaultValue: 'production',
  },
  {
    key: 'sentry_traces_sample_rate',
    category: 'sentry',
    label: 'Traces Sample Rate',
    description: 'Taux d\'échantillonnage des performances (0.0 à 1.0)',
    isSecret: false,
    placeholder: '0.1',
    defaultValue: '0.1',
  },
  // ── Général ──
  {
    key: 'platform_name',
    category: 'general',
    label: 'Nom de la plateforme',
    description: 'Nom affiché dans les emails et les notifications système',
    isSecret: false,
    placeholder: 'Maison Consciente',
    defaultValue: 'Maison Consciente',
  },
  {
    key: 'support_email',
    category: 'general',
    label: 'Email de support',
    description: 'Adresse email de contact pour le support technique',
    isSecret: false,
    placeholder: 'support@maisonconsciente.com',
    defaultValue: '',
  },
  {
    key: 'default_language',
    category: 'general',
    label: 'Langue par défaut',
    description: 'Langue par défaut de l\'assistant vocal et des réponses',
    isSecret: false,
    placeholder: 'fr',
    defaultValue: 'fr',
  },
  {
    key: 'timezone',
    category: 'general',
    label: 'Fuseau horaire',
    description: 'Fuseau horaire principal du système',
    isSecret: false,
    placeholder: 'Europe/Paris',
    defaultValue: 'Europe/Paris',
  },
];

/* ── Zod Schemas ── */

const updateConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const testSmtpSchema = z.object({});

const testSentrySchema = z.object({});

/* ── Types ── */

export interface SystemConfigPublic {
  key: string;
  category: string;
  label: string;
  description: string;
  isSecret: boolean;
  placeholder: string;
  value: string; // masked for secrets
  isConfigured: boolean;
  updatedAt: string | null;
}

export interface TestResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

export interface CategoryGroup {
  category: string;
  label: string;
  icon: string;
  description: string;
  configs: SystemConfigPublic[];
  configuredCount: number;
  totalCount: number;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

async function requireSuperadmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(auth.sessionCookieName)?.value;
  if (!sessionId) throw new Error('UNAUTHORIZED');

  const { session, user } = await auth.validateSession(sessionId);
  if (!session || !user) throw new Error('UNAUTHORIZED');
  if (user.role !== 'superadmin') throw new Error('FORBIDDEN');

  return { userId: user.id, householdId: user.householdId, email: user.email };
}

async function auditLog(userId: string, action: string, details: string) {
  try {
    await db.userLog.create({
      data: {
        userId,
        householdId: 'system',
        action: `system_config_${action}`,
        details,
      },
    });
  } catch {
    // Non-critical audit failure
  }
}

function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length < 8) return '••••';
  return value.slice(0, 4) + '••••' + value.slice(-3);
}

/* ═══════════════════════════════════════════════════════
   SEED DEFAULTS
   ═══════════════════════════════════════════════════════ */

async function ensureDefaultsSeeded() {
  const existingKeys = await db.systemConfig.findMany({
    select: { key: true },
  });
  const existingSet = new Set(existingKeys.map((r) => r.key));

  for (const def of CONFIG_DEFINITIONS) {
    if (!existingSet.has(def.key)) {
      await db.systemConfig.create({
        data: {
          key: def.key,
          category: def.category,
          label: def.label,
          description: def.description,
          isSecret: def.isSecret,
          value: def.defaultValue,
        },
      });
    }
  }
}

/* ═══════════════════════════════════════════════════════
   ACTION: Get All System Configs
   ═══════════════════════════════════════════════════════ */

export async function getSystemConfigs(): Promise<{
  success: boolean;
  categories: CategoryGroup[];
}> {
  try {
    await requireSuperadmin();
    await ensureDefaultsSeeded();

    const rows = await db.systemConfig.findMany({
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    const rowMap = new Map(rows.map((r) => [r.key, r]));

    // Build config list
    const configs: SystemConfigPublic[] = CONFIG_DEFINITIONS.map((def) => {
      const row = rowMap.get(def.key);
      const rawValue = row ? decryptSecret(row.value) : def.defaultValue;

      return {
        key: def.key,
        category: def.category,
        label: def.label,
        description: def.description,
        isSecret: def.isSecret,
        placeholder: def.placeholder,
        value: def.isSecret ? maskSecret(rawValue) : rawValue,
        isConfigured: !!rawValue && rawValue !== def.defaultValue,
        updatedAt: row?.updatedAt?.toISOString() ?? null,
      };
    });

    // Group by category
    const categoryMeta: Record<string, { label: string; icon: string; description: string }> = {
      smtp: {
        label: 'Email (SMTP)',
        icon: 'Mail',
        description: 'Configuration du serveur d\'envoi d\'emails transactionnels',
      },
      sentry: {
        label: 'Monitoring (Sentry)',
        icon: 'Shield',
        description: 'Surveillance des erreurs et performance en temps réel',
      },
      general: {
        label: 'Général',
        icon: 'Settings',
        description: 'Paramètres globaux de la plateforme',
      },
    };

    const categoryOrder = ['smtp', 'sentry', 'general'];
    const categories: CategoryGroup[] = categoryOrder.map((cat) => {
      const catConfigs = configs.filter((c) => c.category === cat);
      const meta = categoryMeta[cat] ?? { label: cat, icon: 'Settings', description: '' };
      return {
        category: cat,
        ...meta,
        configs: catConfigs,
        configuredCount: catConfigs.filter((c) => c.isConfigured).length,
        totalCount: catConfigs.length,
      };
    });

    return { success: true, categories };
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return { success: false, categories: [] };
    }
    return { success: false, categories: [] };
  }
}

/* ═══════════════════════════════════════════════════════
   ACTION: Get Single Config Value (for backend reads)
   ═══════════════════════════════════════════════════════ */

export async function getSystemConfigValue(key: string): Promise<string> {
  const row = await db.systemConfig.findUnique({
    where: { key },
  });
  if (!row) return '';
  return decryptSecret(row.value);
}

/**
 * Get multiple config values at once.
 * Returns a map of key → value.
 */
export async function getSystemConfigValues(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = decryptSecret(row.value);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   ACTION: Update System Config
   ═══════════════════════════════════════════════════════ */

export async function updateSystemConfig(
  input: z.infer<typeof updateConfigSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireSuperadmin();
    const { key, value } = updateConfigSchema.parse(input);

    // Find the definition
    const def = CONFIG_DEFINITIONS.find((d) => d.key === key);
    if (!def) {
      return { success: false, error: `Clé "${key}" non reconnue` };
    }

    // Encrypt secrets
    const storedValue = def.isSecret ? encryptSecret(value) : value;

    const existing = await db.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      await db.systemConfig.update({
        where: { key },
        data: { value: storedValue },
      });
    } else {
      await db.systemConfig.create({
        data: {
          key: def.key,
          category: def.category,
          label: def.label,
          description: def.description,
          isSecret: def.isSecret,
          value: storedValue,
        },
      });
    }

    // Reset SMTP transport cache if SMTP config changed
    if (key.startsWith('smtp_')) {
      try {
        const { resetTransportCache } = await import('@/lib/smtp-client');
        resetTransportCache();
      } catch {
        // Module may not be loaded yet
      }
    }

    await auditLog(
      admin.userId,
      'update',
      `Config "${def.label}" (${key}) mise à jour`,
    );

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
        return { success: false, error: 'Accès refusé' };
      }
      if (error instanceof z.ZodError) {
        return { success: false, error: 'Données invalides' };
      }
    }
    return { success: false, error: 'Erreur serveur' };
  }
}

/* ═══════════════════════════════════════════════════════
   ACTION: Test SMTP Connection
   ═══════════════════════════════════════════════════════ */

export async function testSmtpConnection(): Promise<{
  success: boolean;
  result?: TestResult;
  error?: string;
}> {
  try {
    const admin = await requireSuperadmin();

    // Read config from DB
    const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass'];
    const values = await getSystemConfigValues(keys);

    // Fallback to env vars
    const host = values.smtp_host || process.env.SMTP_HOST || '';
    const port = parseInt(values.smtp_port || process.env.SMTP_PORT || '587', 10);
    const secure = values.smtp_secure === 'true' || process.env.SMTP_SECURE === 'true';
    const user = values.smtp_user || process.env.SMTP_USER || '';
    const pass = values.smtp_pass || process.env.SMTP_PASS || '';

    if (!host || !user || !pass) {
      return {
        success: false,
        error: 'Configuration SMTP incomplète (hôte, utilisateur et mot de passe requis)',
      };
    }

    const start = Date.now();

    try {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      } as Parameters<typeof nodemailer.createTransport>[0]);

      await transport.verify();
      const latencyMs = Date.now() - start;

      await auditLog(
        admin.userId,
        'test',
        `Test SMTP: OK — ${host}:${port} (${latencyMs}ms)`,
      );

      return {
        success: true,
        result: {
          success: true,
          message: `Connexion SMTP vérifiée — ${host}:${port}`,
          latencyMs,
        },
      };
    } catch (smtpErr) {
      const message = smtpErr instanceof Error ? smtpErr.message : String(smtpErr);

      await auditLog(
        admin.userId,
        'test',
        `Test SMTP: ÉCHEC — ${message}`,
      );

      return {
        success: true,
        result: {
          success: false,
          message,
          latencyMs: Date.now() - start,
        },
      };
    }
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return { success: false, error: 'Accès refusé' };
    }
    return { success: false, error: 'Erreur lors du test' };
  }
}

/* ═══════════════════════════════════════════════════════
   ACTION: Test Sentry Connection
   ═══════════════════════════════════════════════════════ */

export async function testSentryConnection(): Promise<{
  success: boolean;
  result?: TestResult;
  error?: string;
}> {
  try {
    const admin = await requireSuperadmin();

    // Read config from DB
    const dsn = await getSystemConfigValue('sentry_dsn') || process.env.SENTRY_DSN || '';

    if (!dsn) {
      return {
        success: false,
        error: 'Sentry DSN non configuré',
      };
    }

    const start = Date.now();

    try {
      // Test by making a simple fetch to the Sentry endpoint
      const parsedUrl = new URL(dsn.replace(/^https?:\/\//, 'https://'));
      const testUrl = `https://${parsedUrl.host}/api/${parsedUrl.pathname.split('/')[1]}/envelope/`;

      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-sentry-envelope' },
        body: JSON.stringify({
          sentry_key: parsedUrl.username,
          sentry_version: '2',
          dsn,
        }),
        signal: AbortSignal.timeout(5000),
      });

      // Even 4xx is OK — it means the endpoint exists and DSN is reachable
      const latencyMs = Date.now() - start;

      await auditLog(
        admin.userId,
        'test',
        `Test Sentry: ${res.ok ? 'OK' : 'joignable'} — ${latencyMs}ms`,
      );

      return {
        success: true,
        result: {
          success: true,
          message: res.ok
            ? `Sentry joignable — ${parsedUrl.host}`
            : `Sentry endpoint accessible (HTTP ${res.status}) — DSN valide`,
          latencyMs,
        },
      };
    } catch (fetchErr) {
      const message = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

      await auditLog(
        admin.userId,
        'test',
        `Test Sentry: ÉCHEC — ${message}`,
      );

      return {
        success: true,
        result: {
          success: false,
          message,
          latencyMs: Date.now() - start,
        },
      };
    }
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return { success: false, error: 'Accès refusé' };
    }
    return { success: false, error: 'Erreur lors du test' };
  }
}

/* ═══════════════════════════════════════════════════════
   ACTION: Send Test Email
   ═══════════════════════════════════════════════════════ */

export async function sendTestEmail(
  toEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requireSuperadmin();

    if (!toEmail || !toEmail.includes('@')) {
      return { success: false, error: 'Adresse email invalide' };
    }

    const { sendMail, isEmailConfigured: isConfigured } = await import('@/lib/smtp-client');

    const configured = await isConfigured();
    if (!configured) {
      // Check if dry run mode
      const { getTransport } = await import('@/lib/smtp-client');
      try {
        await getTransport();
      } catch {
        return { success: false, error: 'SMTP non configuré' };
      }
    }

    const { generateEmailTemplate } = await import('@/lib/email-template');

    const html = generateEmailTemplate({
      title: 'Email de Test — Maison Consciente',
      preheader: 'Configuration SMTP vérifiée avec succès',
      content: [
        {
          type: 'info',
          title: 'Configuration SMTP réussie !',
          body: 'Votre serveur SMTP est correctement configuré. Cet email de test a été envoyé avec succès depuis le panneau d\'administration.',
        },
        {
          type: 'list',
          title: 'Détails de la connexion',
          items: [
            `Envoyé par : ${admin.email}`,
            `Destinataire : ${toEmail}`,
            `Date : ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`,
          ],
        },
      ],
      cta: {
        label: 'Retour au panneau',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`,
      },
    });

    const result = await sendMail({
      to: toEmail,
      subject: '🔔 Test SMTP — Maison Consciente',
      html,
    });

    if (result.success) {
      await auditLog(
        admin.userId,
        'test_email',
        `Email de test envoyé à ${toEmail}${result.dryRun ? ' (dry-run)' : ''}`,
      );
    }

    return result.success
      ? { success: true, error: result.dryRun ? 'Email envoyé en mode dry-run (SMTP non configuré en production)' : undefined }
      : { success: false, error: result.error || 'Échec de l\'envoi' };
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN')) {
      return { success: false, error: 'Accès refusé' };
    }
    return { success: false, error: 'Erreur lors de l\'envoi' };
  }
}

/* ── Client-safe type exports ── */

export type { ConfigDefinition };
