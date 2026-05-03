---
Task ID: 1
Agent: Main Agent (Self-Critique & Verification)
Task: Verify all landing pages and auth page use the new light Maellis design. Check dev logs, run lint, read every file.

Work Log:
- Read dev.log (last 100 lines) — ALL pages compile successfully, 0 errors
- Ran `bun run lint` — 0 errors, 0 warnings
- Read ALL page files on disk and verified their actual content:
  - `/` (page.tsx) — ✅ Light Maellis design with SiteNavbar, SiteFooter, Hero, DualAudience, Features, etc.
  - `/about` (page.tsx) — ✅ Light design: bg-background, amber accents, SiteNavbar, SiteFooter
  - `/pricing` (page.tsx) — ✅ Light design: amber/emerald accents, full pricing table, SiteNavbar, SiteFooter
  - `/contact` (page.tsx) — ✅ Light design: contact form, amber accents, SiteNavbar, SiteFooter
  - `/demo` (page.tsx) — ✅ Light design: bg-background, SiteNavbar, DemoSelection
  - `/connexion` (page.tsx) → AuthPage — ✅ Light design: amber gradients, warm bg-muted/50
  - `/legal/privacy` (page.tsx) — ✅ Light design: RGPD content, amber accents, SiteNavbar, SiteFooter
  - DemoSelection.tsx — ✅ Light: from-slate-50 via-white to-amber-50/50, white cards
  - DemoParticulier.tsx — ✅ Light: from-slate-50 via-white to-indigo-50
  - DemoAirbnb.tsx — ✅ Light: from-slate-50 via-white to-amber-50
  - SiteNavbar.tsx — ✅ Light: bg-background/80 backdrop-blur-md, amber logo
  - SiteFooter.tsx — ✅ Dark footer on light page (standard SaaS pattern)
  - ThemeToggle.tsx — ✅ Fixed: useSyncExternalStore pattern (no hydration warning)
- Checked CSS theme: :root has light values (--background: oklch(0.985...), --foreground: oklch(0.15...))
- Checked Providers: defaultTheme="light"
- Checked html: color-scheme: light (default)

Stage Summary:
- ALL 12+ files verified — every page uses the new light Maellis amber/gold SaaS design
- Zero compilation errors in dev logs
- Zero lint errors
- Theme defaults to light mode
- The design was correctly implemented in the previous session
