'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MessageCircle,
  MapPin,
  ExternalLink,
  Save,
  Loader2,
  Settings,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ═══════════════════════════════════════════════════════
   HOSPITALITY SETTINGS PANEL
   
   Host-facing settings for:
   - Google Review configuration (Place ID, rating display)
   - Contact settings (email, WhatsApp, templates)
   - POI import trigger
   ═══════════════════════════════════════════════════════ */

interface ReviewSettings {
  enabled: boolean;
  expiryHours: number;
  maskLowRating: boolean;
}

interface ContactSettings {
  email: string;
  whatsapp: string;
  templates: string[];
  notifyPush: boolean;
  notifyEmail: boolean;
}

/* ── Animation ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ═══ MAIN COMPONENT ═══ */
export function HospitalitySettingsPanel() {
  /* ── Review Settings State ── */
  const [googlePlaceId, setGooglePlaceId] = useState('');
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [expiryHours, setExpiryHours] = useState(2);
  const [maskLowRating, setMaskLowRating] = useState(true);
  const [savingReview, setSavingReview] = useState(false);

  /* ── Contact Settings State ── */
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [templates, setTemplates] = useState<string[]>([]);
  const [newTemplate, setNewTemplate] = useState('');
  const [savingContact, setSavingContact] = useState(false);

  /* ── Open Tickets Count ── */
  const [openTickets, setOpenTickets] = useState(0);

  /* ── Load settings ── */
  const loadSettings = useCallback(async () => {
    try {
      // Load review settings
      const reviewRes = await fetch('/api/hospitality/review');
      if (reviewRes.ok) {
        const data = await reviewRes.json();
        if (data.success) {
          setGooglePlaceId(data.googlePlaceId || '');
          setGoogleRating(data.googleRating ?? null);
          const rs = data.reviewSettings || {};
          setReviewEnabled(rs.enabled !== false);
          setExpiryHours(rs.expiryHours || 2);
          setMaskLowRating(rs.maskLowRating !== false);
        }
      }

      // Load contact settings
      const contactRes = await fetch('/api/hospitality/support');
      if (contactRes.ok) {
        const data = await contactRes.json();
        if (data.success) {
          // Contact settings are stored on household — fetched from a separate endpoint
          // For now, we load from the tickets response which includes household settings
          setOpenTickets((data.tickets || []).filter((t: { status: string }) => t.status === 'open').length);
        }
      }

      // Load household settings for contact info
      const hhRes = await fetch('/api/household/settings');
      if (hhRes.ok) {
        const data = await hhRes.json();
        if (data.success && data.settings) {
          setContactEmail(data.settings.contactEmail || '');
        }
      }
    } catch {
      // Silent — settings will use defaults
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ── Save Review Settings ── */
  const saveReviewSettings = useCallback(async () => {
    setSavingReview(true);
    try {
      const res = await fetch('/api/hospitality/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlaceId: googlePlaceId || undefined,
          enabled: reviewEnabled,
          expiryHours,
          maskLowRating,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.googleRating) setGoogleRating(data.googleRating);
        toast.success('Paramètres d\'avis mis à jour');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSavingReview(false);
    }
  }, [googlePlaceId, reviewEnabled, expiryHours, maskLowRating]);

  /* ── Save Contact Settings ── */
  const saveContactSettings = useCallback(async () => {
    setSavingContact(true);
    try {
      const res = await fetch('/api/household/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactEmail: contactEmail || undefined,
          contactSettings: JSON.stringify({
            email: contactEmail,
            whatsapp: contactWhatsapp,
            templates,
            notifyPush,
            notifyEmail,
          }),
        }),
      });
      if (res.ok) {
        toast.success('Paramètres de contact mis à jour');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSavingContact(false);
    }
  }, [contactEmail, contactWhatsapp, templates, notifyPush, notifyEmail]);

  /* ── Template Management ── */
  const addTemplate = useCallback(() => {
    if (!newTemplate.trim()) return;
    if (templates.length >= 8) {
      toast.error('Maximum 8 templates');
      return;
    }
    setTemplates([...templates, newTemplate.trim()]);
    setNewTemplate('');
  }, [newTemplate, templates]);

  const removeTemplate = useCallback((index: number) => {
    setTemplates(templates.filter((_, i) => i !== index));
  }, [templates]);

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--accent-primary)]/10 rounded-xl border border-[var(--accent-primary)]/15">
            <Settings className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div>
            <h2 className="text-xl font-serif text-gradient-gold">
              Paramètres Hospitalité
            </h2>
            <p className="text-xs text-[#64748b]">
              Avis Google, contact hôte, et points d&apos;intérêt
            </p>
          </div>
          {openTickets > 0 && (
            <Badge className="ml-auto bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20 text-[10px] px-2.5 py-0.5 rounded-full">
              {openTickets} ticket{openTickets > 1 ? 's' : ''} ouvert{openTickets > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </motion.div>

      {/* ═══ GOOGLE REVIEW SETTINGS ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-semibold text-[#e2e8f0] text-sm">
                  Smart Review Google
                </h3>
                <p className="text-[10px] text-[#475569]">
                  Note interne + redirection Google avis
                </p>
              </div>
              {googleRating && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/10 border border-amber-400/15">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{googleRating}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Google Place ID */}
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-sm">Google Place ID</Label>
                <div className="flex gap-2">
                  <Input
                    value={googlePlaceId}
                    onChange={(e) => setGooglePlaceId(e.target.value)}
                    placeholder="ChIJ..."
                    className="flex-1 glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all font-mono text-xs"
                  />
                  {googlePlaceId && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        window.open(`https://search.google.com/local/writereview?placeid=${googlePlaceId}`, '_blank');
                      }}
                      className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 shrink-0"
                      title="Tester le lien d'avis"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-[#475569]">
                  Trouvez-le dans l&apos;URL Google Maps de votre établissement
                </p>
              </div>

              {/* Toggle: Enabled */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Star className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e2e8f0]">Activer les avis</p>
                    <p className="text-[10px] text-[#475569]">Afficher le formulaire de notation</p>
                  </div>
                </div>
                <Switch
                  checked={reviewEnabled}
                  onCheckedChange={setReviewEnabled}
                  className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>

              {/* Expiry Hours */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#818cf8]/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-[#818cf8]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e2e8f0]">Expiration</p>
                    <p className="text-[10px] text-[#475569]">Durée avant désactivation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all text-sm"
                    min={1}
                    max={72}
                  />
                  <span className="text-xs text-[#64748b]">heures</span>
                </div>
              </div>

              {/* Mask Low Rating */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f87171]/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-[#f87171]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#e2e8f0]">Masquer avis bas</p>
                    <p className="text-[10px] text-[#475569]">
                      Rediriger les notes ≤ 3 vers le contact hôte
                    </p>
                  </div>
                </div>
                <Switch
                  checked={maskLowRating}
                  onCheckedChange={setMaskLowRating}
                  className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>

              {/* Save button */}
              <div className="pt-2">
                <Button
                  onClick={saveReviewSettings}
                  disabled={savingReview}
                  className="w-full bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-2.5 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingReview ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder les avis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ CONTACT HOST SETTINGS ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#34d399]/10 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#34d399]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-[#e2e8f0] text-sm">
                  Contact Hôte
                </h3>
                <p className="text-[10px] text-[#475569]">
                  Notifications et templates de réponse rapide
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-sm flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email de notification
                </Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="hote@example.com"
                  className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all"
                />
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-sm flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp (numéro)
                </Label>
                <Input
                  type="tel"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value)}
                  placeholder="+33612345678"
                  className="glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all"
                />
              </div>

              {/* Notification toggles */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">Notification push</p>
                  <p className="text-[10px] text-[#475569]">Alerte dashboard en temps réel</p>
                </div>
                <Switch
                  checked={notifyPush}
                  onCheckedChange={setNotifyPush}
                  className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">Notification email</p>
                  <p className="text-[10px] text-[#475569]">Envoyer un email pour chaque ticket</p>
                </div>
                <Switch
                  checked={notifyEmail}
                  onCheckedChange={setNotifyEmail}
                  className="data-[state=checked]:bg-[var(--accent-primary)] data-[state=unchecked]:bg-white/[0.08]"
                />
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <Label className="text-[#94a3b8] text-sm">Templates réponse rapide</Label>
                <div className="space-y-2">
                  {templates.map((tpl, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <span className="text-xs text-[#e2e8f0] flex-1">{tpl}</span>
                      <button
                        onClick={() => removeTemplate(idx)}
                        className="p-1 rounded hover:bg-[#f87171]/10 transition-colors cursor-pointer"
                        aria-label="Supprimer le template"
                      >
                        <X className="w-3 h-3 text-[#475569] hover:text-[#f87171]" />
                      </button>
                    </motion.div>
                  ))}
                  {templates.length < 8 && (
                    <div className="flex gap-2">
                      <Input
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTemplate()}
                        placeholder="Nouveau template..."
                        className="flex-1 glass bg-white/[0.04] border-white/[0.08] text-[#e2e8f0] placeholder:text-[#475569] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all text-xs"
                        maxLength={100}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={addTemplate}
                        disabled={!newTemplate.trim()}
                        className="border-[var(--accent-primary)]/25 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Save button */}
              <div className="pt-2">
                <Button
                  onClick={saveContactSettings}
                  disabled={savingContact}
                  className="w-full bg-gradient-gold text-[#0a0a12] font-semibold rounded-xl py-2.5 shadow-lg shadow-[oklch(0.78_0.14_85/15%)] hover:shadow-[oklch(0.78_0.14_85/30%)] transition-shadow duration-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingContact ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Sauvegarder le contact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ POI IMPORT SECTION ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
      >
        <Card className="glass rounded-2xl inner-glow border-white/[0.06] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#c77d5a]/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#c77d5a]" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-[#e2e8f0] text-sm">
                  Points d&apos;Intérêt
                </h3>
                <p className="text-[10px] text-[#475569]">
                  Importez les lieux à proximité via Foursquare
                </p>
              </div>
            </div>

            <p className="text-xs text-[#64748b] mb-4">
              Configurez votre clé API Foursquare dans <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--accent-primary)] text-[10px] font-mono">.env</code> sous <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--accent-primary)] text-[10px] font-mono">FOURSQUARE_API_KEY</code>
            </p>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-[#475569] leading-relaxed">
                💡 <strong className="text-[#94a3b8]">Astuce</strong> : Utilisez l&apos;import Foursquare depuis le tableau de bord hospitalité pour ajouter automatiquement les pharmacies, urgences, transports et commerces à proximité.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default HospitalitySettingsPanel;
