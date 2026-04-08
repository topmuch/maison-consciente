'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, QrCode, MapPin, Star, MessageCircle, Phone,
  ShieldAlert, Clock, CalendarCheck, CalendarX, Info,
  Key, Utensils, Car, Sparkles, ChevronRight,
} from 'lucide-react';
import { DemoLayout } from './DemoLayout';
import { useMaellisVoice } from '@/hooks/useMaellisVoice';
import { airbnbConfig, currentDemoTime } from '@/lib/mock-data-real';

interface DemoAirbnbProps {
  onBack: () => void;
}

type AirbnbTab = 'welcome' | 'wifi' | 'activities' | 'services';

/* ─── Simple QR Code Pattern (SVG) ─── */
function QRCodeDisplay() {
  const size = 8;
  const cells: boolean[][] = [];
  const seed = airbnbConfig.wifi.network + airbnbConfig.wifi.password;

  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const isCorner = (x < 2 && y < 2) || (x >= size - 2 && y < 2) || (x < 2 && y >= size - 2);
      const isBorder = x === 0 || x === size - 1 || y === 0 || y === size - 1;
      const isCenter = x === Math.floor(size / 2) && y === Math.floor(size / 2);
      const pseudoRandom = ((seed.charCodeAt(y * size + (x % seed.length)) || 7) * 31 + x * 17 + y * 13) % 5 > 2;
      cells[y][x] = isCorner || isBorder || isCenter || pseudoRandom;
    }
  }

  return (
    <svg viewBox={`0 0 ${size * 10 + 20} ${size * 10 + 20}`} className="w-full h-full">
      <rect width="100%" height="100%" fill="white" rx="4" />
      {cells.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect key={`${x}-${y}`} x={x * 10 + 10} y={y * 10 + 10} width="8" height="8" fill="#1e293b" rx="1" />
          ) : null
        )
      )}
    </svg>
  );
}

