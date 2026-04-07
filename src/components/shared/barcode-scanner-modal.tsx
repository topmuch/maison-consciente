"use client";

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — BarcodeScannerModal
   Modal plein écran pour scanner un code-barres.
   Recherche auto dans OpenFoodFacts.
   ═══════════════════════════════════════════════════════ */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Loader2, Package } from "lucide-react";
import { useBarcodeScanner, type BarcodeScanResult } from "@/hooks/useBarcodeScanner";

interface BarcodeScannerModalProps {
  onClose: () => void;
  onResult: (code: string, name: string, barcode?: string, category?: string | null) => void;
}

export default function BarcodeScannerModal({ onClose, onResult }: BarcodeScannerModalProps) {
  const [isStarting, setIsStarting] = useState(true);
  const [lastResult, setLastResult] = useState<BarcodeScanResult | null>(null);

  const handleScan = (result: BarcodeScanResult) => {
    setLastResult(result);
    const name = result.productName || `Produit (${result.code.slice(-4)})`;
    onResult(result.code, name, result.code, result.category);
  };

  const { containerId, isScanning, error, startScanning, stopScanning } =
    useBarcodeScanner(handleScan);

  // Auto-start scanning
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanning().then(() => setIsStarting(false)).catch(() => setIsStarting(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [startScanning]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-serif text-amber-50">Scanner le code-barres</h3>
          </div>
          <p className="text-sm text-[#64748b]">
            Pointez la caméra vers le code-barres du produit
          </p>
        </motion.div>

        {/* Scanner container */}
        <div className="relative w-full max-w-md mx-4">
          <div className="rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-black">
            <div
              id={containerId}
              className="w-full"
              style={{ minHeight: "280px" }}
            />
          </div>

          {/* Loading state */}
          {isStarting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm text-[#64748b]">Activation de la caméra...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl">
              <Camera className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-sm text-red-400 mb-1">{error}</p>
              <p className="text-xs text-[#64748b]">
                Vérifiez les permissions de la caméra
              </p>
              <button
                onClick={() => startScanning()}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Last result */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-3 px-5 py-3 rounded-xl glass-gold"
            >
              <Package className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm text-amber-50 font-medium">
                  {lastResult.productName || `Code: ${lastResult.code}`}
                </p>
                {lastResult.brand && (
                  <p className="text-xs text-[#64748b]">{lastResult.brand}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning indicator */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-amber-400"
              />
              <span className="text-xs text-[#64748b]">Recherche en cours...</span>
            </div>
          </motion.div>
        )}

        {/* Manual fallback hint */}
        <p className="mt-6 text-xs text-[#64748b] text-center max-w-xs">
          Astuce: Utilisez le champ de saisie manuel si le scan ne fonctionne pas
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
