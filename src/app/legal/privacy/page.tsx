'use client';

import { motion } from 'framer-motion';
import {
  Diamond,
  ShieldCheck,
  Lock,
  Database,
  Eye,
  Trash2,
  Download,
  Server,
  UserCheck,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════
   PRIVACY PAGE — Maison Consciente
   Politique de Confidentialité RGPD
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
    transition: { staggerChildren: 0.15 },
  },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/* ─── Data Collection Sections ─── */
const dataCategories = [
  {
    icon: ShieldCheck,
    title: 'S\u00e9curit\u00e9 (Safe Arrival)',
    description: "Nous collectons les heures de d\u00e9part et d\u2019arriv\u00e9e pour d\u00e9tecter les retards anormaux et d\u00e9clencher les alertes. Ces donn\u00e9es sont strictement n\u00e9cessaires au fonctionnement du service de s\u00e9curit\u00e9.",
  },
  {
    icon: Lock,
    title: 'Vocal & IA',
    description: "Les commandes vocales sont trait\u00e9es localement ou via nos partenaires s\u00e9curis\u00e9s (Google Gemini) pour am\u00e9liorer la reconnaissance. Les enregistrements audio bruts ne sont jamais stock\u00e9s sur nos serveurs.",
  },
  {
    icon: UserCheck,
    title: 'Compte & Facturation',
    description: "Email, nom et informations de facturation pour la gestion de l\u2019abonnement. Ces donn\u00e9es sont minimales et trait\u00e9es par notre prestataire de paiement s\u00e9curis\u00e9 (Stripe).",
  },
];

const rights = [
  {
    icon: Eye,
    title: 'Droit d\u2019acc\u00e8s',
    description: 'Vous pouvez demander une copie de toutes vos donn\u00e9es personnelles \u00e0 tout moment.',
  },
  {
    icon: Download,
    title: 'Droit \u00e0 la portabilit\u00e9',
    description: 'Exportez vos donn\u00e9es dans un format standard et r\u00e9utilisable.',
  },
  {
    icon: Trash2,
    title: 'Droit \u00e0 l\u2019oubli',
    description: 'Supprimez d\u00e9finitivement votre compte et toutes les donn\u00e9es associ\u00e9es.',
  },
];

