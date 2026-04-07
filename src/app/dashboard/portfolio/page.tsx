"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Settings, BarChart3, Users, Wifi } from "lucide-react";
import Link from "next/link";

interface Household {
  id: string;
  name: string;
  type: string;
  displayToken: string | null;
  displayEnabled: boolean;
  subscriptionPlan: string;
  whatsappNumber: string | null;
  createdAt: string;
}

export default function PortfolioPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/households");
        if (res.ok) {
          const data = await res.json();
          setHouseholds(Array.isArray(data) ? data : data.households || []);
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-amber-100">Mes Logements</h1>
              <p className="text-sm text-slate-400 mt-1">Gérez vos propriétés et tablettes</p>
            </div>
          </div>
          <Link
            href="/api/households/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl text-sm font-medium transition-all min-h-[48px]"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-2xl font-serif text-amber-200">{households.length}</p>
            <p className="text-xs text-slate-500 mt-1">Logements</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-2xl font-serif text-emerald-300">{households.filter(h => h.displayEnabled).length}</p>
            <p className="text-xs text-slate-500 mt-1">Tablettes actives</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-2xl font-serif text-cyan-300">{households.filter(h => h.type === "hospitality").length}</p>
            <p className="text-xs text-slate-500 mt-1">Mode Hospitalité</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-2xl font-serif text-violet-300">{households.filter(h => h.subscriptionPlan !== "free").length}</p>
            <p className="text-xs text-slate-500 mt-1">Abonnements actifs</p>
          </div>
        </div>

        {/* Household Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">Chargement...</div>
        ) : households.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500">
            <Building2 className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg">Aucun logement configuré</p>
            <p className="text-sm text-slate-600 mt-1">Ajoutez votre premier logement pour commencer</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {households.map((h) => (
              <div key={h.id} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-amber-500/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${h.displayEnabled ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                      <Building2 className={`w-5 h-5 ${h.displayEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-100">{h.name || 'Sans nom'}</h3>
                      <p className="text-xs text-slate-500 capitalize">{h.type === 'hospitality' ? 'Hospitalité' : 'Maison'}</p>
                    </div>
                  </div>
                  <Link href={`/dashboard/settings?household=${h.id}`} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tablette</span>
                    <span className={`flex items-center gap-1.5 ${h.displayEnabled ? 'text-emerald-400' : 'text-slate-600'}`}>
                      <Wifi className="w-3 h-3" />
                      {h.displayEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Abonnement</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      h.subscriptionPlan === 'free' ? 'bg-slate-500/10 text-slate-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {h.subscriptionPlan === 'free' ? 'Gratuit' : h.subscriptionPlan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">WhatsApp</span>
                    <span className="text-slate-400">{h.whatsappNumber || 'Non configuré'}</span>
                  </div>
                </div>

                {h.displayEnabled && h.displayToken && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <Link
                      href={`/display/${h.displayToken}`}
                      target="_blank"
                      className="flex items-center gap-2 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                    >
                      <BarChart3 className="w-3 h-3" />
                      Voir la tablette
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
