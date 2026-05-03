'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, Home, Hotel, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/* ─── Animation Variants ─── */
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const brandVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const formVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 40 : -40,
    filter: 'blur(4px)',
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -40 : 40,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ─── Amber Spinner ─── */
function AmberSpinner() {
  return (
    <span className="relative flex items-center justify-center w-5 h-5">
      <span className="absolute inset-0 rounded-full border-2 border-amber-200 dark:border-amber-800" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
    </span>
  );
}

/* ─── Main Auth Page ─── */
export function AuthPage({ onBack, prefillType, onRegisterSuccess }: { onBack?: () => void; prefillType?: 'home' | 'hospitality' | null; onRegisterSuccess?: (householdType: string) => void } = {}) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | null>(prefillType ? 'register' : null);
  const [direction, setDirection] = useState(0);

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regHouseholdType, setRegHouseholdType] = useState<'home' | 'hospitality'>(prefillType || 'home');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setDirection(value === 'register' ? 1 : -1);
    setActiveTab(value as 'login' | 'register');
  };

  // Auto-switch to register tab if prefillType is set
  useEffect(() => {
    if (prefillType && activeTab === null) {
      setActiveTab('register');
    }
  }, [prefillType, activeTab]);

  // Default to login if no tab is set yet
  const effectiveTab = activeTab || 'login';

  /* ─── Validation helpers ─── */
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateLogin = () => {
    if (!loginEmail.trim()) {
      toast.error('Veuillez saisir votre adresse e-mail');
      return false;
    }
    if (!validateEmail(loginEmail)) {
      toast.error('Adresse e-mail invalide');
      return false;
    }
    if (!loginPassword) {
      toast.error('Veuillez saisir votre mot de passe');
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    if (!regName.trim() || regName.trim().length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return false;
    }
    if (!regEmail.trim()) {
      toast.error('Veuillez saisir votre adresse e-mail');
      return false;
    }
    if (!validateEmail(regEmail)) {
      toast.error('Adresse e-mail invalide');
      return false;
    }
    if (!regPassword || regPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  /* ─── API Handlers ─── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur de connexion');
        return;
      }

      // ── Session persistence: 3-layer fallback ──
      // Layer 1: Server Set-Cookie (handled by browser automatically)
      // Layer 2: document.cookie (fallback for restricted cookie contexts)
      // Layer 3: localStorage + URL param (ultimate fallback for iframes/proxies)
      if (data.sessionId) {
        // Layer 2: client-side cookie
        document.cookie = `mc-session=${data.sessionId}; path=/; SameSite=Lax; max-age=${30*24*60*60}`;
        // Layer 3: store in localStorage
        try { localStorage.setItem('mc-session', data.sessionId); } catch {}
      }

      toast.success('Bienvenue !');
      // Redirect with session in URL as fallback — middleware will set the cookie
      setTimeout(() => {
        window.location.href = `/dashboard?s=${data.sessionId}`;
      }, 300);
      return;
    } catch (err) {
      console.error('[LOGIN] Fetch error:', err);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          householdType: regHouseholdType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erreur lors de l'inscription");
        return;
      }

      // ── Session persistence: 3-layer fallback (same as login) ──
      if (data.sessionId) {
        document.cookie = `mc-session=${data.sessionId}; path=/; SameSite=Lax; max-age=${30*24*60*60}`;
        try { localStorage.setItem('mc-session', data.sessionId); } catch {}
      }

      toast.success('Compte créé avec succès !');
      setTimeout(() => {
        window.location.href = `/dashboard?s=${data.sessionId}`;
      }, 300);
      return;
    } catch (err) {
      console.error('[REGISTER] Fetch error:', err);
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-muted/50 overflow-hidden">
      {/* ─── Decorative Background ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Warm amber gradient wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-background to-orange-50/50 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10" />

        {/* Top-right soft orb */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-amber-200/20 dark:bg-amber-500/5 blur-[120px]" />

        {/* Bottom-left soft orb */}
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-orange-200/15 dark:bg-orange-500/5 blur-[140px]" />

        {/* Center-right subtle glow */}
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-amber-100/20 dark:bg-amber-600/5 blur-[100px]" />
      </div>

      {/* ─── Back to Home Link ─── */}
      {onBack && (
        <Link
          href="/"
          onClick={(e) => { e.preventDefault(); onBack(); }}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
      )}

      {/* ─── Content Container ─── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[420px] flex flex-col items-center"
      >
        {/* ─── Brand Header ─── */}
        <motion.div
          variants={brandVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          {/* Sparkles Logo */}
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center justify-center w-[4.5rem] h-[4.5rem] rounded-2xl mb-5 bg-amber-100 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700/40 shadow-lg shadow-amber-500/10"
          >
            <Sparkles className="w-8 h-8 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
          </motion.div>

          {/* Brand Name */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Maellis
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground mt-2 tracking-wide">
            L&apos;Habitation Intelligente
          </p>
        </motion.div>

        {/* ─── Auth Card ─── */}
        <Card className="w-full bg-background/80 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardContent className="p-6 pt-5 space-y-5">
            {/* Tabs */}
            <Tabs
              value={effectiveTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="relative w-full grid grid-cols-2 h-11 rounded-xl p-1 bg-muted">
                <TabsTrigger
                  value="login"
                  className="relative z-10 text-sm font-medium transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-lg cursor-pointer"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="relative z-10 text-sm font-medium transition-colors duration-200 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground rounded-lg cursor-pointer"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Animated Form Content */}
            <AnimatePresence mode="wait" custom={direction}>
              {effectiveTab === 'login' ? (
                <motion.form
                  key="login-form"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-email"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Adresse e-mail
                    </Label>
                    <div className="relative group">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-500 transition-colors duration-200"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm tracking-wide border-0 mt-2 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <AmberSpinner />
                          Connexion…
                        </span>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.form
                  key="register-form"
                  custom={direction}
                  variants={formVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  onSubmit={handleRegister}
                  className="space-y-4"
                >
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-name"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Nom complet
                    </Label>
                    <div className="relative group">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Jean Dupont"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Household Type Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type de foyer
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegHouseholdType('home')}
                        className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          regHouseholdType === 'home'
                            ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <Home className={`w-5 h-5 ${regHouseholdType === 'home' ? 'text-amber-500' : 'text-muted-foreground'} transition-colors duration-300`} />
                        <span className={`text-xs font-medium ${regHouseholdType === 'home' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} transition-colors duration-300`}>
                          Personnel
                        </span>
                        {regHouseholdType === 'home' && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegHouseholdType('hospitality')}
                        className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          regHouseholdType === 'hospitality'
                            ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-900/20'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        <Hotel className={`w-5 h-5 ${regHouseholdType === 'hospitality' ? 'text-amber-500' : 'text-muted-foreground'} transition-colors duration-300`} />
                        <span className={`text-xs font-medium ${regHouseholdType === 'hospitality' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'} transition-colors duration-300`}>
                          Hospitalité
                        </span>
                        {regHouseholdType === 'hospitality' && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-email"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Adresse e-mail
                    </Label>
                    <div className="relative group">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-password"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 caractères"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-500 transition-colors duration-200"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-confirm"
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-amber-500" />
                      <Input
                        id="reg-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-amber-500 transition-colors duration-200"
                        aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm tracking-wide border-0 mt-2 shadow-sm shadow-amber-500/20 hover:shadow-md hover:shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <AmberSpinner />
                          Inscription…
                        </span>
                      ) : (
                        'Créer un compte'
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ─── Divider ─── */}
        <div className="w-64 my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ─── Footer ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-xs text-muted-foreground tracking-wide"
        >
          © 2025 Maellis — Tous droits réservés
        </motion.p>
      </motion.div>
    </div>
  );
}