const securityMeasures = [
  'Chiffrement AES-256 de bout en bout',
  'H\u00e9bergement sur serveurs europ\u00e9ens (France)',
  'Conformit\u00e9 RGPD totale',
  'Audit de s\u00e9curit\u00e9 trimestriel',
  'Aucune revente de donn\u00e9es',
  'Acc\u00e8s aux donn\u00e9es limit\u00e9 par r\u00f4le',
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-[#f1f5f9]">
      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-gold glow-gold">
              <Diamond className="w-4 h-4 text-[#020617]" />
            </div>
            <span className="font-serif text-gradient-gold text-lg tracking-wide">
              Maison Consciente
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/demo"
              className="px-3 sm:px-4 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f1f5f9] transition-colors duration-200"
            >
              D\u00e9mo
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
      <section className="relative pt-28 sm:pt-32 pb-12 px-4">
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-12 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d4a853 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4a853]/10 border border-[#d4a853]/20 mb-6"
          >
            <ShieldCheck className="w-8 h-8 text-[#d4a853]" strokeWidth={1.5} />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif mb-4 tracking-tight">
            Politique de{' '}
            <span className="text-gradient-gold">Confidentialit\u00e9</span>
          </h1>
          <p className="text-[#64748b] text-base">
            Derni\u00e8re mise \u00e0 jour : Janvier 2025
          </p>
        </motion.div>
      </section>

      {/* ═══ CONTENT ═══ */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* ─── Introduction ─── */}
          <motion.div {...fadeUp} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-[#d4a853]/10 shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#d4a853]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-[#f1f5f9] mb-3">
                  1. Vos Donn\u00e9es Sensibles
                </h2>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Maellis traite des donn\u00e9es critiques pour la s\u00e9curit\u00e9 de votre foyer : horaires de rentr\u00e9e,
                  localisation, contacts d&rsquo;urgence et informations de sant\u00e9. Toutes ces donn\u00e9es sont{' '}
                  <strong className="text-[#f1f5f9]">chiffr\u00e9es de bout en bout (AES-256)</strong> dans notre base
                  de donn\u00e9es. Nous ne vendons jamais vos donn\u00e9es personnelles.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Data Collection ─── */}
          <motion.div {...fadeUp}>
            <h2 className="text-xl font-serif font-semibold text-[#f1f5f9] mb-6 flex items-center gap-3">
              <Database className="text-[#d4a853]" size={20} />
              2. Collecte et Utilisation
            </h2>
            <motion.div {...staggerContainer} className="space-y-4">
              {dataCategories.map((cat, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-[#d4a853]/15 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-[#d4a853]/10 shrink-0">
                      <cat.icon className="w-5 h-5 text-[#d4a853]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#f1f5f9] mb-2">{cat.title}</h3>
                      <p className="text-sm text-[#94a3b8] leading-relaxed">{cat.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ─── GDPR Rights ─── */}
          <motion.div {...fadeUp}>
            <h2 className="text-xl font-serif font-semibold text-[#f1f5f9] mb-6">
              3. Vos Droits (RGPD)
            </h2>
            <motion.div {...staggerContainer} className="grid md:grid-cols-3 gap-4">
              {rights.map((right, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 text-center hover:border-[#d4a853]/15 transition-all duration-300"
                >
                  <div className="p-2.5 rounded-xl bg-[#d4a853]/10 w-fit mx-auto mb-3">
                    <right.icon className="w-5 h-5 text-[#d4a853]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#f1f5f9] mb-2">{right.title}</h3>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{right.description}</p>
                </motion.div>
              ))}
            </motion.div>
            <p className="text-sm text-[#94a3b8] mt-4 leading-relaxed">
              Vous pouvez exercer ces droits depuis votre tableau de bord dans la section{' '}
              <em className="text-[#f0d78c]">Param\u00e8tres &gt; Donn\u00e9es</em>, ou en contactant notre DPO.
            </p>
          </motion.div>

          {/* ─── Security ─── */}
          <motion.div {...fadeUp} className="bg-white/[0.03] backdrop-blur-xl border border-[#d4a853]/15 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2.5 rounded-xl bg-[#d4a853]/10 shrink-0">
                <Server className="w-5 h-5 text-[#d4a853]" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-semibold text-[#f1f5f9] mb-2">
                  4. Mesures de S\u00e9curit\u00e9
                </h2>
                <p className="text-sm text-[#94a3b8]">
                  Nous mettons en \u0153uvre des mesures techniques et organisationnelles pour prot\u00e9ger vos donn\u00e9es.
                </p>
              </div>
            </div>
            <ul className="space-y-3 pl-2">
              {securityMeasures.map((measure, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d4a853] shrink-0" />
                  <span className="text-[#94a3b8]">{measure}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ─── DPO Contact ─── */}
          <motion.div {...fadeUp} className="bg-gradient-to-br from-[#d4a853]/5 to-transparent backdrop-blur-xl border border-[#d4a853]/15 rounded-2xl p-6 md:p-8 text-center">
            <ShieldCheck className="w-10 h-10 text-[#d4a853] mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-serif font-bold text-[#f1f5f9] mb-2">Contact DPO</h3>
            <p className="text-sm text-[#94a3b8] mb-4">
              Pour toute question sur la protection de vos donn\u00e9es :
            </p>
            <a
              href="mailto:privacy@maison-consciente.com"
              className="inline-flex items-center gap-2 text-[#d4a853] hover:text-[#f0d78c] font-medium text-sm transition-colors"
            >
              privacy@maison-consciente.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto py-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-[#d4a853]/60" strokeWidth={1.5} />
              <span className="text-xs text-[#64748b]">
                &copy; 2025 Maison Consciente
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
              <Link href="/" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Accueil
              </Link>
              <Link href="/demo" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                D\u00e9mo
              </Link>
              <Link href="/pricing" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Tarifs
              </Link>
              <Link href="/about" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                \u00c0 propos
              </Link>
              <Link href="/contact" className="text-xs text-[#475569] hover:text-[#94a3b8] transition-colors">
                Contact
              </Link>
              <Link href="/legal/privacy" className="text-xs text-[#d4a853]/80 hover:text-[#d4a853] transition-colors">
                Confidentialit\u00e9
              </Link>
            </div>
            <p className="text-xs text-[#475569]">
              Con\u00e7u pour le confort et la privacy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
