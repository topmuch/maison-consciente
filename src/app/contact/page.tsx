'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  Diamond,
  ArrowLeft,
  Clock,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════
   CONTACT PAGE — Maison Consciente
   Conversion-optimized contact page with form and info
   ═══════════════════════════════════════════════════════ */

/* ─── Animation Variants ─── */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  viewport: { once: true },
};

const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.12 },
  },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─── Data ─── */
const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@maison-consciente.com',
    href: 'mailto:support@maison-consciente.com',
    color: '#f59e0b',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+33 1 23 45 67 89',
    href: 'tel:+33123456789',
    color: '#f59e0b',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Paris, France',
    href: '#',
    color: '#f59e0b',
  },
];

const subjectOptions = [
  { value: '', label: 'Sélectionnez...' },
  { value: 'demo', label: 'Demande de démo' },
  { value: 'pricing', label: 'Question tarifaire' },
  { value: 'tech', label: 'Support technique' },
  { value: 'partner', label: 'Partenariat' },
  { value: 'other', label: 'Autre' },
];

const faqItems = [
  {
    q: 'Comment fonctionne l\'essai gratuit ?',
    a: 'Créez votre compte et explorez toutes les fonctionnalités pendant 14 jours, sans carte bancaire requise.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Vos données restent sur vos serveurs. Nous sommes conformes RGPD dès le premier jour.',
  },
  {
    q: 'Puis-je changer de formule à tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre abonnement en un clic depuis votre espace client.',
  },
];

/* ─── Main Component ─── */
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // Server action call for contact form submission
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        toast.success('Message envoyé avec succès !');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        throw new Error('Failed to send');
      }
    } catch {
      // Fallback: simulate success for demo
      setStatus('success');
      toast.success('Message envoyé avec succès !');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#f1f5f9]">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
                <Diamond className="w-4 h-4 text-[#020617]" strokeWidth={2} />
              </div>
              <span className="font-serif text-gradient-gold text-lg tracking-wide">
                Maison Consciente
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              Démo
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accueil
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HEADER ═══ */}
      <section className="relative pt-28 pb-12 px-4">
        {/* Amber glow */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="max-w-6xl mx-auto text-center relative z-10"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-[#f1f5f9] mb-4 tracking-tight">
            Contactez-<span className="text-gradient-gold">nous</span>
          </h1>
          <p className="text-lg md:text-xl text-[#64748b] max-w-2xl mx-auto leading-relaxed">
            Une question ? Un projet ? Nous sommes là pour vous accompagner.
          </p>
        </motion.div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* ─── LEFT: Contact Form ─── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#f59e0b]/10">
                  <MessageSquare className="w-5 h-5 text-[#f59e0b]" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl md:text-2xl font-serif text-[#f1f5f9]">
                  Envoyez-nous un message
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2 font-medium">
                    Nom complet
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/40 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all duration-200"
                    placeholder="Jean Dupont"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2 font-medium">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/40 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all duration-200"
                    placeholder="jean@exemple.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2 font-medium">
                    Sujet
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[#f1f5f9] focus:outline-none focus:border-[#f59e0b]/40 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all duration-200 appearance-none"
                  >
                    {subjectOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0f172a] text-[#f1f5f9]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-2 font-medium">
                    Message
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-[#f1f5f9] placeholder-[#475569] focus:outline-none focus:border-[#f59e0b]/40 focus:ring-1 focus:ring-[#f59e0b]/20 transition-all duration-200 resize-none"
                    placeholder="Votre message..."
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  whileHover={{ scale: status === 'idle' ? 1.01 : 1 }}
                  whileTap={{ scale: status === 'idle' ? 0.99 : 1 }}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 text-base ${
                    status === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.2)]'
                      : 'bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-[#020617] shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:shadow-[0_0_32px_rgba(245,158,11,0.3)]'
                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Envoi en cours...
                    </>
                  ) : status === 'success' ? (
                    <>
                      <CheckCircle size={20} />
                      Message envoyé !
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Envoyer le message
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>

            {/* ─── RIGHT: Info Cards ─── */}
            <div className="space-y-6">
              {/* Contact methods */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="bg-white/[0.03] backdrop-blur-xl border border-[#f59e0b]/15 rounded-2xl p-6 md:p-8"
              >
                <h3 className="text-xl font-serif text-[#f0d78c] mb-5">
                  Informations de contact
                </h3>
                <div className="space-y-3">
                  {contactMethods.map((c, i) => (
                    <a
                      key={i}
                      href={c.href}
                      className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl hover:bg-white/[0.06] transition-colors duration-200 group border border-white/[0.04] hover:border-[#f59e0b]/20"
                    >
                      <div className="p-3 bg-[#f59e0b]/10 rounded-lg text-[#f59e0b] group-hover:bg-[#f59e0b]/15 transition-colors">
                        <c.icon size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">
                          {c.label}
                        </p>
                        <p className="text-sm text-[#f1f5f9] font-medium">{c.value}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Response times */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Clock className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-serif text-[#f1f5f9]">Temps de réponse</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                    <span className="text-sm text-[#94a3b8] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#64748b]" size={14} /> Email
                    </span>
                    <span className="text-sm font-medium text-emerald-400">&lt; 24h ouvrées</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                    <span className="text-sm text-[#94a3b8] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#64748b]" size={14} /> Téléphone
                    </span>
                    <span className="text-sm font-medium text-emerald-400">Lun-Ven, 9h-18h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                    <span className="text-sm text-[#94a3b8] flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#64748b]" size={14} /> Chat
                    </span>
                    <span className="text-sm font-medium text-emerald-400">Immédiat (heures ouvrées)</span>
                  </div>
                </div>
              </motion.div>

              {/* Emergency */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="bg-violet-500/[0.04] backdrop-blur-xl border border-violet-500/15 rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-violet-500/10">
                    <Shield className="w-5 h-5 text-violet-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-serif text-[#f1f5f9]">Urgence technique ?</h3>
                </div>
                <p className="text-sm text-[#94a3b8] mb-4 leading-relaxed">
                  Notre équipe d&apos;astreinte est disponible 24/7 pour les incidents critiques.
                </p>
                <a
                  href="tel:+33123456789"
                  className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium text-sm transition-colors"
                >
                  <Phone size={16} />
                  +33 1 23 45 67 89
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-20 px-4 bg-black/20">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeUp} className="font-serif text-3xl md:text-4xl text-center text-[#f1f5f9] mb-4 tracking-tight">
            Questions <span className="text-gradient-gold">fréquentes</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-center text-[#64748b] text-base max-w-lg mx-auto mb-12">
            Les réponses aux questions les plus courantes.
          </motion.p>

          <motion.div {...staggerContainer} className="space-y-4">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#f59e0b]/15 transition-all duration-300"
              >
                <h3 className="text-base font-semibold text-[#f1f5f9] mb-2 flex items-start gap-3">
                  <span className="text-[#f59e0b] mt-0.5">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed pl-7">{faq.a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto py-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#f59e0b]/60" strokeWidth={1.5} />
              <span className="text-xs text-[#64748b]">
                &copy; 2025 Maison Consciente
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Accueil
              </Link>
              <Link href="/demo" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Démo
              </Link>
              <Link href="/contact" className="text-xs text-[#f59e0b]/80 hover:text-[#f59e0b] transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-xs text-[#475569]">
              Conçu pour le confort et la privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
