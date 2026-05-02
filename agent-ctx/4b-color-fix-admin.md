# Task 4b: Fix Hardcoded Dark-Mode Colors in Admin Components

## Summary
Replaced all hardcoded dark-mode-only hex colors with semantic Tailwind tokens across 5 admin component files for proper light/dark mode support.

## Files Modified
1. `src/components/admin/ApiConfigCard.tsx`
2. `src/components/admin/ApiConfigPanel.tsx`
3. `src/components/admin/SecurityAuditPanel.tsx`
4. `src/components/admin/deployment-checklist.tsx`
5. `src/components/admin/SystemConfigPanel.tsx`

## Changes
- **Text colors**: `#64748b` → `text-muted-foreground`, `#e2e8f0` → `text-foreground`, `#475569` → `text-muted-foreground/70`, `#334155` → `text-muted-foreground/50`, `#94a3b8` → `text-muted-foreground`
- **Background colors**: `bg-white/[0.02-0.08]` → `bg-muted/30` through `bg-muted`
- **Border colors**: `border-white/[0.06-0.12]` → `border-border`
- **Status colors**: `#f87171` → `red-500`, `#22c55e` → `emerald-500`, `#8b5cf6` → `violet-500`
- **Muted badges**: `bg-[#64748b]/10 text-[#64748b]` → `bg-muted/80 text-muted-foreground`

## Verification
- Zero new lint errors (6 pre-existing errors in unrelated files)
- No business logic, API calls, imports, or component structure changed
- Intentionally preserved: service brand colors, custom gold theme (#d4a853), status colors not in table
