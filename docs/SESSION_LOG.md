# SESSION_LOG.md — FitWizard Living Project Memory

> Read this file at the start of every session before touching any code.
> Update it at session end using `/after-report`.
> Last updated: 2026-04-30

---

## Project Overview

FitWizard is a mobile-first fitness PWA for individual athletes and personal trainer/coach workflows. It generates periodized workout plans using a wizard interface, lets users log sets in real time, tracks nutrition, body measurements, strength curves, and readiness, and includes a social "circles" feature for accountability groups.

The app is pre-beta — a demo-first prototype. Most pages are intentionally guest-accessible so the product can be evaluated without an account. Account-backed features (circles membership, coach portal, template library, revenue dashboard) require Supabase auth.

**Target platforms:** Web (PWA), iOS (Capacitor), Android (Capacitor)  
**Deploy target:** Vercel (frontend) + Express on port 3001 (backend, local/server)  
**Repo:** Linkohh/fit-wizardly (GitHub)

---

## Architecture Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI Framework | React 19 + TypeScript 5.8 | Strict mode, no `any` |
| Build | Vite 7 + SWC | Fast HMR, SWC compiler |
| State | Zustand 5 + persist middleware | 18 stores, localStorage persistence |
| Server state | TanStack Query v5 | Data fetching + caching |
| Routing | React Router 7 | SPA, client-side only |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Semantic design tokens required — never hardcode `white`/`black` |
| Animations | Framer Motion 12 | GPU-accelerated transforms only |
| Backend | Express (Node.js) port 3001 | Auth-protected plan CRUD |
| Database | Supabase (PostgreSQL + Auth + Realtime) | RLS enforced at DB layer |
| Validation | Zod 4 | All API payloads + form schemas |
| i18n | i18next | 4 locales: en, es, de, pt |
| Testing | Vitest + Testing Library | 301 tests across 73 files (as of 2026-04-30) |
| Mobile | Capacitor (iOS + Android) | PWA manifest also present |

### Key Directories

```
src/
├── components/    # React components (ui/ = shadcn primitives — DO NOT MODIFY)
│   ├── recovery/  # ReadinessCard, RecoveryCheckInSheet, ReadinessTrend
│   ├── legal/     # ConsentModal
│   ├── trainer/   # Coach mode components
│   ├── analytics/ # Charts and analytics components
│   └── ...        # 23 domain subdirectories total
├── pages/         # 24 route-level pages
├── stores/        # 18 Zustand stores
├── hooks/         # 20+ custom hooks
├── lib/           # Utilities, progressionEngine, apiClient, consent
│   └── validation/  # Zod schemas
├── types/         # TypeScript types (fitness.ts, supabase.ts, readiness.ts)
├── locales/       # en.json, es.json, de.json, pt.json
└── data/          # exerciseLibrary.json (static, lazy-loaded via exerciseRepository.ts)

docs/              # Engineering, Design, Security, API, Testing lenses
supabase/migrations/ # 001–005 SQL migrations
server/src/        # Express backend (createApp/createRouteHandlers/startServer pattern)
```

### Architectural Decision Records (ADRs)

1. **Supabase for backend** — RLS removes need for middleware auth checks; Auth + Realtime included.
2. **Zustand over Redux** — less boilerplate, partial persistence via `persist` middleware.
3. **Tailwind + shadcn/ui** — speed of iteration; copy-paste components avoid style override hell.
4. **SPA (Vite)** — native-app feel prioritized over SEO (this is a logged-in dashboard product).
5. **Demo-first auth** — most routes are guest-accessible; account-backed routes use `RequireAuth` with no `strict` escape hatch.
6. **`RequireAuth` simplified** — `strict` prop removed entirely (2026-04-11). Guard has one behavior only: enforce auth.
7. **Exercise library lazy-loaded** — `src/lib/exerciseRepository.ts` wraps `exerciseLibrary.json` with caching; direct static imports removed from UI.
8. **Server refactored for testability** — `server/src/index.ts` split into `createApp` / `createRouteHandlers` / `startServer`.
9. **Coach Mode open to local/guest accounts** — `trainerStore.isTrainerAuthorized()` gates by session presence, not only `is_trainer` flag. Local = open exploration, authenticated = trainer flag required.
10. **GDPR-by-default** — all new data types must be disclosed in `Legal.tsx` (Art. 13) AND exported from `Profile.tsx` (Art. 20). All new external services need Legal disclosure + ConsentModal gate + Profile revocation.