export function DemoAirbnb({ onBack }: DemoAirbnbProps) {
  const { speak, isSpeaking } = useMaellisVoice();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AirbnbTab>('welcome');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // ── Voice Handlers ──
  const handleWelcomeClick = () => {
    speak(`Bienvenue ${airbnbConfig.guest.name} ! ${airbnbConfig.welcomeMessage}`);
  };

  const handleWifiClick = () => {
    speak(
      `Pour vous connecter au WiFi, choisissez le réseau ${airbnbConfig.wifi.network}. Le mot de passe est ${airbnbConfig.wifi.password}. Vous pouvez aussi scanner le QR code avec votre téléphone.`
    );
  };

  const handleActivityClick = (name: string, description: string, duration: string) => {
    speak(`${name}. ${description}. Durée : ${duration}.`);
  };

  const handleServiceClick = (name: string, price: string) => {
    speak(`Service : ${name}. Prix : ${price}. Pour commander, contactez votre hôte via WhatsApp.`);
  };

  const handleRuleClick = (rule: string) => {
    speak(rule);
  };

  const handleEmergencyClick = (label: string, number: string) => {
    speak(`Pour contacter ${label}, composez le ${number}.`);
  };

  const handleMicClick = () => {
    if (isSpeaking) return;
    speak('Bonjour Sophie ! Je suis Maellis, votre assistant de séjour. Comment puis-je vous aider ?');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback silent
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-6 w-40 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Tab configs ──
  const tabs: { key: AirbnbTab; label: string; emoji: string }[] = [
    { key: 'welcome', label: 'Bienvenue', emoji: '👋' },
    { key: 'wifi', label: 'WiFi', emoji: '📶' },
    { key: 'activities', label: 'Activités', emoji: '📍' },
    { key: 'services', label: 'Services', emoji: '⭐' },
  ];

  return (
    <DemoLayout
      title={`Villa Azur — ${airbnbConfig.location}`}
      subtitle={`Voyageur : ${airbnbConfig.guest.name} | ${currentDemoTime.date}`}
      accentColor="amber"
      onBack={onBack}
    >
      {/* ─── Info Cards ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 sm:p-5 text-white text-center shadow-lg">
          <div className="text-2xl">{airbnbConfig.weather.icon}</div>
          <div className="text-2xl sm:text-3xl font-bold mt-1">{airbnbConfig.weather.temp}</div>
          <div className="text-amber-100 text-xs sm:text-sm">{airbnbConfig.weather.condition}</div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-4 sm:p-5 text-white text-center shadow-lg">
          <CalendarCheck className="w-6 h-6 mx-auto mb-1" />
          <div className="text-base sm:text-xl font-bold">Check-in</div>
          <div className="text-teal-100 text-xs sm:text-sm">{airbnbConfig.guest.checkin}</div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 sm:p-5 text-white text-center shadow-lg">
          <CalendarX className="w-6 h-6 mx-auto mb-1" />
          <div className="text-base sm:text-xl font-bold">Check-out</div>
          <div className="text-pink-100 text-xs sm:text-sm">{airbnbConfig.guest.checkout}</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white text-center shadow-lg">
          <Clock className="w-6 h-6 mx-auto mb-1" />
          <div className="text-base sm:text-xl font-bold">Durée</div>
          <div className="text-indigo-100 text-xs sm:text-sm">
            {airbnbConfig.guest.nights} nuit{airbnbConfig.guest.nights > 1 ? 's' : ''}
          </div>
        </div>
      </motion.div>

      {/* ─── Navigation Tabs ─── */}
      <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-300'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB: WELCOME ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Welcome Message */}
            <div
              onClick={handleWelcomeClick}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 sm:p-6 border-2 border-amber-200 cursor-pointer hover:shadow-lg transition group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-xl flex-shrink-0">
                  <span className="text-2xl">🏠</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
                    Bienvenue {airbnbConfig.guest.name} !
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{airbnbConfig.welcomeMessage}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-600 flex items-center gap-2">
                🔊 Cliquez pour écouter le message de bienvenue
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* House Rules */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">📋 Règles de la maison</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {airbnbConfig.houseRules.map((rule, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => handleRuleClick(rule)}
                      className="p-3 sm:p-4 flex items-center gap-3 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                      <span className="text-slate-700">{rule}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">🚨 Contacts d&apos;urgence</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {airbnbConfig.emergencyContacts.map((contact, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="p-3 sm:p-4 flex items-center justify-between hover:bg-slate-50 transition"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => handleEmergencyClick(contact.label, contact.number)}
                      >
                        <span className="text-lg">{contact.icon}</span>
                        <div>
                          <div className="font-medium text-slate-800">{contact.label}</div>
                          <div className="text-sm text-slate-500">{contact.number}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-blue-500 hidden sm:inline">🔊</span>
                        <a
                          href={`tel:${contact.number.replace(/\s/g, '')}`}
                          className="p-2 bg-slate-100 hover:bg-emerald-100 rounded-lg transition"
                        >
                          <Phone className="w-4 h-4 text-slate-600 hover:text-emerald-600" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* SOS Button */}
                <div className="p-4">
                  <button className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white text-center rounded-xl font-bold hover:from-red-600 hover:to-rose-700 transition shadow-lg flex items-center justify-center gap-2">
                    <ShieldAlert size={18} />
                    SOS Urgence
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 sm:p-6 border-2 border-teal-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800">💬 Contacter {airbnbConfig.hostName}</h3>
                  <p className="text-slate-600 text-sm">Réponse rapide via WhatsApp</p>
                </div>
                <a
                  href={`https://wa.me/33612345678?text=Bonjour, je suis ${airbnbConfig.guest.name}, votre invitée à la Villa Azur.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>

            {/* Voice Assistant */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 text-center border-2 border-amber-100"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Assistant Maellis</h3>
              <p className="text-slate-600 mb-6">
                {isSpeaking ? 'Je parle...' : 'Appuyez pour me parler'}
              </p>
              <button
                onClick={handleMicClick}
                disabled={isSpeaking}
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform ${
                  isSpeaking
                    ? 'bg-red-500 animate-pulse scale-110'
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:scale-105'
                }`}
              >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <p className="text-sm text-slate-500 mt-4">🎤 Appuyez pour parler</p>
            </motion.div>
          </motion.div>
        )}

        {/* ─── TAB: WIFI ─── */}
        {activeTab === 'wifi' && (
          <motion.div
            key="wifi"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-lg mx-auto space-y-6"
          >
            {/* QR Code card */}
            <div
              onClick={handleWifiClick}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8 text-center cursor-pointer hover:shadow-xl transition group"
            >
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <div className="p-2 bg-cyan-100 rounded-xl">
                  <QrCode className="w-5 h-5 text-cyan-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">WiFi — Scannez le QR Code</h3>
              </div>

              <div className="inline-flex p-4 bg-white rounded-2xl mb-4 border-2 border-slate-100 shadow-inner">
                <div className="w-40 h-40">
                  <QRCodeDisplay />
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-2">Scannez avec votre téléphone pour vous connecter automatiquement</p>
              <p className="text-xs text-cyan-500 group-hover:text-cyan-700 transition">🔊 Cliquez pour écouter les informations WiFi</p>
            </div>

            {/* WiFi Credentials */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Réseau</p>
                      <p className="text-base sm:text-lg font-medium text-slate-800">{airbnbConfig.wifi.network}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(airbnbConfig.wifi.network, 'network')}
                    className="px-3 sm:px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-700 text-xs sm:text-sm font-medium transition-all"
                  >
                    {copiedField === 'network' ? '✅ Copié !' : 'Copier'}
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Mot de passe</p>
                      <p className="text-base sm:text-lg font-medium text-slate-800">{airbnbConfig.wifi.password}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(airbnbConfig.wifi.password, 'password')}
                    className="px-3 sm:px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-700 text-xs sm:text-sm font-medium transition-all"
                  >
                    {copiedField === 'password' ? '✅ Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── TAB: ACTIVITIES ─── */}
        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl space-y-6"
          >
            {/* Filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium mr-1">Filtrer :</span>
              {['Tous', ...Array.from(new Set(airbnbConfig.activities.map((a) => a.category)))].map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border-2 border-slate-200 text-slate-600 cursor-default hover:border-amber-300 transition"
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Activity Cards */}
            <div className="space-y-4">
              {airbnbConfig.activities.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleActivityClick(activity.name, activity.description, activity.duration)}
                  className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 sm:p-5 hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-amber-700 transition">
                          {activity.name}
                        </h4>
                        {activity.isPartner && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                            Partenaire
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {activity.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {activity.duration}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{activity.category}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition">🔊 Écouter</span>
                      {activity.whatsappLink && (
                        <a
                          href={activity.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition"
                        >
                          <MessageCircle size={12} /> Réserver
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Local guide CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 sm:p-6 border-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-base sm:text-lg font-bold text-slate-800">Guide local complet</p>
                <p className="text-sm text-slate-500">Restaurants, plages, nightlife et plus encore</p>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium">
                <Sparkles size={14} />
                Bientôt disponible
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ─── TAB: SERVICES ─── */}
        {activeTab === 'services' && (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl space-y-6"
          >
            {/* Services Grid */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {airbnbConfig.services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all group"
                >
                  <div
                    className="p-5 sm:p-6 cursor-pointer"
                    onClick={() => handleServiceClick(service.name, service.price)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">{service.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-bold text-slate-800 group-hover:text-amber-700 transition">
                          {service.name}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed mt-0.5">{service.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-lg sm:text-xl font-bold text-amber-600">{service.price}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition">🔊</span>
                      <a
                        href="https://wa.me/33612345678?text=Bonjour, je souhaite commander un service."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition"
                      >
                        <MessageCircle size={12} />
                        Commander
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* All services note */}
            <div className="text-center p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-sm text-slate-500">
                Tous les services sont payables sur place ou via le lien de paiement envoyé par WhatsApp.
                <br />
                <span className="text-slate-400 text-xs">Les partenaires Maellis garantissent qualité et ponctualité.</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoLayout>
  );
}
