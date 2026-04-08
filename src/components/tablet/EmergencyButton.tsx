"use client";

import { AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";

interface EmergencyButtonProps {
  hostWhatsapp: string | null;
  householdName: string;
}

export default function EmergencyButton({ hostWhatsapp, householdName }: EmergencyButtonProps) {
  const [activated, setActivated] = useState(false);

  const handleEmergency = useCallback(() => {
    if (confirm("⚠️ URGENCE : Voulez-vous vraiment alerter l'hôte et les secours ?")) {
      setActivated(true);

      // Open WhatsApp with pre-filled emergency message
      if (hostWhatsapp) {
        const msg = `URGENCE au logement "${householdName}". J'ai besoin d'une aide immédiate.`;
        window.open(
          `https://wa.me/${hostWhatsapp}?text=${encodeURIComponent(msg)}`,
          "_blank"
        );
      }

      // Visual feedback — reset after 5 seconds
      setTimeout(() => setActivated(false), 5000);
    }
  }, [hostWhatsapp, householdName]);

  return (
    <button
      onClick={handleEmergency}
      className={`fixed bottom-8 left-8 z-50 p-5 rounded-full shadow-2xl border-4 transition-all duration-300 group ${
        activated
          ? "bg-red-600 border-red-400 animate-pulse scale-110"
          : "bg-red-900/80 border-red-700/60 hover:bg-red-700 hover:border-red-500 hover:scale-105"
      }`}
      aria-label="Bouton d'urgence"
    >
      <AlertTriangle
        className={`w-9 h-9 transition-transform duration-300 ${
          activated ? "text-white animate-bounce" : "text-red-200 group-hover:text-white"
        }`}
      />

      {/* Tooltip on hover */}
      {!activated && (
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-red-400 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-red-500/20">
          Urgence
        </span>
      )}

      {/* Activated alert badge */}
      {activated && (
        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shadow-lg animate-bounce">
          ALERTE ENVOYÉE !
        </span>
      )}
    </button>
  );
}