---

## Pages Inventory

| Route | File | Auth Required |
|-------|------|---------------|
| `/` | `Index.tsx` | No |
| `/wizard` | `Wizard.tsx` | No |
| `/plan` | `Plan.tsx` | No |
| `/history` | `History.tsx` | No |
| `/analytics` | `Analytics.tsx` | No |
| `/profile` | `Profile.tsx` | No |
| `/nutrition` | `Nutrition.tsx` | No |
| `/exercises` | `exercises/ExerciseCategories.tsx` | No |
| `/exercises/:category` | `exercises/ExerciseList.tsx` | No |
| `/exercises/:category/:id` | `exercises/ExerciseDetail.tsx` | No |
| `/circles` | `Circles.tsx` | No |
| `/circles/:circleId/*` | — | Yes (RequireAuth) |
| `/clients` | `Clients.tsx` | Yes (RequireAuth + TrainerGuard) |
| `/clients/:clientId` | `ClientDetails.tsx` | Yes |
| `/templates` | `TemplateLibrary.tsx` | Yes |
| `/revenue` | `Revenue.tsx` | Yes |
| `/legal` | `Legal.tsx` | No |
| `/guide` | `UserGuide.tsx` | No |
| `/onboarding` | `Onboarding.tsx` | No |
| `/mcl` | `MCLIntegrationTest.tsx` | No |
| `*` | `NotFound.tsx` | No |

---

## Store Inventory (18 Zustand stores)

| Store | Persist Key | Purpose |
|-------|------------|---------|
| `achievementStore` | `achievement-storage` | Badges and unlocks |
| `analyticsStore` | (session only) | Event tracking (currently fires to nowhere — DEBT-002) |
| `anatomyStore` | none | Muscle selector state |
| `authStore` | `auth-storage` | Supabase auth session, user, profile |
| `circleStore` | none | Social circles state |
| `customExerciseStore` | `custom-exercises` | User-created exercises |
| `favoritesStore` | `favorites-storage` | Favorite exercises |
| `installCoachStore` | `install-coach` | PWA install prompt state |
| `measurementsStore` | `measurements-storage` | Body measurements |
| `motivationStore` | none | Daily quotes rotation |
| `nutritionStore` | `nutrition-storage` | Food logging |
| `onboardingStore` | `onboarding-storage` | Onboarding flow state |
| `planStore` | `plan-storage` | Workout plans, logs, personal records |
| `preferencesStore` | (via usePreferencesStore) | User preferences |
| `readinessStore` | `readiness-storage` | Daily recovery check-ins |
| `themeStore` | `theme-storage` | Dark/light/system mode |
| `trainerStore` | `trainer-storage` | Coach mode toggle |
| `wisdomStore` | `wisdom-storage` | Wisdom quotes |

---

## Supabase Migrations Status

| File | Tables | Status |
|------|--------|--------|
| `001_circles_schema.sql` | circles, circle_members, circle_activities, circle_challenges, challenge_participants | Applied |
| `002_exercise_interactions_schema.sql` | exercise_interactions, user_exercise_preferences | **May be missing in prod (SEC-005)** |
| `003_social_features.sql` | activity_reactions, activity_comments, circle_posts | Applied |
| `004_plans_schema.sql` | plans | **May be missing in prod (SEC-005)** |
| `005_trainer_roles.sql` | trainer role extension | Status unknown |

**Action required:** Apply migrations 002 and 004 to production Supabase before plan sync or exercise community stats are expected to work.

---

## Session History

### 2026-04-30 — Full App Code Audit + i18n/GDPR Fixes

- **What was done:** Manual full-app code audit covering all stores, pages, components, hooks, lib, locales, and server. Also fixed i18n violations in ReadinessTrend.tsx and two GDPR disclosure gaps (readiness data added to Legal.tsx and Profile.tsx data export). SESSION_LOG.md and /after-report skill created as permanent project memory tools.
- **Files changed:**
  - `src/components/recovery/ReadinessTrend.tsx` — fixed 3 hardcoded EN strings + hardcoded `'en-US'` locale
  - `src/locales/en.json` + `es.json` + `de.json` + `pt.json` — added `recovery.tooltip_score` + `recovery.tooltip_status`
  - `src/pages/Legal.tsx` — added GDPR Art. 13 readiness data disclosure paragraph
  - `src/pages/Profile.tsx` — added `readinessLogs` to data export, consent revocation UI wired
  - `docs/SESSION_LOG.md` — created (this file)
  - `~/.claude/skills/after-report/SKILL.md` — created (Claude Code session reporting skill)
