"use client";

/* ═══════════════════════════════════════════════════════
   ThemeEditor — Visual Theme Configuration Panel
   
   Allows changing tablet accent color and uploading a
   custom background image. Live preview before saving.
   Dark Luxe glassmorphism styling.
   ═══════════════════════════════════════════════════════ */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Palette, Upload, RefreshCw, ImagePlus, Check, X } from "lucide-react";

interface Props {
  householdId: string;
  current: { accent: string; bgUrl?: string };
  onUpdate: (config: { accent: string; bgUrl?: string }) => Promise<{ success: boolean; error?: string }>;
}

const PRESET_ACCENTS = [
  { name: "Or", value: "#fbbf24" },
  { name: "Rose", value: "#f472b6" },
  { name: "Émeraude", value: "#34d399" },
  { name: "Cyan", value: "#22d3ee" },
  { name: "Violet", value: "#a78bfa" },
  { name: "Corail", value: "#fb923c" },
];

export default function ThemeEditor({ householdId, current, onUpdate }: Props) {
  const [accent, setAccent] = useState(current.accent || "#fbbf24");
  const [preview, setPreview] = useState<string | null>(current.bgUrl || null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image trop volumineuse (max 5 Mo)");
        return;
      }

      const url = URL.createObjectURL(file);
      setPreview(url);
      setSaved(false);
      setError(null);
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    multiple: false,
  });

  const clearBackground = () => {
    setPreview(null);
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const result = await onUpdate({
      accent,
      bgUrl: preview || undefined,
    });
    setLoading(false);

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || "Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-amber-100 flex items-center gap-2">
          <Palette className="w-5 h-5 text-amber-500" />
          Éditeur de Thème
        </h3>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-400">
            <Check className="w-4 h-4" /> Appliqué
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Color Picker */}
        <div className="space-y-3">
          <label className="block text-sm text-slate-400">
            Couleur d&apos;accent
          </label>

          {/* Native color picker */}
          <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/10">
            <div className="relative">
              <input
                type="color"
                value={accent}
                onChange={(e) => {
                  setAccent(e.target.value);
                  setSaved(false);
                }}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
            </div>
            <code className="text-sm font-mono text-amber-300">{accent}</code>
          </div>

          {/* Preset swatches */}
          <div className="flex flex-wrap gap-2">
            {PRESET_ACCENTS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setAccent(preset.value);
                  setSaved(false);
                }}
                className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                  accent === preset.value
                    ? "border-white scale-110 shadow-lg"
                    : "border-white/20 hover:border-white/40"
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={`Couleur ${preset.name}`}
              />
            ))}
          </div>
        </div>

        {/* Background Upload */}
        <div className="space-y-3">
          <label className="block text-sm text-slate-400">
            Arrière-plan personnalisé
          </label>

          {!preview ? (
            <div
              {...getRootProps()}
              className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all min-h-[120px] flex flex-col items-center justify-center ${
                isDragActive
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-white/10 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />
              <ImagePlus className="w-8 h-8 mx-auto mb-2 text-slate-500" />
              <p className="text-sm text-slate-300">
                {isDragActive ? "Déposez l'image ici" : "Glissez une image ou cliquez"}
              </p>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP — Max 5 Mo</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-white/10 h-[120px]">
              <img
                src={preview}
                alt="Aperçu du fond"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={clearBackground}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-500/30 text-white transition-colors"
                aria-label="Supprimer l'image de fond"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2">
                <span className="text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-md">
                  Fond personnalisé
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-48 bg-slate-900">
        <div
          className="absolute inset-0"
          style={preview ? { backgroundImage: `url(${preview})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/60 px-6 py-3 rounded-xl backdrop-blur-md text-center">
            <p className="text-2xl font-serif" style={{ color: accent }}>
              Aperçu en direct
            </p>
            <p className="text-xs text-slate-400 mt-1">Maison Consciente</p>
          </div>
        </div>
        {/* Simulated ambient glow */}
        <div
          className="absolute top-4 left-4 w-32 h-32 rounded-full blur-[80px] opacity-30"
          style={{ backgroundColor: accent }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
                   disabled:opacity-50 disabled:pointer-events-none text-white py-3 rounded-xl
                   font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {loading ? (
          <>
            <RefreshCw className="animate-spin w-4 h-4" />
            Application…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Appliquer le thème
          </>
        )}
      </button>
    </div>
  );
}
