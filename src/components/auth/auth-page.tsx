'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Diamond, Mail, Lock, User, Eye, EyeOff, Home, Hotel } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

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

const orbFloat = {
  animate: (i: number) => ({
    y: [0, -12, 0, 8, 0],
    x: [0, 6, -4, 0],
    transition: {
      duration: 8 + i * 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

/* ─── Gold Spinner ─── */
function GoldSpinner() {
  return (
    <span className="relative flex items-center justify-center w-5 h-5">
      <span className="absolute inset-0 rounded-full border-2 border-[oklch(0.12_0.02_260)]" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-primary)] animate-spin" />
    </span>
  );
}

/* ─── Main Auth Page ─── */
export function AuthPage({ onBack, prefillType }: { onBack?: () => void; prefillType?: 'home' | 'hospitality' | null } = {}) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | null>(preffillType ? 'register' : null);
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

  const { setAuth } = useAuthStore();
  const { setView } = useAppStore();

  const handleTabChange = (value: string) => {
    if (value === activeTab) return;
    setDirection(value === 'register' ? 1 : -1);
    setActiveTab(value as 'login' | 'register');
  };

  // Auto-switch to register tab if prefillType is set
  useEffect(() => {
    if (preffillType && activeTab === null) {
      setActiveTab('register');
    }
  }, [preffillType, activeTab]);

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
    if (!regPassword || regPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
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
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur de connexion');
        return;
      }
      setAuth({
        userId: data.user.id,
        email: data.user.email,
        householdId: data.user.householdId,
        role: data.user.role,
        name: data.user.name,
        householdName: data.householdName,
      });
      setView('dashboard');
      toast.success('Bienvenue !');
    } catch {
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
      setAuth({
        userId: data.user.id,
        email: data.user.email,
        householdId: data.user.householdId,
        role: data.user.role,
        name: data.user.name,
        householdName: data.householdName,
      });
      setView('dashboard');
      toast.success('Compte créé avec succès !');
    } catch {
      toast.error('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-animated-gradient overflow-hidden noise-overlay">
      {/* ─── Decorative Glow Orbs ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Top-right gold orb */}
        <motion.div
          custom={0}
          variants={orbFloat}
          animate="animate"
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-[0.07]"
          style={{
            background:
              'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-left copper orb */}
        <motion.div
          custom={1}
          variants={orbFloat}
          animate="animate"
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{
            background:
              'radial-gradient(circle, #c77d5a 0%, transparent 70%)',
          }}
        />
        {/* Center-left violet orb */}
        <motion.div
          custom={2}
          variants={orbFloat}
          animate="animate"
          className="absolute top-1/3 -left-20 w-[320px] h-[320px] rounded-full opacity-[0.05]"
          style={{
            background:
              'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
        />
        {/* Top-left subtle gold */}
        <motion.div
          custom={3}
          variants={orbFloat}
          animate="animate"
          className="absolute top-20 left-1/4 w-[200px] h-[200px] rounded-full opacity-[0.04]"
          style={{
            background:
              'radial-gradient(circle, var(--accent-primary-light) 0%, transparent 70%)',
          }}
        />
        {/* Bottom-right faint violet */}
        <motion.div
          custom={4}
          variants={orbFloat}
          animate="animate"
          className="absolute bottom-10 right-1/4 w-[260px] h-[260px] rounded-full opacity-[0.04]"
          style={{
            background:
              'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
        />
      </div>

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
          {/* Diamond Logo */}
          <motion.div
            variants={logoVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center justify-center w-18 h-18 rounded-full mb-5 glow-gold"
            style={{
              background:
                'linear-gradient(145deg, oklch(0.78 0.14 85 / 20%), oklch(0.78 0.14 85 / 5%))',
              border: '1px solid oklch(0.78 0.14 85 / 25%)',
              width: '4.5rem',
              height: '4.5rem',
            }}
          >
            <Diamond className="w-8 h-8 text-[var(--accent-primary)]" strokeWidth={1.5} />
          </motion.div>

          {/* Brand Name */}
          <h1 className="font-serif text-gradient-gold text-[1.75rem] leading-tight tracking-wide">
            Maison Consciente
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-sm text-[oklch(0.60_0.02_260)] mt-2 tracking-widest uppercase">
            L&apos;Habitation Intelligente
          </p>
        </motion.div>

        {/* ─── Auth Card ─── */}
        <Card className="w-full glass-strong rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <CardContent className="p-6 pt-5 space-y-5">
            {/* Tabs */}
            <Tabs
              value={effectiveTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="relative w-full grid grid-cols-2 h-11 rounded-xl p-1 glass">
                {/* Sliding indicator */}
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-light)] shadow-lg shadow-[oklch(0.78_0.14_85/20%)]"
                  style={{
                    left: activeTab === 'login' ? '4px' : 'calc(50%)',
                  }}
                />
                <TabsTrigger
                  value="login"
                  className="relative z-10 text-sm font-medium transition-colors duration-200 data-[state=active]:text-[oklch(0.12_0.02_260)] data-[state=inactive]:text-[oklch(0.60_0.02_260)] rounded-lg cursor-pointer"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="relative z-10 text-sm font-medium transition-colors duration-200 data-[state=active]:text-[oklch(0.12_0.02_260)] data-[state=inactive]:text-[oklch(0.60_0.02_260)] rounded-lg cursor-pointer"
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Gold Divider */}
            <div className="divider-gold" />

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
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Adresse e-mail
                    </Label>
                    <div className="relative group">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] transition-colors duration-200"
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
                      className="w-full h-11 rounded-xl bg-gradient-gold text-[oklch(0.12_0.02_260)] font-semibold text-sm tracking-wide border-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <GoldSpinner />
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
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Nom complet
                    </Label>
                    <div className="relative group">
                      <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="reg-name"
                        type="text"
                        placeholder="Jean Dupont"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Household Type Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider">
                      Type de foyer
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegHouseholdType('home')}
                        className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          regHouseholdType === 'home'
                            ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.06]'
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <Home className={`w-5 h-5 ${regHouseholdType === 'home' ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.50_0.02_260)]'} transition-colors duration-300`} />
                        <span className={`text-xs font-medium ${regHouseholdType === 'home' ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.60_0.02_260)]'} transition-colors duration-300`}>
                          Personnel
                        </span>
                        {regHouseholdType === 'home' && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegHouseholdType('hospitality')}
                        className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                          regHouseholdType === 'hospitality'
                            ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.06]'
                            : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                        }`}
                      >
                        <Hotel className={`w-5 h-5 ${regHouseholdType === 'hospitality' ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.50_0.02_260)]'} transition-colors duration-300`} />
                        <span className={`text-xs font-medium ${regHouseholdType === 'hospitality' ? 'text-[var(--accent-primary)]' : 'text-[oklch(0.60_0.02_260)]'} transition-colors duration-300`}>
                          Hospitalité
                        </span>
                        {regHouseholdType === 'hospitality' && (
                          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-email"
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Adresse e-mail
                    </Label>
                    <div className="relative group">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="reg-password"
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 6 caractères"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] transition-colors duration-200"
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
                      className="text-xs font-medium text-[oklch(0.70_0.02_260)] uppercase tracking-wider"
                    >
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.50_0.02_260)] transition-colors group-focus-within:text-[var(--accent-primary)]" />
                      <Input
                        id="reg-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 rounded-xl glass border-[oklch(1_0_0/10%)] bg-transparent text-[oklch(0.95_0.01_260)] placeholder:text-[oklch(0.45_0.02_260)] focus:border-[var(--accent-primary)]/40 focus:ring-[var(--accent-primary)]/20 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] transition-colors duration-200"
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
                      className="w-full h-11 rounded-xl bg-gradient-gold text-[oklch(0.12_0.02_260)] font-semibold text-sm tracking-wide border-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2.5">
                          <GoldSpinner />
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

        {/* ─── Gold Divider ─── */}
        <div className="divider-gold w-64 my-6" />

        {/* ─── Footer ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center text-xs text-[oklch(0.45_0.02_260)] tracking-wide"
        >
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 mb-3 text-[oklch(0.50_0.02_260)] hover:text-[var(--accent-primary)] transition-colors duration-200"
            >
              ← Retour
            </button>
          )}
          © 2025 Maison Consciente — Tous droits réservés
        </motion.p>
      </motion.div>
    </div>
  );
}
