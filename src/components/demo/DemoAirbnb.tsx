'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, QrCode, Clock, Sun, Thermometer, MapPin,
  MessageCircle, Phone, ShieldAlert, ChevronRight,
  Star, Heart, CalendarCheck, CalendarX, Info,
  Key, Utensils, Car, Sparkles,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { ActivityCard } from './ActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { airbnbConfig, currentDemoTime } from '@/lib/mock-data-real';

interface DemoAirbnbProps {
  onBack: () => void;
}

function QRCodeDisplay() {
  // Generate a simple QR-code-like pattern using SVG
  const size = 8;
  const cells: boolean[][] = [];
  
  // Deterministic pattern based on WiFi info
  const seed = airbnbConfig.wifi.network + airbnbConfig.wifi.password;
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      // Create a QR-like pattern
      const isCorner = (x < 2 && y < 2) || (x >= size - 2 && y < 2) || (x < 2 && y >= size - 2);
      const isBorder = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isCenter = x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const pseudoRandom = ((seed.charCodeAt(y * size + x % seed.length) || 7) * 31 + x * 17 + y * 13) % 5 > 2;
      cells[y][x] = isCorner || isBorder || isCenter || pseudoRandom;
    }
  }

  return (
    <svg viewBox={`0 0 ${size * 10 + 20} ${size * 10 + 20}`} className="w-full h-full">
      <rect width="100%" height="100%" fill="white" rx="4" />
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${x}-${y}`}
              x={x * 10 + 10}
              y={y * 10 + 10}
              width="8"
              height="8"
              fill="#1e293b"
              rx="1"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export function DemoAirbnb({ onBack }: DemoAirbnbProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'welcome' | 'wifi' | 'activities' | 'services'>('welcome');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 rounded-lg bg-white/[0.04]" />
            <Skeleton className="h-6 w-40 rounded-full bg-white/[0.04]" />
          </div>
          <Skeleton className="h-36 w-full rounded-2xl bg-white/[0.04]" />
          <div className="flex gap-2">
            {['Bienvenue', 'WiFi', 'Activités', 'Services'].map((t) => (
              <Skeleton key={t} className="h-8 w-24 rounded-lg bg-white/[0.04]" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-2xl bg-white/[0.04]" />
            <Skeleton className="h-48 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DemoLayout
      title={`Villa Azur — ${airbnbConfig.location}`}
      subtitle={`Voyageur : ${airbnbConfig.guest.name} | ${currentDemoTime.date}`}
      onBack={onBack}
    >
      {/* Weather + Check-in/out bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] border border-amber-500/10 text-center">
          <span className="text-2xl">{airbnbConfig.weather.icon}</span>
          <p className="text-lg font-semibold text-white mt-1">{airbnbConfig.weather.temp}</p>
          <p className="text-[10px] text-slate-500">{airbnbConfig.weather.condition}</p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
          <CalendarCheck className="w-5 h-5 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-white mt-1">Check-in</p>
          <p className="text-[10px] text-slate-500">{airbnbConfig.guest.checkin}</p>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/10 text-center">
          <CalendarX className="w-5 h-5 text-rose-400 mx-auto" />
          <p className="text-xs font-semibold text-white mt-1">Check-out</p>
          <p className="text-[10px] text-slate-500">{airbnbConfig.guest.checkout}</p>
        </div>
        <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/10 text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto" />
          <p className="text-xs font-semibold text-white mt-1">Durée</p>
          <p className="text-[10px] text-slate-500">{airbnbConfig.guest.nights} nuit{airbnbConfig.guest.nights > 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { key: 'welcome' as const, label: 'Bienvenue', icon: Info },
          { key: 'wifi' as const, label: 'WiFi', icon: Wifi },
          { key: 'activities' as const, label: 'Activités', icon: MapPin },
          { key: 'services' as const, label: 'Services', icon: Star },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.05]'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* WELCOME TAB */}
      {activeTab === 'welcome' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Welcome message */}
          <div className="bg-gradient-to-br from-blue-500/[0.06] to-indigo-500/[0.04] border border-blue-500/10 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                🏠
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-white mb-2">
                  Bienvenue {airbnbConfig.guest.name} !
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {airbnbConfig.welcomeMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* House rules */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="p-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Info className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Règles de la maison</h3>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {airbnbConfig.houseRules.map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                    <p className="text-xs text-slate-300">{rule}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Emergency contacts */}
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
              <div className="p-4 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Contacts d&apos;urgence</h3>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {airbnbConfig.emergencyContacts.map((contact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{contact.icon}</span>
                      <div>
                        <p className="text-xs font-medium text-slate-200">{contact.label}</p>
                        <p className="text-[10px] text-slate-500">{contact.number}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${contact.number.replace(/\s/g, '')}`}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                ))}
              </div>

              {/* SOS Button */}
              <div className="p-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-red-500/20 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:from-rose-500/30 hover:to-red-500/30 transition-all"
                >
                  <ShieldAlert className="w-4 h-4" />
                  SOS Urgence
                </motion.button>
              </div>
            </div>
          </div>

          {/* WhatsApp host contact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-emerald-500/[0.06] to-teal-500/[0.04] border border-emerald-500/10 rounded-2xl p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Contacter {airbnbConfig.hostName}</p>
                <p className="text-[10px] text-slate-500">Réponse rapide via WhatsApp</p>
              </div>
            </div>
            <a
              href="https://wa.me/33612345678?text=Bonjour, je suis Sophie, votre invitée à la Villa Azur."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
              <ChevronRight className="w-3 h-3" />
            </a>
          </motion.div>
        </motion.div>
      )}

      {/* WIFI TAB */}
      {activeTab === 'wifi' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto space-y-6"
        >
          {/* QR Code card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="p-2 rounded-xl bg-cyan-500/10">
                <QrCode className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">WiFi — Scannez le QR Code</h3>
            </div>

            {/* QR Code */}
            <div className="inline-flex p-4 bg-white rounded-2xl mb-4">
              <div className="w-40 h-40">
                <QRCodeDisplay />
              </div>
            </div>

            <p className="text-[10px] text-slate-600 mb-4">Scannez avec votre téléphone pour vous connecter automatiquement</p>
          </div>

          {/* WiFi credentials */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Réseau</p>
                    <p className="text-sm font-medium text-white">{airbnbConfig.wifi.network}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(airbnbConfig.wifi.network)}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 hover:bg-white/[0.06] transition-all"
                >
                  Copier
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Mot de passe</p>
                    <p className="text-sm font-medium text-white">{airbnbConfig.wifi.password}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(airbnbConfig.wifi.password)}
                  className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 hover:bg-white/[0.06] transition-all"
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 mr-1">Filtrer :</span>
            {['Tous', ...new Set(airbnbConfig.activities.map((a) => a.category))].map((cat) => (
              <span
                key={cat}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.04] border border-white/[0.06] text-slate-400 cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Activity cards */}
          <div className="space-y-3">
            {airbnbConfig.activities.map((activity, i) => (
              <ActivityCard key={activity.id} activity={activity} index={i} />
            ))}
          </div>

          {/* Local guide CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-blue-500/[0.06] to-indigo-500/[0.04] border border-blue-500/10 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-white">Guide local complet</p>
              <p className="text-[10px] text-slate-500">Restaurants, plages, nightlife et plus encore</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
              <Sparkles className="w-3 h-3" />
              Bientôt
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* SERVICES TAB */}
      {activeTab === 'services' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl space-y-6"
        >
          {/* Services grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {airbnbConfig.services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-amber-500/20 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{service.icon}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">{service.name}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
                  <span className="text-base font-serif font-bold text-amber-400">{service.price}</span>
                  <a
                    href="https://wa.me/33612345678?text=Bonjour, je souhaite commander le service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium hover:bg-emerald-500/20 transition-all"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Commander
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {/* All services note */}
          <div className="text-center p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <p className="text-[10px] text-slate-500">
              Tous les services sont payables sur place ou via le lien de paiement envoyé par WhatsApp. 
              <br />
              <span className="text-slate-600">Les partenaires Maellis garantissent qualité et ponctualité.</span>
            </p>
          </div>
        </motion.div>
      )}
    </DemoLayout>
  );
}