- **Issues fixed this session:**
  - DEBT (new): ReadinessTrend i18n — `getBandLabel()`, `CustomTooltip`, `formatDate` all hardcoded EN — FIXED
  - DEBT (new): GDPR Art. 13 readiness data missing from Legal.tsx — FIXED
  - DEBT (new): GDPR Art. 20 readiness logs missing from Profile.tsx data export — FIXED
  - (PR #28) ConsentModal analytics pre-checked `true` → fixed to `false`
  - (PR #28) ConsentModal non-dismissible → modal can now be closed
  - (PR #28) OpenFoodFacts IP address disclosure added to Legal.tsx
  - (PR #28) Consent revocation button wired in Profile.tsx
- **New issues found:** AUDIT-001 (HIGH), AUDIT-002 (HIGH), AUDIT-003 (MEDIUM), AUDIT-004 (MEDIUM), AUDIT-005 (LOW), AUDIT-006 (LOW) — see Known Issues table
- **TODO/FIXME introduced:** none (pre-existing TODOs unchanged)
- **Test status:** 301 passing / 73 files — matches baseline ✅
- **Legal/compliance notes:** Readiness data Art. 13 disclosure added to Legal.tsx. Readiness logs included in Art. 20 data export in Profile.tsx. ConsentModal analytics consent now defaults to `false` (GDPR compliant). Consent revocation UI wired to Privacy Settings in Profile.tsx.
- **Key decisions made:** SESSION_LOG.md established as permanent living project memory; /after-report skill created for automated session reporting at session end.
- **Open issues carried forward:** SEC-001, SEC-005, DEBT-001 through DEBT-009, AUDIT-001 through AUDIT-006
- **Next steps:**
  1. Merge PR #28 into `preview_b`
  2. Translate DE and PT locales — 310 keys missing each (AUDIT-001, AUDIT-002)
  3. Rotate legacy Supabase anon JWT in Supabase dashboard (SEC-001)
  4. Apply migrations 002 + 004 to production (SEC-005)
  5. Guard or remove `/mcl` dev route from production build (AUDIT-004)

---

### 2026-04-30 — i18n + GDPR Data Export Fixes (PR #28 follow-up)

- **What was done:** Two code review issues from PR #28 resolved before merge.
- **Commits:**
  - `d5f6d705` Fix 2 code review issues from PR #28
- **Files changed:**
  - `src/components/recovery/ReadinessTrend.tsx` — `getBandLabel()` now accepts `TFunction`; `CustomTooltip` uses `useTranslation()`; `formatDate()` uses `i18n.language` instead of hardcoded `'en-US'`
  - `src/locales/en.json`, `es.json`, `de.json`, `pt.json` — Added `recovery.tooltip_score` / `recovery.tooltip_status` keys
  - `src/pages/Legal.tsx` — Added "Readiness & Recovery Check-Ins" paragraph to privacy tab
  - `src/pages/Profile.tsx` — Added `useReadinessStore` import and `readinessLogs` to `handleExportData`
- **Issues fixed:** None from the tracked list (these were code-review findings not yet in the table)
- **New issues found:** None
- **TODO/FIXME introduced:** None (pre-existing TODOs unchanged)
- **Test status:** 301/301 passing (73 files), 0 lint errors
- **Legal/compliance notes:** GDPR Art. 13 — readiness health data now disclosed in Legal.tsx privacy tab. GDPR Art. 20 — readiness logs now included in user data export.
- **Key decisions made:** Privacy-by-design rule established: all new data types stored locally must be (a) disclosed in Legal.tsx and (b) included in the data export handler.
- **Open issues carried forward:** SEC-001, SEC-005, DEBT-001 through DEBT-008
- **Next steps:** Merge PR #28 into preview_b

---

### 2026-04-29 — Recovery Dashboard + Coach Mode + Consent Compliance (PR #28)

- **What was done:** Large feature + compliance session covering three areas.
  - **Recovery Dashboard:** `ReadinessCard` on home page (compact pre/post check-in card), `RecoveryCheckInSheet` (bottom sheet, 4 emoji selectors, 1–5 scale), `ReadinessTrend` chart in Analytics → Volume & Health tab replacing placeholder. `readinessStore.getTrend()` added. Achievement badges `recovery_streak_3` / `recovery_streak_7` added. `recovery` i18n block added to all 4 locales.
  - **Coach Mode:** "Trainer Mode" renamed to "Coach Mode" everywhere. Toggle now works for local/guest accounts (`isTrainerAuthorized()` checks `session` presence, not only `is_trainer`).
  - **Consent compliance (5 fixes):** GDPR revocation UI added to Profile; OpenFoodFacts disclosed in Legal page; IP address disclosed in consent copy; analytics opt-in defaulted to `false`; ConsentModal made dismissible.
  - **Motion tilt fix:** `use-hero-tilt.ts` timeout no longer downgrades permission to 'prompt' if `wasMotionPermissionGranted()` is true.
- **Commits:** `1c0f90be` feat: Recovery & Readiness Dashboard + Coach Mode + consent compliance fixes
- **Test status:** All passing
- **Legal/compliance notes:** Analytics opt-in now GDPR Planet49 compliant. ConsentModal now GDPR Art. 7 compliant. OpenFoodFacts IP disclosure added.
- **Key decisions made:** Coach Mode: local = open exploration, authenticated = trainer flag required. All external services need Legal + consent gate + revocation.

---

### 2026-04-28 — Preview Merge Readiness Blockers

- **What was done:** Pre-merge fixes for `preview_b` branch.
- **Commits:** `45b87d69` Fix preview merge readiness blockers
- **Notes:** TypeScript / lint / test fixes required before merge.

---

### 2026-04-27 — Supabase Key Rotation Merge

- **What was done:** Merged `codex/rotate-api-keys-after-vercel-incident` into `preview_b`. Verified all Vercel environments use `sb_publishable_...` format for `VITE_SUPABASE_ANON_KEY`.
- **Commits:** `8c90e5e1` Merge branch, `81b08b9d` Harden secret rotation workflow, `54cf5869` chore: add local Claude settings
- **Security status after this session:**
  - SEC-001 (CRITICAL): Legacy anon JWT still in git history — must rotate and revoke in Supabase dashboard after new publishable key is live and verified.
  - SEC-002: Vercel keys updated — RESOLVED.
  - SEC-003: Local `.env.local`, `dist/`, Capacitor assets still contain legacy JWT.
  - SEC-004: Stale env in `.claude/worktrees/trusting-almeida/.env`.
  - SEC-005: Supabase migrations 002 and 004 may be missing from live schema.

---

### 2026-04-11 — Auth Hardening + Security Remediation

- **What was done:** Comprehensive security pass.
  - `RequireAuth` simplified — `strict` prop removed.
  - Route table updated to demo-first policy.
  - `AuthModal` moved to app level only.
  - `AuthUnavailableState` component added.
  - `authStore` subscription cleanup (prevents duplicate listeners).
  - Express server refactored: `createApp` / `createRouteHandlers` / `startServer`.
  - `plyo_push_up` duplicate exercise ID fixed (renamed to `plyometric_push_up`).
  - `suggestSplitAdjustment()` clock dependency fixed with optional `referenceDate` param.
- **Known pre-existing TypeScript errors (out of scope, not fixed):**
  - `src/components/exercises/ExercisesBrowser.tsx`
  - `src/components/logging/RestTimer.tsx`
  - `src/features/exercise-library/media.ts`
  - `src/hooks/use-hero-tilt.test.ts`
  - `src/hooks/useUserPreferences.ts`
  - `src/pages/Nutrition.tsx`
- **Test status:** 184 frontend / 13 server passing (at that time)

---

### 2026-03-30 — Home Route Crash + Install Coach Polish

- Fixed home route crash (`fc0ce151`).
- Polished install coach sequencing (`fa9c7ce5`).
- Fixed onboarding progress overflow and completion flash.
- Redesigned consent tray; hid duplicate sheet close button.

---

### Pre-2026-03-18 — Audit & Feature Build-Out (Phases 1–4)

All items tracked in `AUDIT_AND_IDEAS.md`. Summary:
- Phase 1: nutrition light mode, touch targets, rest timer, history data, offline queue, PWA manifest.
- Phase 2: history page, profile/settings, superset logic, warm-ups, plate calculator.
- Phase 3: periodization timeline, readiness score, strength curve, MRV warnings, split recommendation, body measurements.
- Phase 4 partial: lazy loading, test coverage, accessibility, branded cards, coach portal.
- Remaining TODO items: smart meal shortcuts (§3.6), energy balance trend (§3.7).

---

## Known Issues & Tech Debt

### CRITICAL

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| SEC-001 | Legacy Supabase anon JWT in git history | `.git` history | Rotate key in Supabase dashboard AFTER new publishable-key deployment is live and verified. Do NOT rewrite git history until confirmed safe. |

### HIGH

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| SEC-005 | Supabase migrations 002 + 004 may be missing from live schema | `supabase/migrations/` | Plan sync and exercise community stats fail in prod until applied. |
| DEBT-001 | Pre-existing TypeScript errors in 6 files | ExercisesBrowser, RestTimer, media.ts, use-hero-tilt.test.ts, useUserPreferences, Nutrition.tsx | Compilation fails with `--noEmit` for these files. Not blocking tests currently. |
| AUDIT-001 | DE locale only ~35% complete — 310 keys missing vs `en.json` | `src/locales/de.json` | Entire sections absent: `commands.*`, `error.*`, `exercises.*`, `footer.*`, `header.*`, `hero.*`, `install_coach.*`, `legal.*`, `notfound.*`, `onboarding.*`, `wizard.*`. German users see raw i18n key strings in most of the UI. |
| AUDIT-002 | PT locale only ~33% complete — 310 keys missing vs `en.json` | `src/locales/pt.json` | Same large gaps as DE. Portuguese users see raw i18n key strings in most of the UI. |

### MEDIUM

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| DEBT-002 | `analyticsStore.ts` analytics events fire to nowhere | `src/stores/analyticsStore.ts:121` | TODO comment: "Send to PostHog or custom backend". No external destination wired. |
| SEC-003 | Legacy JWT in local `.env.local`, `dist/`, Capacitor assets | local only | Delete after rotation confirmed live. |
| SEC-004 | Stale env in worktree `.claude/worktrees/trusting-almeida/` | local only | Sanitize or delete. |
| DEBT-003 | `CircleSettingsTab.tsx` and `CircleMembersTab.tsx` are stub placeholders | `src/components/circles/tabs/` | Marked TODO Phase 5. Not implemented. |
| DEBT-004 | Test coverage gaps: logging flow, progression engine edge cases, nutrition store, circle store | `src/__tests__/` | See AUDIT_AND_IDEAS.md §5.4 for prioritized list. |
| DEBT-005 | Accessibility partial: RIR color-only indicators, skip-link, wizard keyboard nav | Multiple | See AUDIT_AND_IDEAS.md §5.5. |
| DEBT-009 | Circle/social data not included in GDPR data export | `src/pages/Profile.tsx` | handleExportData exports fitness + readiness data but not circle posts, reactions, or comments. |
| AUDIT-003 | ES locale missing 75 keys vs `en.json` | `src/locales/es.json` | Gaps in `install_coach.*`, `header.mobile_drawer.*`, `wizard.anatomy.*`, `wizard.review.*`, `wizard.stepper.*`. Spanish users see raw key strings for these sections. Also has 27 orphaned keys (`circles.*`, `consent.*`, `workout.*`) not in EN — investigate. |
| AUDIT-004 | Dev/test route `/mcl` (MCLIntegrationTest) exposed in production | `src/App.tsx:387` | No auth guard, no env-conditional render. Anyone can navigate to `/mcl` in prod. Should be removed from production build or wrapped in a dev-only guard. |

### LOW

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| DEBT-006 | Empty state illustrations use icons, not SVGs | Multiple pages | See AUDIT_AND_IDEAS.md §1.10. |
| DEBT-007 | Smart meal shortcuts not implemented | — | AUDIT_AND_IDEAS.md §3.6. |
| DEBT-008 | Energy balance trend chart not implemented | — | AUDIT_AND_IDEAS.md §3.7 (dual-axis calories vs. weight). |
| AUDIT-005 | 25+ `.map()` calls in components flagged as possibly missing `key=` props | `confetti.tsx:71`, `form-field.tsx:131,161`, `living-background.tsx:156`, `SupernovaIcon.tsx:59`, `PlateCalculator.tsx:138,180`, `OneRepMaxCalculator.tsx:98`, `InstallCoachSheet.tsx:30`, `CommandPalette.tsx:144`, `CircleFeed.tsx:171`, `CircleLayout.tsx:143,150,237`, `CircleLeaderboardTab.tsx:59`, `CircleChallengesTab.tsx:143`, `ChallengeCard.tsx:147`, `CircleCard.tsx:52`, `JoinCircleModal.tsx:121`, `CreateChallengeModal.tsx:190,208`, `ReactionButton.tsx:173`, `ExerciseSwapModal.tsx:217,238` | React will warn and reconciliation may degrade. Verify each — most likely have key on child element not visible from single-line grep. |
| AUDIT-006 | `(window as any).__lastTrendingError` global hack | `src/hooks/useExerciseInteraction.ts:180,183` | Module-level variable would be safer and avoids `window as any`. Pre-existing lint warning. |

---

## Legal & Compliance Status

| Item | Status | Notes |
|------|--------|-------|
| Privacy Policy published | Done | `docs/privacy-policy.md` + `/legal` page |
| GDPR Art. 13 — workout/fitness data disclosed | Done | "What We Store" section in Legal.tsx |
| GDPR Art. 13 — readiness/recovery data disclosed | Done | Added 2026-04-30 |
| GDPR Art. 13 — nutrition data disclosed | Partial | Mentioned in "What We Store"; OpenFoodFacts disclosure added 2026-04-29 |
| GDPR Art. 20 — data export includes fitness data | Done | planHistory, workoutLogs, personalRecords |
| GDPR Art. 20 — data export includes readiness logs | Done | Added 2026-04-30 |
| GDPR Art. 20 — data export includes circle/social data | Not implemented | DEBT-009 |
| GDPR Art. 20 — data export includes nutrition logs | Partial | nutritionStore data not confirmed in export |
| GDPR Art. 20 — data export includes body measurements | Partial | measurementsStore data not confirmed in export |
| GDPR Art. 7 — OpenFoodFacts consent gate | Done | Checked before every API call |
| GDPR Art. 7(3) — consent revocation for OpenFoodFacts | Done | Added to Profile page 2026-04-29 |
| GDPR Art. 7 — analytics opt-in defaults `false` | Done | Fixed 2026-04-29 (Planet49) |
| ConsentModal dismissible | Done | Fixed 2026-04-29 |
| OpenFoodFacts IP address disclosed in consent | Done | Added 2026-04-29 |
| OpenFoodFacts disclosed in Legal page | Done | Added 2026-04-29 |
| Data deletion on request | Not implemented | Profile page has placeholder. Backend deletion endpoint missing. |
| Supabase key rotated in Vercel | Done | 2026-04-27 |
| Legacy key revoked in Supabase dashboard | PENDING | Must happen after new deployment verified live (SEC-001) |
| Medical disclaimer | Done | Prominent disclaimer tab in Legal.tsx |

---

## Common Gotchas — Things NOT to Do

1. **Never hardcode color values** (`white`, `black`, `bg-white`, `text-white`, etc.) in Tailwind classes. Use semantic tokens: `bg-muted`, `text-foreground`, `bg-background`, `border-border`, `bg-muted/50`. The app is dark-mode-first and these break light mode for ~50% of users.

2. **Never import `exerciseLibrary.json` directly** (e.g., `import lib from '@/data/exerciseLibrary.json'`). Use `src/lib/exerciseRepository.ts` instead — it caches and lazy-loads the data.

3. **Never call `new Date()` inside time-sensitive logic without a `referenceDate` param.** Tests will start failing as fixture dates age. See `suggestSplitAdjustment()` fix (2026-04-11) for the pattern.

4. **Never add `strict` prop to `RequireAuth`.** The prop was removed intentionally. `RequireAuth` has one behavior only. Route-level access is controlled by whether you wrap a route with it at all.

5. **Never render `AuthModal` inside a page component.** It is mounted once at app level in `App.tsx`. Page-level renders create duplicate modals and auth state conflicts.

6. **Never add analytics opt-ins that default to `true`.** GDPR Planet49 ruling requires explicit opt-in. Default must be `false`.

7. **Never add a new external data service** without all three: (a) disclosure section in `Legal.tsx`, (b) gate in `ConsentModal.tsx`, (c) revocation option in `Profile.tsx`. Any one missing = HIGH compliance issue.

8. **Never add new stored data types** without both: (a) disclosure in `Legal.tsx` (GDPR Art. 13) AND (b) inclusion in `handleExportData` in `Profile.tsx` (GDPR Art. 20). Either missing = HIGH compliance issue.

9. **Never run `tsc --noEmit` and expect clean output for the full project** — 6 pre-existing errors exist in out-of-scope files. Check which errors are new vs. pre-existing before raising an alarm.

10. **Do not modify files in `src/components/ui/`** — these are shadcn/ui primitives managed as copy-paste source. Changes will be overwritten on next shadcn update.

11. **Trainer-mode routes require BOTH auth AND trainer flag** — `TrainerGuard` wraps inside `RequireAuth`. Local/guest users can enable Coach Mode toggle UI, but `/clients`, `/templates`, `/revenue` still require a real session.

---

## Backlog / Next Steps

### Immediate (unblocked)
- [ ] Merge PR #28 into `preview_b` — all code review issues resolved
- [ ] Guard or remove `/mcl` dev route from production build — AUDIT-004 (`src/App.tsx:387`)
- [ ] Rotate legacy Supabase anon JWT in Supabase dashboard (after confirming publishable-key deployment is live)
- [ ] Delete local legacy JWT from `.env.local`, `dist/`, Capacitor assets
- [ ] Apply Supabase migrations 002 and 004 to production

### Short-term features
- [ ] Complete DE locale translation — 310 keys missing, ~35% complete — AUDIT-001 (`src/locales/de.json`)
- [ ] Complete PT locale translation — 310 keys missing, ~33% complete — AUDIT-002 (`src/locales/pt.json`)
- [ ] Fill ES locale gaps — 75 keys missing, investigate 27 orphaned keys — AUDIT-003 (`src/locales/es.json`)
- [ ] Smart Meal Shortcuts — copy previous meal, saved meal templates (AUDIT_AND_IDEAS.md §3.6)
- [ ] Energy Balance Trend — dual-axis calories vs. weight chart in NutritionInsights (§3.7)
- [ ] CalendarHeatmap — deferred from History page initial implementation
- [ ] Circle/social data in GDPR export (circle posts, reactions, comments) — DEBT-009
- [ ] Data deletion endpoint (backend + Profile UI)
- [ ] Confirm nutrition and measurements data included in export (Partial items in compliance table)

### Medium-term
- [ ] Wire `analyticsStore.ts` TODO to PostHog or custom analytics backend — DEBT-002
- [ ] CircleSettingsTab and CircleMembersTab Phase 5 implementation — DEBT-003
- [ ] Accessibility audit remaining items (RIR aria-labels, wizard keyboard nav) — DEBT-005
- [ ] Test coverage gaps: logging flow, progression engine edge cases — DEBT-004
- [ ] Fix pre-existing TypeScript errors in 6 known files — DEBT-001

---

## Key Reference Files

| Purpose | File |
|---------|------|
| Audit roadmap + item status | `AUDIT_AND_IDEAS.md` |
| Auth hardening handoff (PR #23) | `docs/codex-auth-handoff.md` |
| Engineering patterns | `docs/ENGINEERING.md` |
| Design system | `docs/DESIGN_SYSTEM.md` |
| Security context | `docs/SECURITY.md` |
| Architectural decisions | `docs/DECISIONS.md` |
| Key rotation runbook | `docs/VERCEL_SECRET_ROTATION.md` |
| Deployment readiness rubric | `docs/readiness-rubric.md` |
| Privacy policy | `docs/privacy-policy.md` |
| API reference | `docs/API_REFERENCE.md` |
| Testing patterns | `docs/TESTING.md` |
| Troubleshooting | `docs/TROUBLESHOOTING.md` |
| Deployment orchestration | `docs/ORCHESTRATION.md` |

---

*Updated by /after-report skill. Next update due after next development session.*
