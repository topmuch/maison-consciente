'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SmartphoneNfc,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Nfc,
  ArrowRight,
} from 'lucide-react';
import { useVoiceResponse } from '@/hooks/useVoiceResponse';
import { pairNFCZone, type PairNFCResult } from '@/actions/nfc-pairing';

interface NFCPairingProps {
  zones: { id: string; name: string; nfcUid?: string | null }[];
  onPaired?: () => void;
}

type PairingStep = 'idle' | 'select-zone' | 'scanning' | 'success' | 'error';

// WebNFC types (not in TypeScript DOM lib by default)
interface NDEFReader {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
}

declare global {
  interface Window {
    NDEFReader: new () => NDEFReader;
  }
}

function checkNfcSupport(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function NFCPairing({ zones, onPaired }: NFCPairingProps) {
  const [step, setStep] = useState<PairingStep>('idle');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [nfcUid, setNfcUid] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSupported] = useState(checkNfcSupport);
  const { speak, isSpeaking } = useVoiceResponse();

  const startPairing = useCallback(() => {
    if (!isSupported) {
      setError('NFC non supporté sur cet appareil. Utilisez Chrome sur Android.');
      speak('NFC non supporté sur cet appareil');
      return;
    }
    if (!selectedZoneId) {
      setError('Veuillez sélectionner une zone');
      return;
    }

    setStep('select-zone');
    speak('Activez le NFC et approchez le tag');
  }, [isSupported, selectedZoneId, speak]);

  const handlePair = useCallback(async (uid: string) => {
    try {
      const result: PairNFCResult = await pairNFCZone(selectedZoneId, uid);
      if (result.success) {
        setStep('success');
        const zoneName = zones.find(z => z.id === selectedZoneId)?.name || 'Zone';
        speak(`Appairage réussi. Tag associé à ${zoneName}`);
        onPaired?.();
      } else {
        setStep('error');
        setError(result.error || "Erreur lors de l'appairage");
        speak(result.error || 'Erreur lors de l\'appairage');
      }
    } catch {
      setStep('error');
      setError('Erreur serveur');
    }
  }, [selectedZoneId, zones, speak, onPaired]);

  const beginScan = useCallback(async () => {
    setStep('scanning');
    setError('');
    speak('Approchez le tag NFC');

    try {
      const reader = new window.NDEFReader();
      const controller = new AbortController();

      // Set a 30-second timeout
      const timer = setTimeout(() => {
        controller.abort();
        setStep('error');
        setError('Délai dépassé. Réessayez.');
        speak('Délai dépassé. Réessayez.');
      }, 30000);

      reader.onreading = (event: { serialNumber: string }) => {
        clearTimeout(timer);
        controller.abort();
        const uid = event.serialNumber.replace(/:/g, '').toLowerCase();
        setNfcUid(uid);
        handlePair(uid);
      };

      reader.onerror = () => {
        clearTimeout(timer);
        setStep('error');
        setError('Erreur de lecture NFC');
      };

      await reader.scan({ signal: controller.signal });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur NFC';
      setStep('error');
      setError(msg.includes('permission') ? 'Permission NFC refusée' : msg);
      speak('Erreur NFC. Vérifiez les permissions.');
    }
  }, [speak, handlePair]);

  const reset = () => {
    setStep('idle');
    setSelectedZoneId('');
    setNfcUid('');
    setError('');
  };

  const availableZones = zones.filter(z => !z.nfcUid);

  // Not supported fallback
  if (!isSupported) {
    return (
      <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f87171]/10 border border-[#f87171]/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#f87171]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">
              Appairage NFC
            </h3>
            <p className="text-xs text-[#64748b]">Non disponible sur cet appareil</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#f87171]/5 border border-[#f87171]/10">
          <p className="text-sm text-[#94a3b8] leading-relaxed">
            Le WebNFC nécessite <span className="text-[#e2e8f0] font-medium">Chrome sur Android</span> avec le NFC activé.
            iOS, Firefox et les navigateurs desktop ne supportent pas cette fonctionnalité.
          </p>
          <p className="text-xs text-[#64748b] mt-2">
            Alternative : vous pouvez associer manuellement un tag NFC via son UID dans les paramètres de zone.
          </p>
        </div>
      </div>
    );
  }

  const stepConfig = [
    { label: 'Zone', icon: Nfc },
    { label: 'Scan', icon: SmartphoneNfc },
    { label: 'Validé', icon: CheckCircle2 },
  ];

  const currentStepIndex = step === 'idle' || step === 'select-zone' ? 0
    : step === 'scanning' ? 1
    : step === 'success' ? 2 : -1;

  return (
    <div className="glass rounded-2xl inner-glow border-white/[0.06] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-tertiary)]/10 border border-[var(--accent-tertiary)]/20 flex items-center justify-center">
          <SmartphoneNfc className="w-5 h-5 text-[var(--accent-tertiary)]" />
        </div>
        <div>
          <h3 className="text-base font-serif font-semibold text-[#e2e8f0]">
            Appairage NFC
          </h3>
          <p className="text-xs text-[#64748b]">Associez un tag NFC à une zone</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 px-2">
        {stepConfig.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = i === currentStepIndex;
          const isDone = i < currentStepIndex;
          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive ? 'oklch(0.60 0.22 280 / 20%)' : isDone ? 'oklch(0.65 0.18 160 / 15%)' : 'oklch(1 0 0 / 4%)',
                  borderColor: isActive ? 'oklch(0.60 0.22 280 / 40%)' : isDone ? 'oklch(0.65 0.18 160 / 30%)' : 'oklch(1 0 0 / 8%)',
                }}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <StepIcon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-tertiary)]' : 'text-[#475569]'}`} />
                )}
              </motion.div>
              <span className={`text-xs font-medium ${isActive ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
                {s.label}
              </span>
              {i < stepConfig.length - 1 && (
                <div className={`flex-1 h-px ${i < currentStepIndex ? 'bg-emerald-500/30' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Zone selection */}
        {(step === 'idle' || step === 'select-zone' || step === 'error') && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <p className="text-sm text-[#94a3b8]">Sélectionnez la zone à associer :</p>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-luxe">
              {availableZones.length > 0 ? (
                availableZones.map((zone) => (
                  <motion.button
                    key={zone.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 text-left ${
                      selectedZoneId === zone.id
                        ? 'border-[var(--accent-tertiary)]/40 bg-[var(--accent-tertiary)]/[0.06]'
                        : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedZoneId === zone.id ? 'bg-[var(--accent-tertiary)]' : 'bg-[#475569]'}`} />
                    <span className="text-sm text-[#e2e8f0]">{zone.name}</span>
                    {zone.nfcUid && (
                      <span className="text-[10px] text-[#475569] ml-auto font-mono">{zone.nfcUid}</span>
                    )}
                  </motion.button>
                ))
              ) : (
                <p className="text-xs text-[#475569] text-center py-4">
                  Toutes les zones sont déjà associées à un tag NFC.
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-[#f87171]/5 border border-[#f87171]/10"
              >
                <XCircle className="w-4 h-4 text-[#f87171] shrink-0" />
                <p className="text-xs text-[#f87171]">{error}</p>
              </motion.div>
            )}

            <div className="flex gap-2">
              {step === 'error' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[#94a3b8] hover:text-[#e2e8f0] transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recommencer
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startPairing}
                disabled={!selectedZoneId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-gold text-[#0a0a12] text-sm font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] transition-all disabled:opacity-50"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Scanning */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-8 space-y-4"
          >
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: ['0 0 20px oklch(0.60 0.22 280 / 15%)', '0 0 40px oklch(0.60 0.22 280 / 30%)', '0 0 20px oklch(0.60 0.22 280 / 15%)'],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-2xl bg-[var(--accent-tertiary)]/10 border border-[var(--accent-tertiary)]/20 flex items-center justify-center"
            >
              <SmartphoneNfc className="w-10 h-10 text-[var(--accent-tertiary)]" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#e2e8f0]">En attente du tag NFC…</p>
              <p className="text-xs text-[#64748b] mt-1">Approchez votre tag NFC de l'appareil</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="text-xs text-[#64748b] hover:text-[#e2e8f0] underline underline-offset-2 transition-colors"
            >
              Annuler
            </motion.button>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-6 space-y-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#e2e8f0]">Appairage réussi !</p>
              <p className="text-xs text-[#64748b] mt-1">
                Tag <span className="font-mono text-[#94a3b8]">{nfcUid.slice(0, 12)}…</span> associé
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-gold text-[#0a0a12] text-sm font-semibold shadow-[0_0_16px_var(--accent-primary-glow)] transition-all mt-2"
            >
              <RefreshCw className="w-4 h-4" />
              Associer un autre tag
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
