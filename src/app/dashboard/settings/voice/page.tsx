"use client";

import { useState, useEffect } from "react";
import { Volume2, Mic, CheckCircle2, RefreshCw } from "lucide-react";
import { ASSISTANT_CONFIG, isValidAssistantName, type AssistantName } from "@/lib/config";

export default function VoiceSettingsPage() {
  const [selectedName, setSelectedName] = useState<string>(ASSISTANT_CONFIG.defaultName);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const names = ASSISTANT_CONFIG.availableNames as readonly string[];

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSave = async () => {
    setLoading(true);
    // Simulate save — in production would call server action
    await new Promise(r => setTimeout(r, 500));
    setSuccess(`Assistant renommé en "${selectedName}"`);
    setLoading(false);
  };

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
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 min-h-[48px]"
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
