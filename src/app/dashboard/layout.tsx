import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/server-auth";
import { prisma } from "@/lib/db";

/* ═══════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Auth Guard

   Server component that validates the session before
   rendering any /dashboard/* page. Redirects to /
   with ?auth=required if not authenticated.
   ═══════════════════════════════════════════════════════ */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const authData = await getAuthUser();

    // Get household details for the header
    const household = await prisma.household.findUnique({
      where: { id: authData.householdId },
      select: {
        name: true,
        type: true,
        templateSlug: true,
      },
    });

    return (
      <div className="min-h-screen bg-[var(--bg-primary, #020617)] text-[var(--text-primary, #f8fafc)]">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-40 border-b border-[var(--border, rgba(212,168,83,0.15))] bg-[var(--bg-primary, #020617)]/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo + Household */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent, #d4a853)] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-[var(--text-primary)]">
                    {household?.name || "Maison Consciente"}
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {authData.user.name || authData.user.email}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary, #0f172a)] transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              {/* User Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-sm font-medium text-[var(--accent)]">
                  {authData.user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Nav */}
          <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[var(--border, rgba(212,168,83,0.15))] py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-[var(--text-secondary)]">
              Maellis — Maison Consciente &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    );
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === "UNAUTHORIZED" || err.message === "NO_HOUSEHOLD")
    ) {
      redirect("/?auth=required");
    }
    redirect("/?auth=required");
  }
}

/* ─── Navigation Items ─── */
const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Modules", href: "/dashboard/modules" },
  { label: "Calendrier", href: "/dashboard/calendar" },
  { label: "Paramètres", href: "/dashboard/settings" },
  { label: "Voix", href: "/dashboard/settings/voice" },
  { label: "Santé", href: "/dashboard/settings/health" },
  { label: "Connaissances", href: "/dashboard/settings/knowledge" },
  { label: "Activités", href: "/dashboard/settings/activities" },
];
