'use client';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — API Config Card (SuperAdmin)
   
   Individual card for configuring an external API service.
   Dark Luxe design with glassmorphism, status badges,
   password toggle, and inline test/save actions.
   ═══════════════════════════════════════════════════════ */

import { useState, type FC } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  Save,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  RefreshCw,
  Globe,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ── Types ── */

interface ApiConfigCardProps {
  id: string;
  serviceKey: string;
  maskedKey: string;
  baseUrl: string | null;
  isActive: boolean;
  status: string;
  lastTested: string | null;
  icon: FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  serviceName: string;
  serviceDescription: string;
  onSave: (data: {
    serviceKey: string;
    apiKey: string;
    isActive: boolean;
    baseUrl: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onTest: (serviceKey: string) => Promise<{
    success: boolean;
    result?: { success: boolean; message: string; latencyMs: number };
    error?: string;
  }>;
}

/* ── Status helpers ── */

function getStatusConfig(status: string, isActive: boolean) {
  if (!isActive) {
    return {
      label: 'Inactif',
      icon: MinusCircle,
      badgeClass: 'bg-[#64748b]/10 text-[#64748b]',
      dotClass: 'bg-[#64748b]',
    };
  }
  switch (status) {
    case 'ok':
      return {
        label: 'Configuré',
        icon: CheckCircle2,
        badgeClass: 'bg-[#22c55e]/10 text-[#22c55e]',
        dotClass: 'bg-[#22c55e]',
      };
    case 'error':
      return {
        label: 'Erreur',
        icon: XCircle,
        badgeClass: 'bg-[#f87171]/10 text-[#f87171]',
        dotClass: 'bg-[#f87171]',
      };
    case 'untested':
      return {
        label: 'Non testé',
        icon: AlertTriangle,
        badgeClass: 'bg-[#eab308]/10 text-[#eab308]',
        dotClass: 'bg-[#eab308]',
      };
    default:
      return {
        label: 'Inconnu',
        icon: MinusCircle,
        badgeClass: 'bg-[#64748b]/10 text-[#64748b]',
        dotClass: 'bg-[#64748b]',
      };
  }
}

/* ── Card Component ── */

export function ApiConfigCard({
  id,
  serviceKey,
  maskedKey: initialMaskedKey,
  baseUrl: initialBaseUrl,
  isActive: initialIsActive,
  status: initialStatus,
  lastTested: initialLastTested,
  icon: Icon,
  iconBg,
  iconColor,
  serviceName,
  serviceDescription,
  onSave,
  onTest,
}: ApiConfigCardProps) {
  /* ── Local state ── */
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isActive, setIsActive] = useState(initialIsActive);
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl ?? '');
  const [status, setStatus] = useState(initialStatus);
  const [lastTested, setLastTested] = useState(initialLastTested);
  const [maskedKey, setMaskedKey] = useState(initialMaskedKey);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  /* ── Track changes ── */
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setHasChanges(true);
  };

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    setHasChanges(true);
  };

  const handleToggleActive = () => {
    setIsActive((prev) => !prev);
    setHasChanges(true);
  };

  /* ── Save handler ── */
  const handleSave = async () => {
    if (!apiKey && !initialMaskedKey) {
      toast.error('Veuillez saisir une clé API');
      return;
    }

    setSaving(true);
    try {
      const result = await onSave({
        serviceKey,
        apiKey: apiKey || '__KEEP_EXISTING__',
        isActive,
        baseUrl,
      });

      if (result.success) {
        toast.success(`${serviceName} : configuration enregistrée`);
        setHasChanges(false);
        setStatus('untested');
        setLastTested(null);
        // After save, the key input is cleared (masked version displayed)
        if (apiKey && apiKey !== '__KEEP_EXISTING__') {
          setApiKey('');
        }
      } else {
        toast.error(result.error || `Erreur lors de la sauvegarde`);
      }
    } catch {
      toast.error('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  /* ── Test handler ── */
  const handleTest = async () => {
    if (!initialMaskedKey && !apiKey) {
      toast.error('Aucune clé API configurée');
      return;
    }

    setTesting(true);
    try {
      const result = await onTest(serviceKey);

      if (result.success && result.result) {
        if (result.result.success) {
          toast.success(
            `${serviceName} : ${result.result.message} (${result.result.latencyMs}ms)`,
          );
          setStatus('ok');
        } else {
          toast.warning(
            `${serviceName} : ${result.result.message} (${result.result.latencyMs}ms)`,
          );
          setStatus('error');
        }
        setLastTested(new Date().toISOString());
      } else {
        toast.error(result.error || 'Erreur lors du test');
        setStatus('error');
      }
    } catch {
      toast.error('Erreur réseau lors du test');
      setStatus('error');
    } finally {
      setTesting(false);
    }
  };

  /* ── Status config ── */
  const statusConfig = getStatusConfig(status, isActive);
  const StatusIcon = statusConfig.icon;

  /* ── Format last tested date ── */
  const formatLastTested = (iso: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      className={`
        relative overflow-hidden rounded-2xl transition-all duration-300
        bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]
        ${isActive ? 'hover:border-white/[0.12] hover:bg-white/[0.04]' : 'opacity-60'}
      `}
    >
      {/* ── Top accent line ── */}
      <div className={`h-[2px] w-full ${statusConfig.dotClass} opacity-60 transition-colors duration-500`} />

      <div className="p-5 space-y-4">
        {/* ── Header: icon + name + status badge ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-shadow duration-500`}
            >
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {serviceName}
              </h3>
              <p className="text-[11px] text-[#64748b] leading-snug mt-0.5 line-clamp-2">
                {serviceDescription}
              </p>
            </div>
          </div>

          <Badge
            className={`shrink-0 text-[9px] font-semibold px-2 py-0.5 rounded-full border-0 flex items-center gap-1 ${statusConfig.badgeClass}`}
            aria-label={`Statut : ${statusConfig.label}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
            {statusConfig.label}
          </Badge>
        </div>

        {/* ── API Key input ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#64748b] uppercase tracking-wider font-medium flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Clé API
          </label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder={
                maskedKey
                  ? `${maskedKey}  (laisser vide pour conserver)`
                  : 'Entrez la clé API…'
              }
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              className="pr-10 bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 rounded-xl text-sm"
              aria-label={`Clé API pour ${serviceName}`}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#475569] hover:text-[#94a3b8] hover:bg-white/[0.06] transition-all"
              aria-label={showKey ? 'Masquer la clé' : 'Afficher la clé'}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── Base URL (optional) ── */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#64748b] uppercase tracking-wider font-medium flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            URL de base
            <span className="text-[#334155] normal-case">(optionnel)</span>
          </label>
          <Input
            type="url"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            className="bg-white/[0.04] border-white/[0.08] text-foreground placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 rounded-xl text-sm"
            aria-label={`URL de base pour ${serviceName}`}
          />
        </div>

        {/* ── Active toggle ── */}
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <span className="text-xs text-[#94a3b8] font-medium">
            Service actif
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={handleToggleActive}
            className={`
              relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              ${isActive ? 'bg-[#22c55e]/30 border-[#22c55e]/50' : 'bg-white/[0.08] border-white/[0.12]'}
            `}
          >
            <span
              className={`
                pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-all duration-300
                ${isActive
                  ? 'translate-x-5 bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                  : 'translate-x-0 bg-[#64748b]'
                }
              `}
            />
          </button>
        </div>

        {/* ── Last tested info ── */}
        {lastTested && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
            <RefreshCw className="w-3 h-3" />
            <span>Dernier test : {formatLastTested(lastTested)}</span>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`
              flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300
              ${hasChanges
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/25'
                : 'bg-white/[0.03] text-[#475569] border border-white/[0.06] cursor-not-allowed'
              }
            `}
            aria-label={`Enregistrer la configuration ${serviceName}`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTest}
            disabled={testing}
            className="
              inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold
              bg-white/[0.03] text-[#94a3b8] border border-white/[0.06]
              hover:bg-white/[0.06] hover:text-foreground hover:border-white/[0.12]
              transition-all duration-300 disabled:opacity-40
            "
            aria-label={`Tester la connexion ${serviceName}`}
          >
            {testing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {testing ? 'Test…' : 'Tester'}
          </motion.button>
        </div>

        {/* ── Unsaved changes indicator ── */}
        {hasChanges && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#eab308]">
            <AlertTriangle className="w-3 h-3" />
            <span>Modifications non enregistrées</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
