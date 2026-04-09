'use client';

import { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Diamond,
  Globe,
  LayoutDashboard,
  MapPin,
  ScanLine,
  Clock,
  MessageSquare,
  BookOpen,
  Settings,
  Crown,
  CreditCard,
  LogOut,
  Menu,
  Sun,
  Moon,
  Compass,
  Key,
  Tablet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore, type AppView } from '@/store/app-store';

/* ═══════════════════════════════════════════════════════════════
   TYPES & CONFIG
   ═══════════════════════════════════════════════════════════════ */

interface NavItem {
  label: string;
  view: AppView;
  icon: React.ElementType;
  badge?: 'unread';
}

const HOME_NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Zones', view: 'zones', icon: MapPin },
  { label: 'Scanner', view: 'scan', icon: ScanLine },
  { label: 'Historique', view: 'interactions', icon: Clock },
  { label: 'Messages', view: 'messages', icon: MessageSquare, badge: 'unread' },
  { label: 'Recettes', view: 'recipes', icon: BookOpen },
  { label: 'Tablette', view: 'display', icon: Tablet },
  { label: 'Abonnement', view: 'pricing', icon: CreditCard },
  { label: 'Paramètres', view: 'settings', icon: Settings },
];

const HOSPITALITY_NAV_ITEMS: NavItem[] = [
  { label: 'Accueil', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Guide Local', view: 'local-guide', icon: Compass },
  { label: 'Enregistrement', view: 'guest-checkin', icon: Key },
  { label: 'Scanner', view: 'scan', icon: ScanLine },
  { label: 'Messages', view: 'messages', icon: MessageSquare, badge: 'unread' },
  { label: 'Tablette', view: 'display', icon: Tablet },
  { label: 'Abonnement', view: 'pricing', icon: CreditCard },
  { label: 'Paramètres', view: 'settings', icon: Settings },
];

const ADMIN_NAV_ITEM: NavItem = {
  label: 'Admin',
  view: 'admin',
  icon: Crown,
};

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════════ */

const sidebarContentVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: -12,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const navItemHover = {
  scale: 1.015,
  transition: { duration: 0.3, ease: 'easeOut' },
};

/* ═══════════════════════════════════════════════════════════════
   NAVIGATION SIDEBAR CONTENT (shared between desktop & mobile)
   ═══════════════════════════════════════════════════════════════ */

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentView, setView } = useAppStore();
  const {
    userName,
    userAvatar,
    householdName,
    householdType,
    isAuthenticated,
    user,
    clearAuth,
  } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // Choose nav items based on household type
  const navItems = householdType === 'hospitality' ? HOSPITALITY_NAV_ITEMS : HOME_NAV_ITEMS;

  /* ── Unread messages polling ── */
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages?limit=100');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const msgs: Array<{ isRead: boolean }> =
            Array.isArray(data) ? data : data.messages || [];
          setUnreadCount(msgs.filter((m) => !m.isRead).length);
        }
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  /* ── Handlers ── */
  const handleNavClick = useCallback(
    (view: AppView) => {
      setView(view);
      onItemClick?.();
    },
    [setView, onItemClick]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearAuth();
    toast.success('Déconnecté avec succès');
    onItemClick?.();
  }, [clearAuth, onItemClick]);

  /* ── User initials ── */
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <motion.div
      className="flex flex-col h-full"
      variants={sidebarContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── Brand Header ── */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          {/* Monogram */}
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-gold flex items-center justify-center glow-gold">
              <span className="text-[#0a0a12] font-serif font-bold text-lg leading-none select-none">
                {householdType === 'hospitality' ? 'EV' : 'MC'}
              </span>
            </div>
            {householdType === 'hospitality' ? (
              <Globe className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[var(--accent-primary)] drop-shadow-[0_0_6px_rgba(212,168,83,0.6)]" />
            ) : (
              <Diamond className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[var(--accent-primary)] drop-shadow-[0_0_6px_rgba(212,168,83,0.6)]" />
            )}
          </div>
          {/* Brand Name */}
          <div className="flex flex-col min-w-0">
            <span className="font-serif text-gradient-gold text-[15px] font-semibold tracking-wide leading-tight">
              {householdType === 'hospitality' ? 'Espace' : 'Maison'}
            </span>
            <span className="font-serif text-gradient-gold text-[13px] font-medium tracking-widest uppercase leading-tight opacity-90">
              {householdType === 'hospitality' ? 'Voyageur' : 'Consciente'}
            </span>
          </div>
        </div>
      </div>

      <div className="divider-gold mx-4" />

      {/* ── User Section ── */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-[var(--accent-primary)]/50 ring-offset-2 ring-offset-[#020617] transition-all duration-500 group-hover:ring-[var(--accent-primary)]/80 group-hover:shadow-[0_0_16px_var(--accent-primary-glow)]">
              <AvatarFallback className="bg-[#1a1a2e] text-[var(--accent-primary)] text-sm font-semibold">
                {userAvatar ? (
                  <div className="relative h-full w-full overflow-hidden rounded-full">
                    <Image
                      src={userAvatar}
                      alt={userName || "Avatar utilisateur"}
                      className="h-full w-full rounded-full object-cover"
                      fill
                    />
                  </div>
                ) : (
                  initials
                )}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#020617]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#e2e8f0] truncate leading-tight">
              {userName || 'Utilisateur'}
            </p>
            <p className="text-xs text-[#64748b] truncate leading-tight mt-0.5">
              {householdName || 'Maison'}
            </p>
          </div>
        </div>
      </div>

      <div className="divider-gold mx-4" />

      {/* ── Navigation ── */}
      <ScrollArea className="flex-1 py-3 scrollbar-luxe">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item, idx) => {
            // Hide Admin item from static list; it's rendered conditionally below
            if (item.view === 'admin') return null;
            const isActive =
              currentView === item.view ||
              (item.view === 'zones' &&
                (currentView === 'zone-detail' || currentView === 'members'));
            const Icon = item.icon;

            return (
              <motion.div
                key={item.view}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.05,
                  duration: 0.35,
                  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                }}
                whileHover={navItemHover as any}
              >
                <button
                  onClick={() => handleNavClick(item.view)}
                  className={`
                    relative w-full flex items-center gap-3 h-11 px-3 rounded-lg
                    text-sm font-medium transition-all duration-[400ms] ease-out
                    outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#020617]
                    ${
                      isActive
                        ? 'text-[var(--accent-primary)] glass-gold border-l-2 border-l-[var(--accent-primary)] rounded-l-none'
                        : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] border-l-2 border-l-transparent'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors duration-[400ms] ${
                      isActive
                        ? 'text-[var(--accent-primary)] drop-shadow-[0_0_6px_var(--accent-primary-glow)]'
                        : 'text-[#64748b] group-hover:text-[#94a3b8]'
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{item.label}</span>

                  {/* Unread badge — gold pill */}
                  {item.badge === 'unread' && unreadCount > 0 && (
                    <Badge
                      className={`
                        h-5 min-w-[20px] px-1.5 text-[10px] font-semibold rounded-full
                        transition-all duration-500
                        ${
                          isActive
                            ? 'bg-[var(--accent-primary)] text-[#0a0a12] shadow-[0_0_12px_var(--accent-primary-glow)]'
                            : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                        }
                      `}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}

                  {/* Active glow indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-glow"
                      className="absolute inset-0 rounded-lg -z-10"
                      style={{
                        boxShadow:
                          'inset 0 0 20px var(--accent-primary-glow), 0 0 20px var(--accent-primary-glow)',
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              </motion.div>
            );
          })}

          {/* Admin nav — superadmin only */}
          {user?.role === 'superadmin' && (
            <motion.div
              key='admin-nav'
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: navItems.length * 0.05,
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
              }}
              whileHover={navItemHover as any}
            >
              <button
                onClick={() => handleNavClick('admin')}
                className={`
                  relative w-full flex items-center gap-3 h-11 px-3 rounded-lg
                  text-sm font-medium transition-all duration-[400ms] ease-out
                  outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#020617]
                  ${
                    currentView === 'admin'
                      ? 'text-[var(--accent-primary)] glass-gold border-l-2 border-l-[var(--accent-primary)] rounded-l-none'
                      : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/[0.04] border-l-2 border-l-transparent'
                  }
                `}
                aria-current={currentView === 'admin' ? 'page' : undefined}
              >
                <Crown
                  className={`w-[18px] h-[18px] shrink-0 transition-colors duration-[400ms] ${
                    currentView === 'admin'
                      ? 'text-[var(--accent-primary)] drop-shadow-[0_0_6px_var(--accent-primary-glow)]'
                      : 'text-[#64748b]'
                  }`}
                />
                <span className="flex-1 text-left truncate">Admin</span>
                {currentView === 'admin' && (
                  <motion.div
                    layoutId="nav-active-glow"
                    className="absolute inset-0 rounded-lg -z-10"
                    style={{
                      boxShadow:
                        'inset 0 0 20px var(--accent-primary-glow), 0 0 20px var(--accent-primary-glow)',
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            </motion.div>
          )}
        </nav>
      </ScrollArea>

      <div className="divider-gold mx-4" />

      {/* ── Logout ── */}
      <div className="px-3 pt-3 pb-2">
        <motion.div whileHover={navItemHover as any} whileTap={{ scale: 0.98 }}>
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 h-11 px-3 rounded-lg
              text-sm font-medium transition-all duration-[400ms] ease-out
              text-[#f87171]/80 hover:text-[#f87171]
              hover:bg-[#f87171]/[0.06] border-l-2 border-l-transparent
              outline-none focus-visible:ring-2 focus-visible:ring-[#f87171]/30 focus-visible:ring-offset-1 focus-visible:ring-offset-[#020617]
            "
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 transition-colors duration-400" />
            <span>Déconnexion</span>
          </button>
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 pb-4 pt-1">
        <p className="text-[10px] text-[#475569]/60 tracking-wider uppercase">
          v2.1 · {householdType === 'hospitality' ? 'Espace Voyageur' : 'Maison Consciente'} · {householdType === 'hospitality' ? 'Mode Hospitalité' : 'Mode Personnel'}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE SIDEBAR (Sheet)
   ═══════════════════════════════════════════════════════════════ */

function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-[#020617]/98 backdrop-blur-xl border-r border-white/[0.06] [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent onItemClick={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════ */

function AppHeader() {
  const { setSidebarOpen } = useAppStore();
  const { householdType } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const isDark = mounted
    ? (resolvedTheme || theme) === 'dark'
    : true;

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="
        sticky top-0 z-30 h-14 shrink-0
        flex items-center justify-between px-4 md:px-6
        glass border-b border-white/[0.06]
      "
    >
      {/* Left: hamburger + mobile brand */}
      <div className="flex items-center gap-3">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-[#94a3b8] hover:text-[var(--accent-primary)] hover:bg-white/[0.04] transition-all duration-300"
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Menu</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Mobile brand */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-full bg-gradient-gold flex items-center justify-center">
            {householdType === 'hospitality' ? (
              <Globe className="w-3.5 h-3.5 text-[#0a0a12]" />
            ) : (
              <Diamond className="w-3.5 h-3.5 text-[#0a0a12]" />
            )}
          </div>
          <span className="font-serif text-gradient-gold text-sm font-semibold tracking-wide">
            {householdType === 'hospitality' ? 'Espace Voyageur' : 'Maison Consciente'}
          </span>
        </div>
      </div>

      {/* Right: theme toggle */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#94a3b8] hover:text-[var(--accent-primary)] hover:bg-white/[0.04] transition-all duration-300"
                onClick={toggleTheme}
                aria-label="Changer le thème"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDark ? (
                    <motion.div
                      key="sun"
                      initial={{ rotate: -90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: 90, scale: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Sun className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="moon"
                      initial={{ rotate: 90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      exit={{ rotate: -90, scale: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <Moon className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isDark ? 'Mode clair' : 'Mode sombre'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP SHELL (root layout)
   ═══════════════════════════════════════════════════════════════ */

export function AppShell({ children }: { children: ReactNode }) {
  const { currentView } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a12]">
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        initial={{ x: -288, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="
          hidden md:flex flex-col w-72 shrink-0
          bg-[#020617]/95 backdrop-blur-xl
          border-r border-white/[0.06]
          h-full
        "
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile Sidebar ── */}
      <MobileSidebar />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader />

        <main className="flex-1 overflow-y-auto scrollbar-luxe">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="p-4 md:p-6 lg:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
