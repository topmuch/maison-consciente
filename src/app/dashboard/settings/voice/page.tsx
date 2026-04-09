"use client";

import { useState, useEffect, useCallback } from "react";
import { Volume2, Mic, CheckCircle2, RefreshCw } from "lucide-react";
import { ASSISTANT_CONFIG, type AssistantName } from "@/lib/config";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════
   VOICE SETTINGS PAGE — Real DB Persistence

   Saves assistant name and wake word preference to
   Household.voiceSettings via the /api/household/settings endpoint.
   ═══════════════════════════════════════════════════════ */

interface VoiceSettings {
  enabled: boolean;
  rate: number;
  volume: number;
  language: string;
  conversationWindow: number;
  assistantName: string;
  wakeWordEnabled: boolean;
}

export default function VoiceSettingsPage() {
  const [selectedName, setSelectedName] = useState<string>(ASSISTANT_CONFIG.defaultName);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const names = ASSISTANT_CONFIG.availableNames as readonly string[];

  // Clear success notification after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Load existing settings from DB on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/household/settings");
        if (res.ok) {
          const data = await res.json();
          const voiceSettings: Partial<VoiceSettings> = data.voiceSettings || {};
          if (voiceSettings.assistantName) {
            setSelectedName(voiceSettings.assistantName);
          }
          if (typeof voiceSettings.wakeWordEnabled === "boolean") {
            setWakeWordEnabled(voiceSettings.wakeWordEnabled);
          }
        }
      } catch (err) {
        console.warn("[VoiceSettings] Could not load settings:", err);
      } finally {
        setIsInitialized(true);
      }
    }
    loadSettings();
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      // Get current household settings
      const res = await fetch("/api/household/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();

      // Merge voice settings
      const currentVoiceSettings: Partial<VoiceSettings> = data.voiceSettings || {};
      const updatedVoiceSettings: VoiceSettings = {
        enabled: currentVoiceSettings.enabled ?? true,
        rate: currentVoiceSettings.rate ?? 1.05,
        volume: currentVoiceSettings.volume ?? 0.8,
        language: currentVoiceSettings.language ?? "fr-FR",
        conversationWindow: currentVoiceSettings.conversationWindow ?? 10,
        assistantName: selectedName,
        wakeWordEnabled: wakeWordEnabled,
      };

      // Save to DB via PATCH
      const patchRes = await fetch("/api/household/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceSettings: updatedVoiceSettings,
        }),
      });

      if (!patchRes.ok) throw new Error("Failed to save settings");

      setSuccess(`Assistant renommé en "${selectedName}"`);
      toast.success(`Paramètres vocaux sauvegardés`);
    } catch (err) {
      console.error("[VoiceSettings] Save error:", err);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }, [selectedName, wakeWordEnabled]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Volume2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-amber-100">Paramètres Vocaux</h1>
            <p className="text-sm text-slate-400 mt-1">Personnalisez votre assistant Maellis</p>
          </div>
        </div>

        {/* Name Selection */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-serif text-amber-200 flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            Nom de l&apos;assistant
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {names.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedName(name)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  selectedName === name
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-slate-900/60 border-white/[0.06] text-slate-400 hover:border-white/20"
                }`}
              >
                <p className="font-serif text-lg">{name}</p>
                {selectedName === name && (
                  <CheckCircle2 className="w-4 h-4 mx-auto mt-2 text-amber-400" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 min-h-[48px] transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}
        </div>

        {/* Wake Word Toggle */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-serif text-amber-200">Mot de réveil</h2>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-white/[0.06]">
            <div>
              <p className="font-medium text-slate-200">Activation automatique</p>
              <p className="text-xs text-slate-500 mt-1">
                Dites &quot;{selectedName}&quot; pour activer l&apos;assistant sans toucher le bouton
              </p>
            </div>
            <button
              onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
              className={`w-14 h-7 rounded-full transition-colors relative ${wakeWordEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
              role="switch"
              aria-checked={wakeWordEnabled}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${wakeWordEnabled ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Informations</h3>
          <ul className="space-y-2 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Le nom est utilisé pour le mot de réveil et les notifications vocales.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Le mot de réveil fonctionne en arrière-plan lorsque la tablette est allumée.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400/50 mt-0.5">•</span>
              Vous pouvez aussi appuyer longuement sur le bouton micro pour parler.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
