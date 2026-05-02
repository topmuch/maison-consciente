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
      badgeClass: 'bg-muted/80 text-muted-foreground',
      dotClass: 'bg-muted-foreground',
    };
  }
  switch (status) {
    case 'ok':
      return {
        label: 'Configuré',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-500/10 text-emerald-500',
        dotClass: 'bg-emerald-500',
      };
    case 'error':
      return {
        label: 'Erreur',
        icon: XCircle,
        badgeClass: 'bg-red-500/10 text-red-500',
        dotClass: 'bg-red-500',
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
        badgeClass: 'bg-muted/80 text-muted-foreground',
        dotClass: 'bg-muted-foreground',
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
        bg-muted/40 backdrop-blur-xl border border-border
        ${isActive ? 'hover:border-border hover:bg-muted/50' : 'opacity-60'}
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
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
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
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
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
              className="pr-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-[var(--accent-primary)]/40 rounded-xl text-sm"
              aria-label={`Clé API pour ${serviceName}`}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted transition-all"
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
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            URL de base
            <span className="text-muted-foreground/50 normal-case">(optionnel)</span>
          </label>
          <Input
            type="url"
            placeholder="https://api.example.com"
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 focus:border-[var(--accent-primary)]/40 rounded-xl text-sm"
            aria-label={`URL de base pour ${serviceName}`}
          />
        </div>

        {/* ── Active toggle ── */}
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30 border border-border">
          <span className="text-xs text-muted-foreground font-medium">
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
              ${isActive ? 'bg-emerald-500/30 border-emerald-500/50' : 'bg-muted border-border'}
            `}
          >
            <span
              className={`
                pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-all duration-300
                ${isActive
                  ? 'translate-x-5 bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                  : 'translate-x-0 bg-muted-foreground'
                }
              `}
            />
          </button>
        </div>

        {/* ── Last tested info ── */}
        {lastTested && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
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
                : 'bg-muted/40 text-muted-foreground/70 border border-border cursor-not-allowed'
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
              bg-muted/40 text-muted-foreground border border-border
              hover:bg-muted hover:text-foreground hover:border-border
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
