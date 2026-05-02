---
Task ID: 2
Agent: full-stack-developer
Task: Deep redesign of dashboard and homepage — fix light/dark mode + modernize

Work Log:
- Read and analyzed all target files: page.tsx, settings/page.tsx, dashboard.tsx, NotificationSettingsPanel.tsx, globals.css
- Rewrote `/src/app/page.tsx` with warm amber/gold palette replacing all blue/indigo/violet references
- Fixed `/src/app/dashboard/settings/page.tsx` by replacing CSS variable references (var(--text-primary), var(--bg-card), var(--border), var(--accent)) with proper Tailwind semantic classes
- Fixed `/src/components/dashboard/dashboard.tsx` by replacing hardcoded dark-only colors (oklch values, bg-black/N, bg-white/[0.0N], border-white/[0.0N], text-amber-50, inner-glow, ring-[#0a0a12]) with proper light/dark-compatible Tailwind classes
- Fixed `/src/components/notifications/NotificationSettingsPanel.tsx` by replacing hardcoded hex colors (#e2e8f0, #475569, #64748b, #94a3b8) and dark-only patterns with semantic Tailwind classes
- Fixed a parsing error (unterminated string literal) caused by a stray quote during bulk replacement
- Ran lint — all 6 remaining errors are pre-existing in unrelated files (daemon.js, seed-superadmin.js, ThemeToggle.tsx, useMaellisVoice.ts)

Stage Summary:
- Homepage now uses warm amber/gold palette with proper light/dark mode support
- Settings page fully uses semantic Tailwind tokens (text-foreground, text-muted-foreground, bg-card, border-border)
- Dashboard components now properly render in both light and dark modes with consistent styling
- Notification settings panel fully supports light/dark mode
- All functionality, API calls, state management, animations, and component structure preserved
- No business logic or imports changed

---
Task ID: 2 (continued)
Agent: full-stack-developer
Task: Redesign DashboardClientShell to use gold/amber luxury theme with semantic tokens

Work Log:
- Read existing `/src/components/dashboard/DashboardClientShell.tsx` (376 lines)
- Applied all 15 specific color/theme replacements from slate/blue to amber/gold semantic tokens
- Added `Sparkles` to lucide-react imports for brand header
- Added gold accent gradient line at top of sidebar (`h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500`)
- Added Maellis brand header block with Sparkles icon and "Maison Consciente" subtitle
- Replaced active nav: `bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400` → `bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`
- Replaced inactive nav: `text-slate-600 hover:bg-slate-50 ...` → `text-muted-foreground hover:bg-muted hover:text-foreground ...`
- Replaced sidebar bg: `bg-white dark:bg-slate-800` → `bg-card`
- Replaced main bg: `bg-slate-100 dark:bg-slate-900` → `bg-muted/50`
- Replaced all borders: `border-slate-200 dark:border-slate-700` → `border-border`
- Replaced avatars: `bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300` → `bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300`
- Replaced search focus: `focus-visible:ring-blue-500 focus-visible:border-blue-500` → `focus-visible:ring-primary focus-visible:border-primary`
- Replaced user info: `text-slate-800 dark:text-slate-100` → `text-foreground`
- Replaced household indicator: `bg-slate-50 dark:bg-slate-700/50` → `bg-muted`
- Replaced content area: `bg-slate-50 dark:bg-slate-900` → `bg-muted/30`
- Replaced settings subnav border: `border-slate-200 dark:border-slate-600` → `border-border`
- Replaced footer text: `text-slate-400 dark:text-slate-500` → `text-muted-foreground`
- Replaced header: `bg-white dark:bg-slate-800` → `bg-card` with `border-border`
- Replaced theme toggle: `text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700` → `text-muted-foreground hover:bg-muted`
- Replaced household icon: `text-slate-400 dark:text-slate-500` → `text-muted-foreground`
- Ran lint — 0 new errors introduced; 6 pre-existing errors in unrelated files

Stage Summary:
- DashboardClientShell fully redesigned with warm amber/gold luxury palette
- All colors use semantic Tailwind tokens (bg-card, border-border, text-muted-foreground, etc.) for proper light/dark mode
- Gold accent gradient bar at sidebar top + Sparkles brand header preserved
- All functionality, imports, component interfaces, and business logic preserved
- Mobile responsive layout unchanged — only visual tokens updated

---
Task ID: 3
Agent: full-stack-developer
Task: Review and refine dashboard.tsx for consistent gold/amber luxury theme

Work Log:
- Read and analyzed `/src/components/dashboard/dashboard.tsx` (1075 lines)
- Verified all `bg-muted` usage is semantic and correct
- Verified all cards use `glass` class consistently (hero, stat cards, presence, weather, messages wall, activity feed, tips, skeletons)
- Verified quick action buttons use `bg-gradient-gold` and `var(--accent-primary)` correctly
- Verified activity feed empty state already uses proper gold accent styling

Fixes applied (4 targeted edits):
1. **Stat card "Zones actives"** (lines 694-696): Replaced hardcoded purple `#8b5cf6` (violet-500) icon background/color with warm rose-gold `#b88a7a` and updated glow from `oklch(0.60_0.22_280)` (violet hue 280°) to `oklch(0.65_0.10_35)` (warm hue 35°)
2. **Hero gradient** (line 720): Replaced `rgba(139,92,246,0.2)` (violet) corner gradient with `rgba(184,138,122,0.2)` (warm rose-gold) to maintain warm luxury palette
3. **Messages empty state** (lines 402-407): Added gold accent icon container (`bg-[var(--accent-primary)]/[0.06] border border-[var(--accent-primary)]/10`) matching the activity empty state pattern, replaced bare muted icon with gold-tinted MessageSquare
4. **"Nouvelle Note" button** (line 851): Changed hover from plain `hover:bg-muted` to `hover:bg-[var(--accent-primary)]/[0.06] hover:border-[var(--accent-primary)]/20` to match the AmbianceButton's inactive hover pattern

Verification:
- Ran lint — 0 new errors; all 6 pre-existing errors are in unrelated files
- Dev server compiles successfully

Stage Summary:
- All remaining non-gold hardcoded colors in dashboard.tsx replaced with warm luxury palette tones
- Purple/violet (#8b5cf6) eliminated from stat cards and hero gradient
- Empty states now consistently use gold accent icon containers
- Action buttons use uniform gold hover patterns
- No business logic, API calls, state management, or component structure changed

---
Task ID: 5
Agent: full-stack-developer
Task: Refine landing page — noise texture, enhanced hero, premium cards, How It Works section, gold pricing border, scroll animations

Work Log:
- Read existing `/src/app/page.tsx` (655 lines) and `/src/app/globals.css` (456 lines)
- Identified all 6 enhancement requirements and planned implementation

Changes applied to `/src/app/page.tsx`:
1. **Noise/grain texture overlay on Hero**: Added SVG `feTurbulence` noise as data URI overlay div with `mix-blend-overlay` (light) and `mix-blend-soft-light` (dark) for premium film-grain feel
2. **Enhanced Hero section**: Replaced flat `from-amber-50 via-orange-50/50 to-background` gradient with dramatic multi-layer composition — `from-amber-50 via-orange-50/60 to-background` with separate bottom fade gradient; added subtle CSS grid pattern (64px) masked with linear gradient for smooth fade-out; added extra warm background orbs (yellow, orange) for depth; upgraded CTA button to `shadow-lg` with hover `shadow-xl`
3. **Enhanced DualAudience cards**: Added `hover:-translate-y-1`, `hover:shadow-xl`, color-matched `hover:shadow-amber-500/5` / `hover:shadow-emerald-500/5`; added inner gradient overlay divs that reveal on hover (`group-hover:from-amber-500/5`); improved icon hover to include `group-hover:shadow-md`; tag borders now animate on hover; increased transition duration to 500ms for premium feel
4. **Added "How It Works" section**: New component between Features and DemoCTA with 3 steps — ScanLine icon (Scannez un QR Code), Brain icon (Recevez des suggestions IA), Sparkles icon (Vivez l'expérience connectée); connected by gradient connector lines with arrow icons (desktop); numbered step badges; icon cards with hover scale+shadow effects; warm background orb decoration
5. **Enhanced PricingPreview "Best Value" card**: Replaced simple amber border with gold gradient border using wrapper div technique (`p-[1.5px] bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500`); added animated shimmer sweep effect using custom CSS keyframe; added `shadow-xl shadow-amber-500/10` for elevated prominence
6. **Scroll-triggered animations**: Changed `fadeUp` to use `whileInView` with `viewport: { once: true, amount: 0.2 }` instead of `animate`; updated `stagger`/`staggerItem` to use `whileInView`; all sections (DualAudience, Features, HowItWorks, PricingPreview) now animate into view on scroll; Hero retains immediate `animate` since it's above the fold

Changes applied to `/src/app/globals.css`:
- Added `@keyframes border-shimmer` animation (translateX + rotate for card shimmer sweep effect)

Verification:
- Ran lint — 0 new errors from page.tsx; all 6 pre-existing errors are in unrelated files (ThemeToggle.tsx, useMaellisVoice.ts)
- Dev server compiles and serves `/` successfully (200 responses)
- Added `ScanLine` to lucide-react imports
- All existing sections preserved (Navbar, Hero, DualAudience, Features, DemoCTA, PricingPreview, Footer)
- All existing links, navigation, imports, and business logic unchanged
- French language throughout; amber/gold color scheme only (emerald preserved for Airbnb sections)

Stage Summary:
- Landing page now has premium film-grain texture on hero with dramatic multi-layer gradient and grid pattern
- DualAudience cards feature sophisticated hover animations with translateY, glow shadows, and inner gradient reveals
- New "Comment ça marche" section provides clear 3-step user flow with connected step indicators
- Best Value pricing card has eye-catching gold gradient border with animated shimmer sweep
- All below-fold sections animate into view using framer-motion viewport detection
- Maintains full compatibility with light/dark mode and mobile responsive design

## Task 4: Admin Dashboard Color Token Migration

**Date**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**File**: `src/components/admin/admin-dashboard.tsx`

### Changes Made
Replaced all hardcoded dark-mode-only hex colors with semantic Tailwind tokens for proper light/dark mode support:

#### Text Colors
- `text-[#64748b]` → `text-muted-foreground` (general muted text)
- `text-[#e2e8f0]` → `text-foreground` (light text)
- `text-[#475569]` → `text-muted-foreground/70` (dimmer text)
- `text-[#334155]` → `text-muted-foreground/50` (very dim text)
- `text-[#94a3b8]` → `text-muted-foreground` (hover text, via hover variant)
- `placeholder:text-[#475569]` → `placeholder:text-muted-foreground/70`

#### Background Colors
- `bg-white/[0.04]` → `bg-muted/50`
- `bg-white/[0.06]` → `bg-muted`
- `bg-white/[0.02]` → `bg-muted/30`
- `bg-white/[0.03]` → `bg-muted/40`
- `hover:bg-white/[0.02]` → `hover:bg-muted/30`
- `hover:bg-white/[0.03]` → `hover:bg-muted/40`
- `hover:bg-white/[0.04]` → `hover:bg-muted/50`

#### Border Colors
- `border-white/[0.06]` → `border-border`
- `border-white/[0.08]` → `border-border`

#### Badge/Status Colors
- `bg-[#f87171]/10 text-[#f87171]` → `bg-red-500/10 text-red-500`
- `bg-[#22c55e]/10 text-[#22c55e]` → `bg-emerald-500/10 text-emerald-500`
- `bg-[#3b82f6]/10 text-[#3b82f6]` → `bg-blue-500/10 text-blue-500`
- `bg-[#8b5cf6]/10 text-[#8b5cf6]` → `bg-violet-500/10 text-violet-500`
- `bg-[#8b5cf6]/15 text-[#8b5cf6]` → `bg-amber-500/15 text-amber-500` (Zones card)
- `bg-[#c77d5a]/10 text-[#c77d5a]` → `bg-copper/10 text-copper`
- `bg-[#64748b]/10 text-[#64748b]` → `bg-muted/80 text-muted-foreground`

#### Hover States
- `hover:text-[#f87171] hover:bg-[#f87171]/10` → `hover:text-red-500 hover:bg-red-500/10`
- `hover:text-[#3b82f6] hover:bg-[#3b82f6]/10` → `hover:text-blue-500 hover:bg-blue-500/10`
- `hover:text-[#c77d5a] hover:bg-[#c77d5a]/10` → `hover:text-copper hover:bg-copper/10`

#### Empty State Backgrounds
- `bg-[#c77d5a]/[0.06] border-[#c77d5a]/10` → `bg-copper/[0.06] border-copper/10`
- `bg-[#8b5cf6]/[0.06] border-[#8b5cf6]/10` → `bg-violet-500/[0.06] border-violet-500/10`
- `text-[#c77d5a]/50` → `text-copper/50`
- `text-[#8b5cf6]/50` → `text-violet-500/50`

### Verification
- No lint errors in modified file
- No business logic changed
- All imports, types, component structure preserved

---

## Task 4b: Fix Hardcoded Dark-Mode Colors in Admin Components (Batch 2)

**Date**: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
**Files**: 5 admin component files under `src/components/admin/`

### Files Processed
1. `ApiConfigCard.tsx` (422 lines)
2. `ApiConfigPanel.tsx` (600 lines)
3. `SecurityAuditPanel.tsx` (1095 lines)
4. `deployment-checklist.tsx` (316 lines)
5. `SystemConfigPanel.tsx` (612 lines)

### Replacements Applied (across all 5 files)

#### Text Colors
- `text-[#e2e8f0]` → `text-foreground`
- `text-[#64748b]` → `text-muted-foreground`
- `text-[#94a3b8]` → `text-muted-foreground`
- `text-[#475569]` → `text-muted-foreground/70`
- `text-[#334155]` → `text-muted-foreground/50`
- `bg-[#64748b]` (standalone) → `bg-muted-foreground`

#### Background Colors
- `bg-white/[0.02]` → `bg-muted/30`
- `bg-white/[0.03]` → `bg-muted/40`
- `bg-white/[0.04]` → `bg-muted/50`
- `bg-white/[0.06]` → `bg-muted`
- `bg-white/[0.08]` → `bg-muted`
- `bg-[#64748b]/10 text-[#64748b]` → `bg-muted/80 text-muted-foreground`

#### Border Colors
- `border-white/[0.06]` → `border-border`
- `border-white/[0.08]` → `border-border`
- `border-white/[0.12]` → `border-border` (closest match)
- `border-white/5` → `border-border` (closest match)
- `divide-white/5` → `divide-border` (closest match)

#### Compound Badge/Status Patterns
- `bg-[#f87171]/10 text-[#f87171]` → `bg-red-500/10 text-red-500`
- `bg-[#f87171]` (standalone) → `bg-red-500`
- `text-[#f87171]` (standalone) → `text-red-500`
- `bg-[#22c55e]/10 text-[#22c55e]` → `bg-emerald-500/10 text-emerald-500`
- `bg-[#22c55e]` (standalone) → `bg-emerald-500`
- `text-[#22c55e]` (standalone) → `text-emerald-500`
- `border-[#22c55e]` → `border-emerald-500`
- `bg-[#8b5cf6]/10 text-[#8b5cf6]` → `bg-violet-500/10 text-violet-500`
- `bg-[#8b5cf6]` (standalone) → `bg-violet-500`
- `text-[#8b5cf6]` (standalone) → `text-violet-500`
- `border-[#8b5cf6]` → `border-violet-500`
- `bg-[#e2e8f0]/10` → `bg-foreground/10`

### Intentionally Unchanged
- Service brand colors in SERVICE_REGISTRY (Foursquare pink, Google blue, etc.)
- `#d4a853` custom gold theme in SecurityAuditPanel (not in replacement table)
- `#f43f5e` rose-500 for Sentry category (not in replacement table)
- `#eab308` yellow for "untested" status badge (not in replacement table)
- `[var(--accent-primary)]` references (KEEP AS IS per instructions)

### Lint Results
```
✖ 6 problems (6 errors, 0 warnings)
```
All 6 errors are **pre-existing** in unrelated files (ThemeToggle.tsx, useMaellisVoice.ts).
**Zero new lint errors** introduced by this task.

---

## Task 6: Superadmin API Routes — Stats, Clients, Subscriptions, AI Config

**Agent**: full-stack-developer
**Files modified/created**:
1. `/src/app/api/admin/stats/route.ts` (ENHANCED)
2. `/src/app/api/admin/clients/route.ts` (NEW)
3. `/src/app/api/admin/subscriptions/route.ts` (NEW)
4. `/src/app/api/admin/ai-config/route.ts` (NEW)

### 1. Enhanced Stats (`/api/admin/stats`)
**Before**: Returned only `totalHouseholds`, `totalUsers`, `totalZones`, `totalInteractions`.

**After**: Returns comprehensive dashboard data:
- `totalInvoices`, `paidInvoices`, `pastDueInvoices` (invoice counts)
- `totalRevenueCents` (aggregate of all paid invoices)
- `activeSubscriptions` (households with active/trialing status)
- `subscriptionBreakdown` (counts per plan: free, starter, comfort, prestige, pro)
- `recentActivity` (last 10 UserLog entries with user/household relations)
- `monthlyGrowth` (last 6 months of new household registrations, formatted in French)

All queries run in parallel via `Promise.all` for performance.

### 2. Clients (`/api/admin/clients`)
GET endpoint with:
- **Pagination**: `page`, `limit` (max 100) query params
- **Search**: `search` param filters by household name, contactEmail, or user email (using OR + contains)
- **Filtering**: `type` (home/hospitality), `subscriptionPlan` (free/starter/comfort/prestige/pro), `subscriptionStatus` (active/trialing/past_due/canceled/inactive)
- **Sorting**: `sortBy` (createdAt/name/subscriptionPlan/subscriptionStatus) + `sortOrder` (asc/desc)
- **Response**: Each client includes `memberCount`, `zoneCount`, and `lastActivity` (latest UserLog timestamp)
- **Pagination metadata**: `page`, `limit`, `total`, `totalPages`

### 3. Subscriptions (`/api/admin/subscriptions`)
**GET**: Returns hardcoded plan definitions merged with real DB counts:
- 4 plans: Gratuit (free, 0€), Starter (19€), Confort (49€), Prestige (99€)
- Each plan includes `features` array, `description`, `priceFormatted`, and `counts` object (total, active, trialing, past_due, canceled, inactive)

**PUT**: Manages subscription changes for a household:
- `action: "upgrade"` — validates plan is higher tier, sets status to active, extends 1 month
- `action: "downgrade"` — validates plan is lower tier, sets status to active, extends 1 month
- `action: "cancel"` — sets status to canceled, resets plan to free
- `action: "extend"` — extends subscription by `months` param (default 1, max 24)
- All mutations create audit UserLog entries
- Returns updated household state

### 4. AI Config (`/api/admin/ai-config`)
**GET**: Returns AI configuration from `SystemConfig` (category "ai") merged with defaults:
- 6 config keys: `ai_model` (gemini-2.0-flash), `ai_temperature` (0.7), `ai_max_tokens` (4096), `ai_system_prompt`, `ai_voice_enabled` (true), `ai_language` (fr-FR)
- Each entry includes `value`, `defaultValue`, `label`, `description`, `type`, `isCustomized` flag, `systemConfigId`
- Also returns AI-related `ApiConfig` entries (GOOGLE_AI, OPENAI, ANTHROPIC, RETELL) with status info

**PUT**: Updates a single AI config value:
- Validates key is a known AI config key
- Type validation for number and boolean fields
- Upserts into `SystemConfig` (creates if missing, updates if exists)
- Creates audit UserLog entry with previous/new value tracking

### Common Patterns
- All routes use `await requireRole("superadmin")` for auth
- All routes use `import { db } from "@/core/db"`
- Consistent error handling: 401 UNAUTHORIZED, 403 FORBIDDEN, 500 internal errors
- Consistent response format: `{ success: true, ...data }` or `{ success: false, error: "message" }`
- French error messages throughout

### Lint Results
```
✖ 6 problems (6 errors, 0 warnings)
```
All 6 errors are **pre-existing** in unrelated files (daemon.js, seed-superadmin.js, ThemeToggle.tsx, useMaellisVoice.ts).
**Zero new lint errors** introduced by this task.

---
Task ID: 7
Agent: main
Task: Build complete superadmin dashboard with all modules

Work Log:
- Traversed entire project structure: prisma schema, auth system, dashboard layout, sidebar, existing admin components
- Created 4 new API routes: clients, subscriptions, ai-config, enhanced stats
- Created 5 new frontend panel components: overview, clients, subscriptions, payments, ai-config
- Rewrote admin-dashboard.tsx as main orchestrator with 11-tab navigation
- Updated DashboardClientShell sidebar with superadmin sub-navigation
- All components use amber/gold luxury theme with semantic tokens
- Zero new lint errors introduced

Stage Summary:
- Complete superadmin dashboard with modules: Vue d'ensemble, Clients, Abonnements, Paiements, Configuration IA, Utilisateurs, Logs, Sécurité, APIs, Paramètres, Lancement
- New API routes: /api/admin/clients, /api/admin/subscriptions, /api/admin/ai-config
- Enhanced /api/admin/stats with revenue, subscription breakdown, monthly growth
- All existing admin panels preserved and integrated (ApiConfigPanel, SecurityAuditPanel, SystemConfigPanel, DeploymentChecklist)
- Sidebar shows superadmin sub-navigation with gold accent styling

---
Task ID: 1
Agent: main
Task: Traverse project codebase and fix superadmin dashboard auth/access issues

Work Log:
- Read entire project structure: 100+ components, 60+ API routes, comprehensive Prisma schema (40+ models)
- Identified that superadmin dashboard already exists with all required modules:
  - OverviewPanel (KPIs, subscription breakdown, monthly growth, activity feed)
  - ClientsPanel (search/filter, pagination, detail view)
  - SubscriptionsPanel (plan cards, MRR, subscriber counts)
  - PaymentsPanel (invoice list, financial summary, status filters)
  - AIConfigPanel (model, temperature, language, voice, system prompt settings)
  - UsersTab (search, role management, session reset)
  - LogsTab (audit log viewer with filters)
  - SystemConfigPanel (SMTP, Sentry, general settings)
  - ApiConfigPanel, SecurityAuditPanel, DeploymentChecklist
- Found critical bug: auth store not populated when navigating directly to /dashboard/admin
- Found bug: AIConfigPanel used wrong data structure (Record vs Array) for API response

Stage Summary:
- Fixed DashboardClientShell: now propagates server-side auth data to client store on mount
- Fixed AdminDashboard: added loading state and fallback fetch of /api/auth/me when store empty
- Fixed AIConfigPanel: corrected data parsing from array response, fixed apiEntries->apiConfigs
- All TypeScript compilation errors resolved for modified files
- Dev server compiles admin page successfully (307 redirect = expected without valid session)

---
Task ID: 8
Agent: main
Task: Full audit of superadmin dashboard — find and fix all bugs before declaring done

Work Log:
- Read dev.log: identified AUTH redirects (expected without session) and API_BLOCKED errors
- Read worklog.md: understood full history of dashboard development
- Audited all 11 admin components: overview-panel, clients-panel, subscriptions-panel, payments-panel, ai-config-panel, admin-dashboard, ApiConfigPanel, SecurityAuditPanel, SystemConfigPanel, DeploymentChecklist, DashboardClientShell
- Audited all 9 admin API routes: stats, clients, subscriptions, ai-config, invoices, users, logs, households, audit, analytics
- Verified Prisma schema: all referenced models exist (Invoice, UserLog, Household, Session, ApiConfig, SystemConfig, User, Zone, Interaction)
- Verified GlassCard supports variant="gold" ✅
- Verified requireRole auth guard works correctly ✅
- Logged in as superadmin via API and tested all endpoints

Bugs found and fixed:
1. **CRITICAL: ClientsPanel pagination** — `data.total` was `undefined` because API returns `data.pagination.total`. Fixed: `data.pagination?.total || data.total || 0`
2. **MEDIUM: DashboardClientShell ThemeToggle** — Used `useState(() => setMounted(true))` which doesn't work correctly. Fixed: Changed to `useEffect(() => setMounted(true), [])` with eslint-disable comment
3. **MEDIUM: Sidebar admin sub-nav** — All items linked to `/dashboard/admin` without tab param, so clicking them didn't switch tabs. Fixed: Added `tab` property to ADMIN_SUB_ITEMS, links now point to `/dashboard/admin?tab=xxx`, and AdminDashboard reads tab from URL searchParams

Verification:
- All 8 admin API endpoints tested with real session: ALL return 200 ✅
- `/dashboard/admin` page compiles and renders with session: 200 ✅
- `/dashboard/admin?tab=clients` works: 200 ✅
- ESLint: 6 pre-existing errors only (0 new from this fix) ✅

Stage Summary:
- 3 bugs found and fixed
- Full end-to-end API verification: all 8 admin endpoints return correct data
- Admin page compiles and renders successfully when authenticated
- Zero new lint errors introduced
