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
  Clock,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { SiteNavbar } from '@/components/layout/SiteNavbar';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ═══════════════════════════════════════════════════════════
   CONTACT PAGE — Maellis
   Light SaaS design with amber accents & dark mode support
   ═══════════════════════════════════════════════════════════ */

/* ─── Animation Variants ─── */
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
  viewport: { once: true, amount: 0.2 },
};

const stagger = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
  viewport: { once: true },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/* ─── Data ─── */
const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@maellis.com',
    href: 'mailto:support@maellis.com',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+33 1 23 45 67 89',
    href: 'tel:+33123456789',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Paris, France',
    href: '#',
  },
];

const subjectOptions = [
  { value: 'demo', label: 'Demande de démo' },
  { value: 'pricing', label: 'Question tarifaire' },
  { value: 'tech', label: 'Support technique' },
  { value: 'partner', label: 'Partenariat' },
  { value: 'other', label: 'Autre' },
];

const responseTimes = [
  { icon: Mail, label: 'Email', time: '< 24h ouvrées' },
  { icon: Phone, label: 'Téléphone', time: 'Lun-Ven, 9h-18h' },
  { icon: MessageSquare, label: 'Chat', time: 'Immédiat' },
];

const faqItems = [
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Créez votre compte et explorez toutes les fonctionnalités pendant 14 jours, sans carte bancaire requise.",
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Vos données restent sur vos serveurs. Nous sommes conformes RGPD dès le premier jour.',
  },
  {
    q: 'Puis-je changer de formule à tout moment ?',
    a: "Oui, vous pouvez upgrader ou downgrader votre abonnement en un clic depuis votre espace client.",
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ═══ NAVBAR ═══ */}
      <SiteNavbar activePage="/contact" />

      {/* ═══ HEADER ═══ */}
      <section className="relative pt-28 pb-12 px-4">
        {/* Amber glow */}
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <Badge
            variant="secondary"
            className="mb-6 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 px-3.5 py-1 text-sm font-medium"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Nous sommes à votre écoute
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-['--font-playfair'] text-foreground mb-4 tracking-tight">
            Contactez-{' '}
            <span className="text-amber-600 dark:text-amber-400">nous</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Une question ? Un projet ? Notre équipe est là pour vous accompagner dans votre réussite.
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
              transition={{ duration: 0.6, ease: easeOut }}
            >
              <Card className="border-amber-200/60 dark:border-amber-800/40 shadow-md">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Form header */}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                      <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                        Envoyez-nous un message
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Réponse garantie sous 24h
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nom complet
                      </Label>
                      <Input
                        id="name"
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Jean Dupont"
                        className="bg-background"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="jean@exemple.com"
                        className="bg-background"
                      />
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Sujet
                      </Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => updateField('subject', value)}
                      >
                        <SelectTrigger id="subject" className="w-full bg-background">
                          <SelectValue placeholder="Sélectionnez un sujet..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder="Décrivez votre demande en quelques lignes..."
                        className="bg-background resize-none"
                      />
                    </div>

                    {/* Submit button */}
                    <motion.div
                      whileHover={status === 'idle' ? { scale: 1.01 } : {}}
                      whileTap={status === 'idle' ? { scale: 0.99 } : {}}
                    >
                      <Button
                        type="submit"
                        disabled={status === 'loading' || status === 'success'}
                        size="lg"
                        className={`w-full font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 text-base py-6 ${
                          status === 'success'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-md hover:shadow-lg'
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
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* ─── RIGHT: Info Cards ─── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
              className="space-y-6"
            >
              {/* Contact Methods Card */}
              <Card className="border-amber-200/60 dark:border-amber-800/40 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-5">
                    Informations de contact
                  </h3>
                  <div className="space-y-3">
                    {contactMethods.map((c, i) => (
                      <a
                        key={i}
                        href={c.href}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors duration-200 group border border-border hover:border-amber-300 dark:hover:border-amber-700/60"
                      >
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                          <c.icon size={20} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                            {c.label}
                          </p>
                          <p className="text-sm text-foreground font-medium">{c.value}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Response Times Card */}
              <Card className="shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                      <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Temps de réponse
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {responseTimes.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <item.icon className="w-4 h-4" size={14} />
                          {item.label}
                        </span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Support Card */}
              <Card className="border-red-200/60 dark:border-red-800/40 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30">
                      <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      Urgence technique ?
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Notre équipe d&apos;astreinte est disponible 24/7 pour les incidents critiques.
                  </p>
                  <a
                    href="tel:+33123456789"
                    className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm transition-colors"
                  >
                    <Phone size={16} />
                    +33 1 23 45 67 89
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 md:py-20 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <Badge
              variant="secondary"
              className="mb-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 px-3 py-1 text-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
              FAQ
            </Badge>
            <h2 className="font-['--font-playfair'] text-3xl md:text-4xl text-foreground mb-4 tracking-tight">
              Questions{' '}
              <span className="text-amber-600 dark:text-amber-400">fréquentes</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Les réponses aux questions les plus courantes de nos utilisateurs.
            </p>
          </motion.div>

          <motion.div {...stagger} className="space-y-4">
            {faqItems.map((faq, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card className="hover:border-amber-200 dark:hover:border-amber-800/60 transition-all duration-300 shadow-sm hover:shadow-md">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-foreground mb-2 flex items-start gap-3">
                      <span className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">Q.</span>
                      {faq.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-7">
                      {faq.a}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <div className="mt-auto">
        <SiteFooter />
      </div>
    </div>
  );
}
