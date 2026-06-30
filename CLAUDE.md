# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b (typecheck) then vite build
npm run lint       # oxlint
npm run preview    # serve the production build
```

There is **no test runner** configured. `npm run build` is the typecheck gate — run it to verify changes compile (TypeScript is `strict` with `noUnusedLocals`/`noUnusedParameters`).

Requires `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). The app throws at startup in `src/lib/supabase.ts` if either is missing.

## Architecture

A Vietnamese-language PWA for planning and tracking trip spending (VND). React 19 + Vite + Tailwind v4 + Supabase, no backend of its own.

### Data flow: layered, one direction

`page/component → store → repository → Supabase`

- **Repositories** (`src/repositories/*.repository.ts`) are the **only** place that touches Supabase. Each owns the `snake_case` DB row ↔ `camelCase` domain-type mapping (`toTrip`/`toItem`/`toRow`) and wraps every Supabase error in `SupabaseError`. Keep them pure data access — no React, no business logic.
- **`src/store/trip-store.tsx`** is the single source of app state via `TripProvider` + `useTripStore()`. It applies **optimistic updates** (mutate local state first, fire the repository call, and `reload()` on failure with a toast). Components never call repositories directly — they go through the store.
- **`src/services/budget.service.ts`** holds pure derivation functions (`computeSummary`, `groupByDay`, `totalsByCategory`, `totalsByDay`). No I/O, no state — given `trip` + `items`, return aggregates. Put new budget math here.
- **Components/pages** read from `useTripStore()` and render. Three routes under `AppShell`: `/` (PlanPage), `stats` (StatsPage), `settings` (SettingsPage).

### Auth model — important

There is **no authentication**. A trip is identified by its unguessable UUID, which acts as a share/sync code (see `Onboarding` "open by code" and QR sharing). RLS policies in `supabase/schema.sql` grant the `anon` role full access. Consequences:
- Never store sensitive data in `trips`/`items`.
- The active trip id is persisted in `localStorage` under `trip-budget:active-trip-id`; "switch trip" clears it and returns to onboarding.

### App lifecycle states

`TripProvider` gates the whole app on a `Status` machine: `loading | onboarding | ready | error`. Children only render in `ready`; otherwise the provider shows the loading / error / `Onboarding` screen itself. When editing top-level flow, account for all four states.

### Domain types

`src/types/trip.ts` is the canonical model: `Trip`, `TripItem`, `CategoryId` (a `const` tuple → union), `PaymentStatus`. Currency is hardcoded `'VND'`. Category metadata (labels, colors, icons) lives in `src/constants/categories.ts`, keyed by `CategoryId`.

## Conventions

- **Path alias `@/`** → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`). Use it for all intra-`src` imports.
- **UI primitives** are local components in `src/components/ui/` (`Button`, `Select`, `AmountInput`, `ProgressBar`) built on Radix (`@radix-ui/react-dialog`, `@radix-ui/react-select`) + Tailwind. There is no external component library. Compose classes with `cn()` (`src/lib/cn.ts`, thin `clsx` wrapper).
- **Styling**: Tailwind v4 with the design system defined as CSS variables in `@theme` in `src/index.css` (semantic color tokens like `ocean`, `coral`, `sand`, `ink`; `font-display` Fraunces / `font-sans` Be Vietnam Pro; `rounded-card`, `shadow-card`). Use these tokens, not raw hex.
- **Money**: format via `src/lib/format.ts` (`formatVnd`, `formatVndCompact`, `parseAmount`). Amounts are integers (VND has no minor unit). `AmountInput` handles digit grouping on input.
- **User-facing strings are Vietnamese**; code identifiers stay English.
- **Errors**: throw `SupabaseError` (`src/lib/errors.ts`) from repositories; surface to users with `toast` from `sonner`.
- **Linting**: oxlint (not ESLint), config in `.oxlintrc.json` — `react/rules-of-hooks` is an error.

## PWA

`vite-plugin-pwa` with `registerType: 'autoUpdate'`; manifest is inline in `vite.config.ts`. The service worker only exists in the built output, so PWA/offline behavior must be verified via `npm run build && npm run preview`, not `npm run dev`.
