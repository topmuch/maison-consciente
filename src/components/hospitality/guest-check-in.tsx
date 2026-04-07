'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  Key,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  LogOut,
  Users,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Guest Check-in V2 (Hospitality)

   Digital check-in card with WiFi info, live check-in/out,
   active guests display, house rules, and contact host.
   ═══════════════════════════════════════════════════════ */

type Step = 'info' | 'checkin' | 'rules';

interface ActiveGuest {
  id: string;
  guestName: string;
  checkInAt: string;
  notes: string | null;
}

interface GuestCheckInProps {
  activeGuests?: ActiveGuest[];
  onRefresh?: () => void;
}

export default function GuestCheckIn({ activeGuests = [], onRefresh }: GuestCheckInProps) {
  const { t } = useI18n();
  const { setView } = useAppStore();
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleCheckIn = async () => {
    if (!name.trim()) return;
    try {
      setCheckingIn(true);
      const res = await fetch('/api/hospitality/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: name.trim(), notes: notes.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${name.trim()} enregistré(e) !`);
      setName('');
      setNotes('');
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      onRefresh?.();
    } catch {
      toast.error("Impossible d'enregistrer");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (guestId: string) => {
    try {
      setCheckingOutId(guestId);
      const res = await fetch('/api/hospitality/check-in', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Check-out effectué');
      onRefresh?.();
    } catch {
      toast.error('Erreur lors du check-out');
    } finally {
      setCheckingOutId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="glass rounded-2xl p-6 inner-glow overflow-hidden relative">
      {/* Gold shimmer line */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent" />

      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
            <Key className="text-[var(--accent-primary)] w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-gradient-gold">
              {t.hospitality.checkin}
            </h2>
            <p className="text-xs text-[oklch(0.50_0.02_260)] mt-0.5">
              Gestion des arrivées et départs
            </p>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setStep('info')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all duration-300 cursor-pointer ${
              step === 'info'
                ? 'bg-[var(--accent-primary)] text-[#0a0a12] shadow-[0_0_12px_var(--accent-primary-glow)]'
                : 'bg-white/[0.05] text-[oklch(0.60_0.02_260)] hover:bg-white/[0.08]'
            }`}
          >
            {t.hospitality.info}
          </button>
          <button
            onClick={() => setStep('checkin')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all duration-300 cursor-pointer relative ${
              step === 'checkin'
                ? 'bg-[var(--accent-primary)] text-[#0a0a12] shadow-[0_0_12px_var(--accent-primary-glow)]'
                : 'bg-white/[0.05] text-[oklch(0.60_0.02_260)] hover:bg-white/[0.08]'
            }`}
          >
            Check-in
            {activeGuests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#34d399] text-[#0a0a12] text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeGuests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setStep('rules')}
            className={`px-3 py-1.5 rounded-full font-medium transition-all duration-300 cursor-pointer ${
              step === 'rules'
                ? 'bg-[var(--accent-primary)] text-[#0a0a12] shadow-[0_0_12px_var(--accent-primary-glow)]'
                : 'bg-white/[0.05] text-[oklch(0.60_0.02_260)] hover:bg-white/[0.08]'
            }`}
          >
            {t.hospitality.rules}
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        {step === 'info' ? (
          <div className="space-y-3">
            {/* WiFi */}
            <div className="flex items-start gap-3 bg-black/20 p-4 rounded-xl border border-white/[0.06]">
              <div className="p-2 bg-[#818cf8]/10 rounded-lg mt-0.5">
                <Wifi className="text-[#818cf8] w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground/90">{t.hospitality.wifi}</p>
                <p className="font-mono text-[var(--accent-primary)] text-sm mt-1">
                  Maison_Consciente_5G
                </p>
                <p className="font-mono text-[oklch(0.50_0.02_260)] text-xs mt-0.5">
                  Mot de passe: welcome2024
                </p>
              </div>
            </div>

            {/* Check-in / Check-out times */}
            <div className="flex items-start gap-3 bg-black/20 p-4 rounded-xl border border-white/[0.06]">
              <div className="p-2 bg-[#fb7185]/10 rounded-lg mt-0.5">
                <BookOpen className="text-[#fb7185] w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/90">Arrivée / Départ</p>
                <p className="text-[var(--accent-primary)] text-sm mt-1">
                  {t.hospitality.checkin_after}
                </p>
                <p className="text-[var(--accent-primary)]/80 text-sm">
                  {t.hospitality.checkout_before}
                </p>
              </div>
            </div>

            {/* Active guests indicator */}
            {activeGuests.length > 0 && (
              <div className="flex items-center gap-3 bg-[#34d399]/5 p-3 rounded-xl border border-[#34d399]/15">
                <Users className="text-[#34d399] w-5 h-5" />
                <p className="text-sm text-[#34d399]">
                  {activeGuests.length} voyageur{activeGuests.length > 1 ? 's' : ''} actuellement présent{activeGuests.length > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Contact host */}
            <Button
              className="w-full mt-1 bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-3 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 cursor-pointer"
              onClick={() => setView('messages')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t.hospitality.contact_host}
            </Button>
          </div>
        ) : step === 'checkin' ? (
          <div className="space-y-4">
            {/* Check-in Form */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="text-[var(--accent-primary)] w-4 h-4" />
                <p className="text-sm font-medium text-foreground/90">Nouvel arrivée</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom du voyageur..."
                  className="flex-1 bg-black/30 border border-white/[0.08] text-foreground placeholder:text-[oklch(0.40_0.02_260)] focus:border-[var(--accent-primary)]/50 focus:ring-[var(--accent-primary)]/20 h-9 text-sm rounded-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                />
                <Button
                  onClick={handleCheckIn}
                  disabled={checkingIn || !name.trim()}
                  size="sm"
                  className={`h-9 px-4 font-medium text-xs rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all ${
                    done
                      ? 'bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/30'
                      : 'bg-[var(--accent-primary)] text-[#0a0a12] hover:bg-[var(--accent-primary)]/90'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : checkingIn ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    'Valider'
                  )}
                </Button>
              </div>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optionnel)..."
                className="mt-2 bg-black/30 border border-white/[0.08] text-foreground placeholder:text-[oklch(0.40_0.02_260)] focus:border-[var(--accent-primary)]/50 focus:ring-[var(--accent-primary)]/20 h-8 text-xs rounded-lg"
              />
            </div>

            {/* Active Guests List */}
            {activeGuests.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="text-[#34d399] w-4 h-4" />
                  <p className="text-xs font-medium text-[oklch(0.60_0.02_260)]">
                    Présents ({activeGuests.length})
                  </p>
                </div>
                <AnimatePresence initial={false}>
                  {activeGuests.map((guest) => (
                    <motion.div
                      key={guest.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-[#34d399]/10 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1.5 bg-[#34d399]/10 rounded-lg shrink-0">
                          <UserCheck className="text-[#34d399] w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground/90 truncate">
                            {guest.guestName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-[oklch(0.40_0.02_260)]" />
                            <span className="text-[10px] text-[oklch(0.40_0.02_260)]">
                              Depuis {formatTime(guest.checkInAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCheckOut(guest.id)}
                        disabled={checkingOutId === guest.id}
                        className="h-7 px-2 text-xs text-[#fb7185] hover:text-[#fb7185] hover:bg-[#fb7185]/10 rounded-lg shrink-0 cursor-pointer"
                      >
                        {checkingOutId === guest.id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <LogOut className="w-3 h-3 mr-1" />
                            Out
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {activeGuests.length === 0 && (
              <div className="text-center py-4">
                <p className="text-xs text-[oklch(0.40_0.02_260)]">
                  Aucun voyageur enregistré
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/20 rounded-xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-[var(--accent-primary)] w-5 h-5" />
              <h3 className="text-sm font-medium text-foreground/90">
                Règles de la maison
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-[oklch(0.75_0.02_260)]">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                {t.hospitality.rule_1}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                {t.hospitality.rule_2}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                {t.hospitality.rule_3}
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                {t.hospitality.rule_4}
              </li>
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
}
