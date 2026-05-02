'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  Calendar,
  Grid3X3,
  Settings,
  User,
  Briefcase,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  LogOut,
  ChevronRight,
  Home,
  Sparkles,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { TemplateProvider } from '@/components/themes/TemplateProvider';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   MAELLIS — Dashboard Client Shell

   Client wrapper providing TemplateProvider, sidebar,
   header with dark mode toggle, and responsive layout.

   Theme: warm amber/gold luxury palette with semantic tokens.
   ═══════════════════════════════════════════════════════ */

/* ─── Types ─── */
export interface DashboardShellProps {
  children: ReactNode;
  userName: string;
  userRole?: string;
  userAvatar?: string | null;
  householdName: string;
  initialTemplateSlug?: string;
}

/* ─── Navigation Config ─── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Modules', href: '/dashboard/modules' },
  { icon: Calendar, label: 'Calendrier', href: '/dashboard/calendar' },
  { icon: Grid3X3, label: 'Widgets', href: '/dashboard/widgets' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
  { icon: User, label: 'Famille', href: '/dashboard/family' },
  { icon: Briefcase, label: 'Portfolio', href: '/dashboard/portfolio' },
] as const;

/* ─── Sub-Navigation (Settings children) ─── */
const SETTINGS_SUB_ITEMS = [
  { label: 'Voix', href: '/dashboard/settings/voice' },
  { label: 'Santé', href: '/dashboard/settings/health' },
  { label: 'Connaissances', href: '/dashboard/settings/knowledge' },
  { label: 'Activités', href: '/dashboard/settings/activities' },
] as const;

/* ─── Helpers ─── */
function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/* ─── Theme Toggle Button ─── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useState(() => {
    setMounted(true);
  });

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
      title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

/* ─── Sidebar Navigation ─── */
function SidebarNav({
  pathname,
  onItemClick,
  userRole,
}: {
  pathname: string;
  onItemClick?: () => void;
  userRole?: string;
}) {
  const showSettingsSubNav = pathname.startsWith('/dashboard/settings');

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                active
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-amber-700 dark:text-amber-300')} />
              <span>{item.label}</span>
              {active && (
                <ChevronRight className="ml-auto h-4 w-4 text-amber-700 dark:text-amber-300" />
              )}
            </Link>

            {/* Settings sub-navigation */}
            {item.href === '/dashboard/settings' && showSettingsSubNav && (
              <div className="ml-8 mt-1 flex flex-col gap-0.5 border-l-2 border-border pl-3">
                {SETTINGS_SUB_ITEMS.map((sub) => {
                  const subActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={onItemClick}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150',
                        subActive
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
                      )}
                    >
                      {sub.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Admin — only for superadmin */}
      {userRole === 'superadmin' && (
        <>
          <Separator className="my-2 bg-border" />
          <Link
            href="/dashboard/admin"
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
              isActive(pathname, '/dashboard/admin')
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
            )}
          >
            <Crown className={cn('h-5 w-5 shrink-0', isActive(pathname, '/dashboard/admin') && 'text-amber-600 dark:text-amber-400')} />
            <span>Administration</span>
          </Link>
        </>
      )}
    </nav>
  );
}

/* ─── Sidebar Content (shared between desktop & mobile) ─── */
function SidebarContent({
  userName,
  userRole,
  userAvatar,
  householdName,
  pathname,
  onItemClick,
}: {
  userName: string;
  userRole?: string;
  userAvatar?: string | null;
  householdName: string;
  pathname: string;
  onItemClick?: () => void;
}) {
  const initials = getInitials(userName);

  return (
    <div className="flex flex-col h-full">
      {/* Gold accent line */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

      {/* Brand header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-2.5">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-foreground">MAELLIS</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Maison Consciente</p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
            <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userRole || householdName}
            </p>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Household indicator */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">
            {householdName}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        <SidebarNav pathname={pathname} onItemClick={onItemClick} userRole={userRole} />
      </div>

      {/* Footer */}
      <Separator className="bg-border" />
      <div className="px-4 py-3">
        <p className="text-[10px] text-muted-foreground text-center">
          Maellis &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT: DashboardClientShell
   ═══════════════════════════════════════════════════════ */
export function DashboardClientShell({
  children,
  userName,
  userRole,
  userAvatar,
  householdName,
  initialTemplateSlug,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = getInitials(userName);

  return (
    <TemplateProvider initialSlug={initialTemplateSlug}>
      <div className="flex h-screen overflow-hidden bg-muted/50 transition-colors duration-200">
        {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
        <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card transition-colors duration-200">
          <SidebarContent
            userName={userName}
            userRole={userRole}
            userAvatar={userAvatar}
            householdName={householdName}
            pathname={pathname}
          />
        </aside>

        {/* ─── Mobile Sidebar (Sheet) ─── */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0 bg-card transition-colors duration-200">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent
                userName={userName}
                userRole={userRole}
                userAvatar={userAvatar}
                householdName={householdName}
                pathname={pathname}
                onItemClick={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* ─── Main Area ─── */}
        <div className="flex-1 flex flex-col lg:pl-[260px] min-w-0">
          {/* ─── Top Header Bar ─── */}
          <header className="sticky top-0 z-30 flex items-center gap-3 h-16 px-4 sm:px-6 border-b border-border bg-card transition-colors duration-200">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-9 bg-muted border-border text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary transition-colors"
              />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              >
                <Bell className="h-4 w-4" />
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-card" />
              </Button>

              {/* Separator */}
              <Separator orientation="vertical" className="mx-1 h-6 bg-border" />

              {/* User Avatar Dropdown */}
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-transparent hover:ring-border transition-all">
                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* ─── Content Area ─── */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/30 transition-colors duration-200">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>

            {/* Footer inside main content area */}
            <footer className="mt-8 pt-4 border-t border-border transition-colors">
              <p className="text-center text-xs text-muted-foreground">
                Maellis — Maison Consciente &copy; {new Date().getFullYear()}
              </p>
            </footer>
          </main>
        </div>
      </div>
    </TemplateProvider>
  );
}
