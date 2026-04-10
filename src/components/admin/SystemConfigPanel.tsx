'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — System Config Panel (SuperAdmin)
   
   Platform-wide settings panel for SMTP, Sentry, and
   general configuration. Secrets are encrypted (AES-256-GCM)
   and never exposed to the client.
   ═══════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Shield,
  Settings,
  Loader2,
  RefreshCw,
  Save,
  TestTube2,
  CheckCircle2,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Globe,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getSystemConfigs,
  updateSystemConfig,
  testSmtpConnection,
  testSentryConnection,
  sendTestEmail,
  type CategoryGroup,
  type SystemConfigPublic,
  type TestResult,
} from '@/actions/admin-system-config';

/* ═══════════════════════════════════════════════════════
   CATEGORY ICON MAP
   ═══════════════════════════════════════════════════════ */

const CATEGORY_ICONS: Record<string, typeof Mail> = {
  smtp: Mail,
  sentry: Shield,
  general: Settings,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  smtp: { bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', border: 'border-[#22c55e]/20' },
  sentry: { bg: 'bg-[#f43f5e]/10', text: 'text-[#f43f5e]', border: 'border-[#f43f5e]/20' },
  general: { bg: 'bg-[#8b5cf6]/10', text: 'text-[#8b5cf6]', border: 'border-[#8b5cf6]/20' },
};

/* ═══════════════════════════════════════════════════════
   ANIMATION
   ═══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function ConfigSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl bg-white/[0.06]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32 bg-white/[0.06]" />
              <Skeleton className="h-3 w-48 bg-white/[0.06]" />
            </div>
          </div>
          <div className="space-y-3 pl-12">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-24 bg-white/[0.06]" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONFIG FIELD
   ═══════════════════════════════════════════════════════ */

function ConfigField({
  config,
  onSave,
  disabled,
}: {
  config: SystemConfigPublic;
  onSave: (key: string, value: string) => Promise<boolean>;
  disabled: boolean;
}) {
  const [localValue, setLocalValue] = useState(config.value);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derive hasChanges from current localValue vs last known config value
  const hasChanges = localValue !== config.value;

  const handleChange = (val: string) => {
    setLocalValue(val);
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(config.key, localValue);
    setSaving(false);
    if (ok) {
      // Reset local value to the server-returned value (masked)
      setLocalValue(config.value);
    }
  };

  const inputType = config.isSecret && !showSecret ? 'password' : 'text';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#94a3b8] flex items-center gap-1.5">
          {config.isSecret && <Lock className="w-3 h-3 text-[#f43f5e]/60" />}
          {config.label}
        </label>
        {config.isConfigured && (
          <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-0 text-[9px] font-semibold px-2 py-0 rounded-full">
            Configuré
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type={inputType}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={config.placeholder}
          disabled={disabled}
          className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 rounded-xl text-sm h-10"
        />
        {config.isSecret && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSecret(!showSecret)}
            disabled={disabled}
            className="shrink-0 text-[#475569] hover:text-[#94a3b8] hover:bg-white/[0.04] w-10 h-10"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
        {hasChanges && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={disabled || saving}
            className="shrink-0 text-[#22c55e] hover:text-[#22c55e] hover:bg-[#22c55e]/10 w-10 h-10"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </Button>
        )}
      </div>
      {config.description && (
        <p className="text-[10px] text-[#475569] leading-relaxed">{config.description}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CATEGORY SECTION
   ═══════════════════════════════════════════════════════ */

function CategorySection({
  group,
  index,
  onSaveConfig,
  disabled,
  testResult,
  onTestSmtp,
  onTestSentry,
  onSendTestEmail,
  testEmailSending,
}: {
  group: CategoryGroup;
  index: number;
  onSaveConfig: (key: string, value: string) => Promise<boolean>;
  disabled: boolean;
  testResult: Record<string, TestResult | null>;
  onTestSmtp: () => Promise<void>;
  onTestSentry: () => Promise<void>;
  onSendTestEmail: (email: string) => Promise<boolean>;
  testEmailSending: boolean;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const Icon = CATEGORY_ICONS[group.category] ?? Settings;
  const colors = CATEGORY_COLORS[group.category] ?? CATEGORY_COLORS.general;

  const handleTest = async () => {
    setTestLoading(true);
    try {
      if (group.category === 'smtp') await onTestSmtp();
      else if (group.category === 'sentry') await onTestSentry();
    } finally {
      setTestLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.includes('@')) {
      toast.error('Adresse email invalide');
      return;
    }
    const ok = await onSendTestEmail(testEmail);
    if (ok) setTestEmail('');
  };

  return (
    <motion.div
      custom={0.05 + index * 0.1}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="glass rounded-2xl overflow-hidden inner-glow"
    >
      {/* ── Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-serif font-semibold tracking-tight text-foreground">
                {group.label}
              </h3>
              <Badge className={`${colors.bg} ${colors.text} border-0 text-[9px] font-semibold px-2 py-0 rounded-full`}>
                {group.configuredCount}/{group.totalCount}
              </Badge>
            </div>
            <p className="text-[11px] text-[#475569] mt-0.5">{group.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[#475569]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#475569]" />
        )}
      </button>

      {/* ── Content ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Divider */}
              <div className="border-t border-white/[0.06]" />

              {/* Config fields */}
              <div className="space-y-4">
                {group.configs.map((config) => (
                  <ConfigField
                    key={config.key}
                    config={config}
                    onSave={onSaveConfig}
                    disabled={disabled}
                  />
                ))}
              </div>

              {/* Test buttons */}
              {(group.category === 'smtp' || group.category === 'sentry') && (
                <>
                  <div className="border-t border-white/[0.06]" />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={disabled || testLoading}
                      className={`
                        flex items-center gap-2 rounded-xl text-sm font-medium
                        ${testLoading ? 'opacity-60' : ''}
                        border-white/[0.12] hover:bg-white/[0.04] text-[#e2e8f0]
                      `}
                    >
                      {testLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube2 className="w-4 h-4" />
                      )}
                      {group.category === 'smtp' ? 'Tester SMTP' : 'Tester Sentry'}
                    </Button>

                    {/* Test result indicator */}
                    {testResult[group.category] && (
                      <div className="flex items-center gap-2 text-sm">
                        {testResult[group.category]!.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                            <span className="text-[#22c55e]">{testResult[group.category]!.message}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-[#f43f5e]" />
                            <span className="text-[#f43f5e]">{testResult[group.category]!.message}</span>
                          </>
                        )}
                        <span className="text-[10px] text-[#475569] ml-1">
                          ({testResult[group.category]!.latencyMs}ms)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Send test email (SMTP only) */}
                  {group.category === 'smtp' && (
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                      <div className="flex-1 space-y-1.5 w-full sm:w-auto">
                        <label className="text-xs font-medium text-[#94a3b8]">
                          Envoyer un email de test
                        </label>
                        <Input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="votre@email.com"
                          disabled={disabled || testEmailSending}
                          className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 rounded-xl text-sm h-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleSendTestEmail}
                        disabled={disabled || testEmailSending || !testEmail}
                        className="flex items-center gap-2 rounded-xl text-sm font-medium border-white/[0.12] hover:bg-white/[0.04] text-[#e2e8f0] shrink-0 h-10"
                      >
                        {testEmailSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Envoyer
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* General: platform info notice */}
              {group.category === 'general' && (
                <div className="rounded-xl bg-[#8b5cf6]/[0.06] border border-[#8b5cf6]/10 p-4 flex items-start gap-2">
                  <Globe className="w-4 h-4 text-[#8b5cf6] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Les paramètres généraux sont utilisés par l&apos;assistant vocal Maellis,
                    les emails transactionnels et les notifications système.
                    Les modifications prennent effet immédiatement.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SYSTEM CONFIG PANEL
   ═══════════════════════════════════════════════════════ */

export function SystemConfigPanel() {
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult | null>>({});
  const [testEmailSending, setTestEmailSending] = useState(false);

  /* ── Fetch configs ── */
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSystemConfigs();
      if (result.success) {
        setCategories(result.categories);
      } else {
        setError('Impossible de charger les configurations système');
      }
    } catch {
      setError('Erreur réseau lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /* ── Save handler ── */
  const handleSaveConfig = async (key: string, value: string): Promise<boolean> => {
    try {
      const result = await updateSystemConfig({ key, value });
      if (result.success) {
        toast.success('Configuration sauvegardée');
        await fetchConfigs();
        return true;
      } else {
        toast.error(result.error || 'Erreur lors de la sauvegarde');
        return false;
      }
    } catch {
      toast.error('Erreur serveur');
      return false;
    }
  };

  /* ── Test SMTP ── */
  const handleTestSmtp = async () => {
    try {
      const result = await testSmtpConnection();
      if (result.success && result.result) {
        setTestResults((prev) => ({ ...prev, smtp: result.result! }));
        toast[result.result.success ? 'success' : 'error'](result.result.message);
      } else {
        toast.error(result.error || 'Erreur lors du test SMTP');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  /* ── Test Sentry ── */
  const handleTestSentry = async () => {
    try {
      const result = await testSentryConnection();
      if (result.success && result.result) {
        setTestResults((prev) => ({ ...prev, sentry: result.result! }));
        toast[result.result.success ? 'success' : 'error'](result.result.message);
      } else {
        toast.error(result.error || 'Erreur lors du test Sentry');
      }
    } catch {
      toast.error('Erreur réseau');
    }
  };

  /* ── Send test email ── */
  const handleSendTestEmail = async (email: string): Promise<boolean> => {
    setTestEmailSending(true);
    try {
      const result = await sendTestEmail(email);
      if (result.success) {
        toast.success(result.error || 'Email de test envoyé avec succès');
        return true;
      } else {
        toast.error(result.error || "Échec de l'envoi");
        return false;
      }
    } finally {
      setTestEmailSending(false);
    }
  };

  /* ── Compute totals ── */
  const totalConfigured = categories.reduce((sum, cat) => sum + cat.configuredCount, 0);
  const totalCount = categories.reduce((sum, cat) => sum + cat.totalCount, 0);

  return (
    <motion.div
      custom={0}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Summary header ── */}
      <div className="glass rounded-xl p-5 inner-glow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold tracking-tight text-foreground">
                Configuration Système
              </h2>
              <p className="text-[11px] text-[#475569] mt-0.5">
                SMTP, monitoring, paramètres globaux de la plateforme
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
              {totalConfigured}/{totalCount} configurés
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchConfigs()}
              disabled={loading}
              className="shrink-0 text-[#64748b] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
              aria-label="Rafraîchir les configurations"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#475569] leading-relaxed">
            🔐 Les valeurs secrètes sont chiffrées (AES-256-GCM) en base de données et ne sont jamais
            exposées côté client. La priorité est : <strong className="text-[#94a3b8]">Base de données → Variables d&apos;environnement (.env)</strong>.
            Toute modification est tracée dans le journal d&apos;audit.
          </p>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && !loading && (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-sm text-[#f87171]">{error}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchConfigs}
            className="mt-3 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-light)] transition-colors"
          >
            Réessayer
          </motion.button>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading ? (
        <ConfigSkeleton />
      ) : (
        <div className="space-y-4">
          {categories.map((group, i) => (
            <CategorySection
              key={group.category}
              group={group}
              index={i}
              onSaveConfig={handleSaveConfig}
              disabled={false}
              testResult={testResults}
              onTestSmtp={handleTestSmtp}
              onTestSentry={handleTestSentry}
              onSendTestEmail={handleSendTestEmail}
              testEmailSending={testEmailSending}
            />
          ))}
        </div>
      )}

      {/* ── Fallback notice ── */}
      <div className="glass rounded-xl p-4">
        <p className="text-[11px] text-[#475569] leading-relaxed">
          💡 <strong className="text-[#94a3b8]">Priorité de configuration :</strong> Le système lit d&apos;abord
          les valeurs depuis la base de données (cette interface). Si aucune valeur n&apos;est configurée ici,
          il utilise les variables d&apos;environnement (.env) comme fallback. Cette approche permet de
          configurer la plateforme en production sans redéployer.
        </p>
      </div>
    </motion.div>
  );
}
