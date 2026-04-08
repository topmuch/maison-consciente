# Task d11 — Settings Panel Components

## Work Log
- Added `ASSISTANT_NAMES`, `DEFAULT_ASSISTANT_NAME`, `isValidAssistantName`, `VoiceSettings`, and `DEFAULT_VOICE_SETTINGS` to `/src/lib/config.ts`
- Created `/src/components/settings/voice-settings-panel.tsx` — Voice assistant name grid, wake word toggle, speech rate/volume sliders, test voice button, language selector
- Created `/src/components/settings/news-settings-panel.tsx` — RSS source checkboxes (5 sources), refresh interval dropdown, test headlines button
- Created `/src/components/settings/preferences-panel.tsx` — Detected preferences display, manual overrides (genre, zodiac, dietary), learning mode toggle, clear memory with confirmation dialog
- Created `/src/components/settings/hospitality-extended-panel.tsx` — WhatsApp number input, module toggles (Room Service, Activities, Wellness), check-in/check-out alerts, calendar events display
- Updated `/src/components/settings/settings-page.tsx` to import and integrate all 4 new panels with staggered fadeUp animations (custom indices 7-10)

## Key Design Decisions
- All panels are self-contained `'use client'` components with named exports
- Consistent use of `GlassCard`, shadcn/ui components, amber/gold accent colors
- Fetch settings from `GET /api/household/settings`, save via `PATCH /api/household/settings`
- Loading skeletons during initial fetch
- Toast notifications on save (sonner)
- Error handling for all async operations
- Existing `VoiceSettingsPanel` from voice/ kept as-is; new one imported with alias `ExtendedVoicePanel`

## Files Modified
- `src/lib/config.ts` — Added assistant name constants and voice settings types
- `src/components/settings/voice-settings-panel.tsx` — NEW
- `src/components/settings/news-settings-panel.tsx` — NEW
- `src/components/settings/preferences-panel.tsx` — NEW
- `src/components/settings/hospitality-extended-panel.tsx` — NEW
- `src/components/settings/settings-page.tsx` — Added imports and 4 new section blocks

## Status
- All lint checks pass (0 errors in src/)
- Dev server running successfully
