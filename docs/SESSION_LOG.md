# SESSION_LOG.md — FitWizard Living Project Memory

> Read this file at the start of every session before touching any code.
> Update it at session end using `/after-report`.
> Last updated: 2026-11-17
> **Launch project:** work is now scheduled in [`docs/project/BOARD.md`](project/BOARD.md) (lanes, days, gates). Agents write handoffs; Lane A folds them in here.

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
| `/legal` | `Legal.tsx` (supports `?tab=` disclaimer / privacy / terms) | No |
| `/about` | `About.tsx` (see `docs/ABOUT_PAGE.md`) | No |
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

### 2026-11-18 — Day 2 Lanes Restarted; Lane E Day 4: Sync Engine Core (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`, from `preview_b` @ `7ef77e5`)

- **What happened to Day 2:**
  - The six Day 2 sessions (A, B, C, D, F, H) started at 21:10 UTC and stopped on the account's 5-hour usage limit (`usage_limit_reached`, reset 23:10 UTC) before any of them pushed work.
  - Checked the remote: no `lane-*/day-2` branches existed.
  - After the reset, each session was sent a message to start its Day 2 task over.
- **What was done (Lane E Day 4):**
  - Built the sync engine core in `src/lib/sync/`: types, outbox, registry, engine, status and index. Nothing calls it yet; the triggers come on Day 6.
  - Replaced the unused in-memory `src/lib/offlineSave.ts` with the device-saved outbox and deleted it.
  - `clearLocalUserData` now also erases the outbox and the pull cursors.
  - Removed the three unearnable "Wisdom AI" badges (DEBT-046 resolved).
  - Details: `docs/project/handoffs/2026-11-18-lane-e-day-4.md`.
- **Verification:**
  - 13 engine tests against an in-memory fake database that copies 007's `updated_at` trigger.
  - Confirmed the tests catch real faults by deliberately breaking three engine rules; each break made a test fail.
  - 897/897 tests. Lint 0 errors / 4 warnings. Typecheck clean. Build passes. Bundle unchanged at 344.3 KB, since the sync engine isn't in the startup bundle.
- **Contract #5:** added `keyColumn`, `onConflict`, `markDirty(..., { deleted })`, `syncAll(..., { client })` and `countPendingChanges()`. `CONTRACTS.md` is updated.
- **Not verified:** a run against real Supabase. That needs a staging project (L10) and the migration-repair step (DEBT-053).
- **Next steps:**
  1. Review and merge the Day 2 PRs as they arrive.
  2. Lane E Day 5 (collections).

### 2026-11-17 — Wave 1 / Day 1 Reviewed and Merged (#47–#53) (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`)

- **Review before merging** (Lincoln asked for one more look first):
  - Read every lane diff and every handoff.
  - Each lane stayed in its own files. Lane H's Gradle and SPM edits come from `cap sync` registering Lane E's `@capacitor/filesystem`.
  - No secrets were added; Lane H git-ignores `keystore.properties`, `*.jks` and `*.keystore`.
  - Migration 007: 7 tables, each `ON DELETE CASCADE` from `auth.users`; RLS on all of them; 28 owner-only policies (`auth.uid() = user_id`); no `USING (true)`; no anon access.
  - Nothing in the old logo path is still referenced.
  - All seven PRs passed CI and had no open review findings.
- **Merged on Lincoln's instruction, each pinned to the reviewed head SHA:**
  - #50 F `54fcae8`
  - #49 C `1a715ef`
  - #48 H `6a31fd2`
  - #51 B `e69675a`
  - #52 D `8524a3c`
  - #47 A `4ff74e6`
  - #53 E (this entry's PR)
  - Lane B went before E, so the expected `en/de/pt.json` end-of-file conflict was resolved on this branch (keep both; no duplicate keys).
- **Final combined code** (`preview_b` + #53):
  - 891/891 tests in 159 files. Lint 0 errors / 4 warnings. Typecheck clean. Build passes. Bundle 344.3 KB gzip.
  - Browser checks: title is "FitWizard - Science-Based Workout Planner"; no AI wording; Circles hidden; `/circles`, `/clients` and `/revenue` show 404; WebP logo; plan and achievements in IndexedDB after reload; no user data in localStorage; home 0/3; no errors.
- **Documentation:**
  - Fixed the two references Lane A left for the coordinator (`codex-auth-hardening-handoff.md`, DEBT-004 path).
  - Added each lane's carry-over items from the Day 1 handoffs to its next brief (A, B, C, D, F and H Day 2; E Day 4).
  - Logged the new issues DEBT-046 to DEBT-057.
- **Native risk to remember:** Lane H turned on `minifyEnabled`/`shrinkResources` and removed `CapacitorHttp`. Neither affects the web app. Both are checked on the first real Android/iOS build (Lincoln's Mac and Android Studio), and native wger calls are routed through the proxy on Lane H Day 2 (DEBT-054).
- **Next steps:**
  1. Start Day 2 for lanes A, B, C, D, F and H.
  2. Lane E Day 4 (sync engine core).
  3. Gate 1 after Day 3. Lincoln needs to set up a staging Supabase project and run the migration-repair step first (DEBT-053).

### 2026-11-17 — PR #46 Merged; Wave 1 Lanes Started in Parallel; Lane E Day 3 (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`, restarted from `preview_b` @ `803842e`)

- **What was done:**
  - Merged PR #46 (Lane E Day 2) on Lincoln's instruction, after CI passed on the head commit `1385ceb`.
  - **Started Wave 1 / Day 1 for lanes A, B, C, D, F and H** as six parallel cloud agent sessions, which this session coordinates. Each one finished and opened a PR: #47 (A), #48 (H), #49 (C), #50 (F), #51 (B), #52 (D). All six pass CI and have no review findings. Their queued task cards were withdrawn so no lane runs twice.
  - Ran **Lane E Day 3**:
    - Nutrition, readiness check-ins, achievements and custom exercises are now saved on the device.
    - Added `clearLocalUserData()`, `waitForHydration()` and a `translate()` helper.
    - Sign-out now keeps training data on the device, with a notice, until cloud sync exists.
    - Wrote ADR 11 in `docs/DECISIONS.md`.
    - Details are in `docs/project/handoffs/2026-11-17-lane-e-day-3.md`.
  - **Trial integration:**
    - In a throwaway local branch, merged the Lane E Day 3 work plus all six lane PRs in the planned order.
    - The only conflict was Lane B in `en/de/pt.json` (end-of-file appends; resolved by keeping both, with no duplicate keys).
    - The combined code passes 887/887 tests, lint, typecheck and build.
    - Checked in a browser: no AI wording, Circles hidden, `/circles`, `/clients` and `/revenue` return 404, WebP logo, `public/` 4.1 MB (was 11 MB), no errors.
- **Found:** `favorites-store.ts` is unused (exercise favourites live in `preferencesStore`), so it was left unchanged and added to Lane D's deletion list. `clearLocalUserData` covers `fitwizard-preferences` instead.
- **Process note:** I used the `gh` CLI once for read-only PR and check status. This environment allows `gh` only for search, so I switched back to the GitHub MCP tools.
- **New issues found:** DEBT-044 (LOW), DEBT-045 (MEDIUM; see Known Issues).
- **Test status:**
  - Lane E Day 3 branch: 857/857 tests in 155 files (+15). Lint 0 errors / 4 warnings. Typecheck clean. Build passes. Bundle 344.0 KB gzip.
  - Verified in Chromium: plan and achievements are in IndexedDB after reload, and localStorage holds no user data.
- **Review follow-up on PR #53:** the automated reviewer found two real issues, both fixed and tested.
  - `waitForHydration` hung forever when a saved store failed to load, which could freeze plan generation. It now settles through the load tracker and has a safety timeout.
  - `clearLocalUserData` could have its erase undone by a store that was still loading. It now waits for each store before resetting it; the test was confirmed to fail without the fix.
  - 861/861 tests.
- **Next steps:**
  1. Lincoln reviews and merges the seven PRs in merge order: #50 (F), #53 (E), #49 (C), #48 (H), #51 (B, after the translation fix), #52 (D), #47 (A).
  2. Start Day 2 for lanes A, B, C, D, F and H.
  3. Gate 1 after Day 3.

### 2026-11-17 — PR #45 Merged; Lane E Day 2: Plans, Workouts and Measurements Survive Restarts (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`, restarted from `preview_b` @ `5984b86`)

- **What was done:**
  - Merged PR #45 (Lane E Day 1) on Lincoln's instruction, after CI, the Vercel preview and the automated review all passed, with no review threads.
  - Ran **Lane E Day 2**:
    - The plan store now saves plans, workout logs, personal records and the in-progress workout on the device; body measurements are saved too.
    - Saved data from the previous version (week and weight unit) is carried over once from localStorage.
    - The streak, weekly goal and badges now update. The weekly goal counts finished workouts and is set from the plan's training days.
    - Circles posting only runs when the circles flag is on.
  - Added the running checklist `docs/project/CHECKLIST.md` at Lincoln's request.
  - Details are in `docs/project/handoffs/2026-11-17-lane-e-day-2.md`.
- **Verified in a real browser** (production build): generated a plan through the wizard, then reloaded. The plan survived, it sits in IndexedDB (`fitwizard-plans` v2), localStorage has no plan data, and home shows weekly goal 0/3 with "3 workouts to reach your goal".
- **Mistakes caught and fixed in this session:**
  - Rewriting `pt.json` through a JSON parser dropped its duplicate `"wizard"` block. Reverted; the keys were re-added as text. Warnings were added to the conflict rules and to Lane B's brief.
  - A script truncated `measurementsStore.ts`. It was rebuilt from `HEAD` plus the intended changes; the diff was checked.
  - `migratingAppStorage.removeItem` cleared localStorage only after an async step, so an un-awaited `clearStorage()` could delete a newer value. It now clears localStorage first.
- **New issues found:** DEBT-041, DEBT-042, DEBT-043 (LOW; see Known Issues).
- **Test status:**
  - 836 tests across 153 files pass (+19). Lint: 0 errors, 4 pre-existing warnings. Typecheck clean. Build passes.
  - Initial bundle 342.7 → 344.8 KB gzip. The badge catalogue is loaded on demand to keep it out of the startup bundle.
- **Legal/compliance notes:** workout logs, personal records and body measurements are now stored on the device: IndexedDB `fitwizard` on the web, app files on native. They are already included in the Profile JSON export. Lane A adds them to the data inventory.
- **Review follow-up (same day):** the automated reviewer raised 2 findings on PR #46, and both were real.
  - Fixed: an unfinished workout from another day is now offered as **Resume / Discard** instead of being mixed with the opened day (`WorkoutLogger.tsx`).
  - Fixed: the one-time localStorage move keeps the old copy unless the new copy was confirmed written to durable storage (`appStorage.ts`).
  - 842/842 tests. The resume flow was checked in a real browser.
- **Next steps:**
  1. Lincoln reviews and merges PR #46 (Lane E Day 2).
  2. Lane E Day 3 (remaining stores, sign-out behaviour, ADR 11).
  3. Start the other Wave 1 lanes. Lane B goes after this PR merges.

### 2026-11-17 — PR #44 Merged; Lane E Day 1 Device Storage (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`, restarted from `preview_b` @ `79b6ebb`)

- **What was done:**
  - On Lincoln's instruction, merged PR #44 (Day 0) into `preview_b` as `79b6ebb`, after the CI `test` job passed, the Vercel preview deployed, and the automated code review reported no findings.
  - Ran **Lane E Day 1** as a trial lane: the device storage layer (`src/lib/storage/appStorage.ts`), the hydration registry (`src/lib/storage/hydration.ts`), `useStoresHydrated` and `HydrationGate`, with `<App />` wrapped in `main.tsx`.
  - Details are in `docs/project/handoffs/2026-11-17-lane-e-day-1.md`.
- **Decisions recorded from Lincoln:**
  - L4 (Apple and Google enrolment) is deferred until store work is near. Effect: it delays Gate 2's store uploads and the 14-day Play test.
  - D1–D6 acknowledged: each default applies unless he changes it.
  - Lane E runs first as a trial; the other lanes wait for its review.
- **Contract change:** `useStoresHydrated` moved to `src/hooks/useStoresHydrated.ts`. Exporting it from the component file broke fast refresh, which the `react-refresh/only-export-components` lint rule flags. `CONTRACTS.md` is updated.
- **Plan corrections:**
  - The first-run consent screen hardcodes "Your AI workout companion is ready." (`ConsentModal.tsx:126`), and Lane B's search pattern would have missed it. Added to Lane B's brief and ownership; the Lane B task card was replaced.
  - The Lane E task card was withdrawn because the work ran in this session.
- **New issues found:** DEBT-039, DEBT-040 (LOW; see Known Issues).
- **Test status:**
  - 817 tests across 151 files pass (795/149 before, plus 22 new).
  - Lint: 0 errors and the 4 pre-existing warnings. Typecheck clean. Build passes.
  - Initial bundle 342.4 → 342.7 KB gzipped.
  - Production build smoke-tested in Chromium: it renders, IndexedDB is available, and there are no console errors.
- **Legal/compliance notes:** no user data moves yet. From Lane E Day 2, user data is stored in IndexedDB (`fitwizard` database) on the web and in app files on native; Lane A adds this to the data inventory.
- **Not checked:** native storage on a real device; Safari private mode.
- **Next steps:**
  1. Lincoln reviews and merges the Lane E Day 1 PR (the trial).
  2. If the trial looks right, start the other Wave 1 lanes. **Lane B must start after this PR merges**, because its brief changed.
  3. Lane E Day 2: persist the plan and measurement stores, and wire up the achievement counters.

### 2026-11-17 — Launch Analysis, README Rewrite, Parallel Launch Project (branch `claude/fitzwizardly-preview-b-analysis-96ptn8`, from `preview_b` @ `85d5cbd`)

- **What was done:**
  - Full launch-readiness review: all code, every doc, the migrations, the native projects and CI.
  - Rewrote `README.md`; it was the Lovable template.
  - Wrote `docs/LAUNCH_ROADMAP.md` (the analysis, work items 0.1–6, decisions and risks).
  - Split the work into a day-by-day project with parallel AI lanes under `docs/project/`: `README.md` (rules, ownership, merge order, kickoff prompt), `BOARD.md`, `CONTRACTS.md`, `lanes/LANE-{A,B,C,D,E,F,H,J,L}.md` and `handoffs/TEMPLATE.md`.
  - Added the feature-flag contract `src/lib/featureFlags.ts` (+ test) and `VITE_FEATURE_CIRCLES` / `VITE_FEATURE_COACH` in `.env.example`.
- **Decisions made by the owner:**
  - Name: FitWizard.
  - Drop the "AI-powered" claim; there is no AI in the code.
  - Free at launch.
  - v1 is for lifters only; Circles and the coach portal go behind flags (off by default).
- **Key finding:** almost no user data survives a reload. Since `26e3534` (2026-04-11):
  - `planStore` persists only `currentWeek` and the weight unit.
  - `nutritionStore` persists only `selectedDate`.
  - `measurementsStore` does not persist at all.
  - Workout logs, PRs, nutrition and measurements are lost when the app closes, and there are no cloud tables for them. This is DEBT-027, the top launch item (Lane E, Wave 1).
- **New issues found:** DEBT-027 to DEBT-038 and SEC-006 to SEC-007 (see Known Issues). The roadmap lists them as findings A–T with evidence.
- **Test status:** 795 tests across 149 files pass (791/148 before plus the 4 new flag tests). Lint: 0 errors and the 4 pre-existing warnings. Typecheck clean. Server: 14/14.
- **Legal/compliance notes:**
  - No new stored data.
  - Account deletion (required by both stores) is still missing; scheduled for Lane F, Days 3–4.
  - `docs/privacy-policy.md` is inaccurate; rewrite scheduled for Lane A, Day 4.
- **Open decisions:** D1–D6 in `docs/project/BOARD.md`. Each has a default.
- **Next steps:**
  1. Lincoln merges this PR into `preview_b`.
  2. Lincoln starts the Wave 1 lanes (7 lanes, or 4 agents grouped as A+B, C+D, E+F, H) with the kickoff prompt in `docs/project/README.md`.
  3. Day 1 Lincoln tasks: L1 (revoke the legacy key), L4 (developer accounts: start now, approval takes days), and the decisions.

### 2026-11-15 — Phone Selected-List Layout, Merged With PR 43 (branch `preview_b`)

Verified after merging `origin/preview_b` (`834b8d7`): 148 test files / 791 tests pass, ESLint 0 errors on `src/features/mcl` and `src/components/wizard/anatomy`, type-check 0 errors.

**Pushed to `origin/preview_b` on 2026-11-15. Not merged into `main`, on the owner's instruction. No branch was created or deleted.**

The touch preview described below was written twice from the same uncommitted starting point: once here (`f6b9916`) and once on `LO/fix-muscle-preview`, which landed on the remote as PR 43 while this session was running (see the next entry). The merge kept this session's side where the two clashed: the flow layout, and `MusclePath` without the unused `onMouseEnter` / `onMouseLeave` props. PR 43's group taps, details sheet and `InfoPanel` changes came through untouched.

- **What was done:** Two changes to the wizard's Target Muscles step. First, holding a finger on a muscle shows its name and the label follows as the finger slides (`useTouchMusclePreview`); a quick tap still selects. Second, the selected-muscles list on phones no longer sits in a tiny inner scroller: every phone, iPhone included, now shows the body map at a fixed height with the full list below it and the page scrolls.
- **Commits:**
  - `f6b9916` feat(mcl): preview muscle names by holding and sliding on the anatomy diagram
  - `416f8d0` fix(mcl): give the selected-muscles list room on phones
  - `834b8d7` Merge remote-tracking branch 'origin/preview_b' into preview_b
- **Files changed:**
  - `src/features/mcl/components/MuscleSelector/svg/useTouchMusclePreview.ts` — new; the hold, slide, tap and cancel gesture.
  - `src/features/mcl/components/MuscleSelector/svg/MuscleCanvas.tsx`, `svg/MusclePath.tsx` — hover moved to pointer events; legacy mouse-hover props removed.
  - `src/features/mcl/components/MuscleSelector/ui/MuscleTooltip.tsx` — measures itself and stays inside the canvas; name-only label above the finger for touch.
  - `src/features/mcl/components/MuscleSelector/MuscleSelector.tsx` — `enableTouchPreview` and `mobileSelectionLayout` props; flow layout skips the Apple sheet and gives the map `min(56dvh, 460px)`.
  - `src/features/mcl/components/MuscleSelector/ui/SelectionSidebar.tsx` — `flow` and `touchActions` props; dead "View Exercises" button removed.
  - `src/components/wizard/anatomy/AnatomyPanel.tsx` — shell is `h-auto md:h-[600px]`; passes `enableTouchPreview` and `mobileSelectionLayout="flow"`.
  - Tests: `MuscleSelector.preview.test.tsx` and `ui/SelectionSidebar.test.tsx` (new); `MuscleSelector.ios.test.tsx`, `AnatomyPanel.test.tsx`, `MusclePath.test.tsx`, `MuscleTooltip.test.tsx` (updated).
- **Why the list was cramped (measured at 412x915):** shell 706px, list panel 40% = 282px, panel header 105px, "View Exercises" footer 76px, leaving about 100px (one row). On iPhone Safari and the iOS app the bottom sheet opened at its 22% snap point with the same header, so it also showed about one row. Chrome, Firefox and Edge on iPhone never got the sheet (`detectAppleMobile` is true only for Safari and the native app) and used the cramped inline list.
- **Measured after (browser, Android profile):** 412x915: map 451-460px, 4 selected rows show with no inner scroll; Full Body preset (21 muscles) caps the list at 560px and scrolls inside. 344x780 (Fold outer screen): map 437px, no horizontal overflow, no truncated names. 820x1000: side column 288px in a 600px shell, unchanged.
- **Issues fixed this session:** none from the Known Issues table. Fixed in passing: row info and remove buttons were hover-only, so invisible on touch in the inline list; "View Exercises" had no click handler.
- **New issues found this session:** DEBT-026 (LOW; see Known Issues).
- **TODO/FIXME introduced:** none (pre-existing TODOs unchanged).
- **Test status:** All passing: 791 tests across 148 files (after the merge).
- **Legal/compliance notes:** None this session. No new stored data.
- **Key decisions made:**
  - One phone layout in the wizard. The iPhone bottom sheet (`SelectedMusclesSheet`) is no longer used there; it remains the default (`mobileSelectionLayout="contained"`) for other `MuscleSelector` consumers.
  - In the wizard, a hold on the diagram shows the muscle name instead of opening the info panel on iPhone. Info is reached from the row buttons in the selected list.
  - A touch that starts on a selectable muscle does not scroll the page.
- **Housekeeping:** 171 untracked Finder-style " 2" duplicates deleted from the checkout, plus 1,497 in `node_modules` and 67 in ignored iOS/Android build folders. Each was compared with its original first. This also removed `node_modules/@types/node 2`, which had been breaking plain `tsc`.
- **Not checked:** a physical phone; iPhone Safari in the simulator (the attempt stopped at the first-run consent screen); light theme.
- **Open issues carried forward:** all others in Known Issues, unchanged.
- **Next steps:**
  1. Check hold-and-slide, page scrolling past the map, and the new list layout on a real iPhone and Android phone, and in the iOS 26 / 27 simulators (DEBT-026). Group taps from PR 43 select a whole muscle group at once, so lists get long quickly; confirm the 560px cap feels right.
  2. Decide when `preview_b` goes to `main` (it is 100+ commits ahead). Not done this session.
  3. Decide whether to delete `SelectedMusclesSheet` if no other screen needs it.
### 2026-11-15 — Muscle Hover and Touch Preview

- **What was done.** Restored the visible muscle name when hovering in Wizard Step 4. The tooltip now uses the anatomy canvas for both positioning and clipping bounds. On touchscreens, a 380 ms hold starts a preview with 10 px of allowed drift. Sliding updates the highlighted muscle and name, and lifting or canceling clears the preview. Quick taps still use the wizard's muscle-group selection flow.
- **Implementation.** `AnatomyPanel` enables touch preview for Step 4. `MuscleSelector` shares tooltip state between mouse and touch. `MuscleCanvas` and `useTouchMusclePreview` track the active finger and resolve selectable paths beneath it. A native touch handler reserves gestures that start on those shapes because Chromium could claim the drag for page scrolling even with SVG `touch-action` set.
- **Commit.** `f029ae5` Restore muscle hover and touch previews.
- **Verification.** The full client suite passed 781 tests across 145 files on CI's Node 22 major version. The focused anatomy and wizard suite passed 254 tests across 25 files. The two storage-test failures seen on local Node 24 were also reproduced on the base commit. Typecheck passed from a clean dependency install. ESLint reported zero errors and four existing warnings outside the changed files. Desktop Chrome passed Front, Back, and Side hover checks at desktop and narrow widths. Emulated Pixel Chrome and iPhone WebKit passed hold, slide, release, cancellation, and quick tap. The screenshots show [desktop hover](screenshots/target-muscles/desktop-hover.png) and an [emulated phone after sliding from chest to biceps](screenshots/target-muscles/mobile-hold.png).
- **Follow-up.** Test on physical iOS and Android devices. Scrolling from outside a muscle worked in the Front view, but a repeated iPhone WebKit check in Deep Back did not scroll. Browser testing also surfaced the existing wizard-level Enter shortcut described in DEBT-025.
- **Code hygiene.** The diff introduced no TODOs, new dependencies, or legal and consent changes.
- **iPhone report follow-up.** The reported beta URL and installed app showed the older long-press details card. The beta URL could not be matched to the PR deployment in the connected Vercel project. Testing the exact PR commit in iPhone browser profiles reproduced two additional issues. The Selected Muscles drawer remained modal when it opened a details card, and its overlay intercepted the X. A resumed wizard could also remove one muscle highlight while keeping its saved group selected. The follow-up closes the Selected Muscles drawer before showing details in a portaled sheet with a separate scroll area. A direct tap in Step 4 now toggles all selectable muscles in that saved group in one selection update. The restored patch passed 784 client tests on Node 22, typecheck, and lint with four pre-existing warnings. Physical iPhone verification remains pending.


### 2026-11-15 — Anatomy Search, Regions, Deep Layers (branch `feat/anatomy-taxonomy-deep-layers`, stacked on `feat/side-view-sculpt`)

Design: `docs/superpowers/specs/2026-11-15-anatomy-taxonomy-and-deep-layers-design.md` (section 14 lists what changed during the build). Plan: `docs/superpowers/plans/2026-11-15-anatomy-taxonomy-and-deep-layers.md`. Source material: Lincoln's `BUILD-PLAN.md`, `muscle-taxonomy.json` and `regions.json` (Google Drive, `fitwizard-anatomy/`). Verified at the end (`0b643c0`): 144 test files / 766 tests pass (was 138 / 666), ESLint 0 errors on `src/`, type-check 0 errors.

- **What was done:** The muscle selector can now be searched by nickname and by body region, both through one engine (`src/features/mcl/lib/anatomyEngine.ts`) and one highlight path. The Surface / Deep toggle now works on the front and back views as well as the side, with ten new deep muscles. The receded layer now follows the Sculpt slider.
- **Added:**
  - Taxonomy data: 70-node muscle tree and 10 regions in `src/features/mcl/data/taxonomy/`, Zod-checked at load.
  - Engine: `resolveSearch`, `resolveRegion`, `toFocusHighlights`. Plain TypeScript, no dependencies. Typo tolerance for words of 5+ letters.
  - Interface: region chips row, result row with per-muscle select and "Select all", search box on phones.
  - Deep muscles (front): pectoralis minor, subscapularis, transverse abdominis, iliopsoas, vastus intermedius. (Back): supraspinatus, teres minor, gluteus minimus, semimembranosus, plantaris. Each has a workout-group entry in `src/lib/muscleMapping.ts`.
- **Changed:**
  - `getLayerRole` applies on every view. On the back view the 11 existing deep muscles (rhomboids, teres major, infraspinatus, erector spinae, gluteus medius, soleus) are now picked on Deep, not Surface.
  - Receded-layer muscles are neutral grey at 35% of the active layer's opacity (was a fixed 8% in group colour).
  - A search or region match on the other layer shows as a highlighted ghost.
  - Non-Apple phones: shell `min(84dvh, 720px)` (was 78dvh / 680px); inline selected list 26% when empty or while searching, 40% otherwise (was a fixed 40%).
- **Removed:**
  - The old search dropdown in `SearchBar` (name-only match, group colour dot, hover preview). `searchMuscles` in `data/muscles.ts` is no longer used by the selector but is still exported.
  - The side-only restriction on the layer toggle.
- **Corrections made to the source JSON:** shin moved out of Calves; Calves and Trapezius re-parented; "long head", "rotator cuff", "glutes", "hip flexors" and "abs" aliases de-duplicated; Rotator Cuff and Glutes group nodes added; upper/middle/lower traps and abs added; Head and Feet marked not selectable.
- **Measured (body map height, empty / selected / selected while searching):** Android profile 360x740: 275 / 190 / 237px; 375x812: 319 / 225 / 281px; 412x915: 353 / 253 / about 315px. iPhone 17 Pro simulator (Safari): bottom-sheet layout, map about 300pt. **Not checked:** a physical phone, light theme, reduced motion.
- **TODO/FIXME introduced:** none.
- **Legal/compliance notes:** None this session. No new stored data.
- **New issues:** DEBT-023, DEBT-024 (LOW; see Known Issues).
- **Next steps:**
  1. Merge PR 40 (`feat/side-view-sculpt`) first, then this branch.
  2. Second artwork pass on the deep muscles (DEBT-023).
  3. Decide on separate shapes for muscle heads and deep muscles on the side view (DEBT-024).
  4. Check on a physical iPhone and Android phone.

### 2026-11-15 — Side-View Sculpt (branch `feat/side-view-sculpt`, from `preview_b` @ `0feb8cf`)

Design: `docs/superpowers/specs/2026-11-14-side-view-sculpt-design.md`. Plan: `docs/superpowers/plans/2026-11-14-side-view-sculpt.md`. Built 2026-11-14/15 with one implementer and one reviewer subagent per task, then a whole-branch review. Verified at the end (`42a04ca`): 137 test files / 662 tests pass (was 126 / 553), `npm run build` OK, ESLint 0 errors on `src/`. A full `npm run lint` in the main checkout reports 22 errors, all in generated iOS folders (`ios/DerivedData`, `ios/App/CapApp-SPM/.build`), none in source.

- **What was done:** The muscle selector's side view (`src/features/mcl/`) was redrawn as one right-facing silhouette with 22 surface and 7 deep muscles. A Sculpt slider (0-100, default 60) controls how defined unselected muscles look on all three views. A Surface/Deep toggle (side view only) makes the deep muscles clickable over a ghosted surface. A side-view click selects the left and right muscle together. The side view is now enabled on phones (`AnatomyPanel`).
- **Commits:**
  - `7ea1584` docs: side-view sculpt design and implementation plan
  - `725d1b6` refactor(mcl): extract muscle render order with side depth support
  - `3190449` feat(mcl): single closed side silhouette and geometry helpers
  - `9f24fbc` feat(mcl): redraw and extend side-view muscles
  - `0572f91` fix(mcl): fill the side-view arm and redraw the deltoid cap
  - `05934fd` feat(mcl): sculpt-level rendering for muscle definition
  - `cac7f6d` fix(mcl): limit sculpt edge and shading to the resting state
  - `a89fc61` feat(mcl): sculpt slider and layer toggle with saved preferences
  - `6c8d2a8` feat(mcl): surface and deep muscle layers in side view
  - `1e7d9c8` feat(mcl): paired side selection and side view on mobile
  - `73b8ad6` fix(mcl): global ResizeObserver test stub and guard empty paired click
  - `78297aa` fix(mcl): android sidebar share, selected deep ghost, side tooltip label, outline strength
  - `42a04ca` fix(mcl): taller selector shell and 40% list share on non-Apple phones
- **Files changed (36):**
  - `src/features/mcl/data/muscles.ts` — side paths redrawn and added; `sideOrder` and `layer` per muscle; front/back paths unchanged
  - `src/features/mcl/lib/{sortMuscles,pathGeometry,sculpt,layerVisibility,pairedMuscles}.ts` — new pure helpers, each with tests
  - `src/features/mcl/hooks/useSculptPrefs.ts` — saves slider and layer in `localStorage` key `fitwizard.mcl.sculpt.v1` (Zod-checked)
  - `src/features/mcl/components/MuscleSelector/svg/{MusclePath,MuscleCanvas,BodyOutline}.tsx`, `svg/sideOutline.ts` — sculpt rendering, ghost layer, new side outline
  - `src/features/mcl/components/MuscleSelector/ui/{SculptSlider,LayerToggle,MuscleTooltip}.tsx` — new controls; tooltip label without "(Left)" in side view
  - `src/features/mcl/components/MuscleSelector/MuscleSelector.tsx` — controls row, paired side click, 40% inline list on non-Apple phones
  - `src/components/wizard/anatomy/AnatomyPanel.tsx` — side view on mobile; taller shell on non-Apple phones
  - `src/test/setup.ts` — global `ResizeObserver` stub
- **Issues fixed this session:** none from the Known Issues table. Fixed within the branch: body map collapsing on Android-width phones, a selected deep muscle vanishing on the Surface layer.
- **New issues found this session:** DEBT-019, DEBT-020, DEBT-021, DEBT-022 (all LOW; see Known Issues).
- **TODO/FIXME introduced:** none (pre-existing TODOs unchanged).
- **Test status:** All passing: 662 tests across 137 files.
- **Legal/compliance notes:** None this session. The new `fitwizard.mcl.sculpt.v1` key holds interface state only (slider level, layer) and is **not** in the data export, like `visitCount`.
- **Key decisions made:**
  - Erector spinae is deep-only in the side view.
  - A selected muscle on the other layer shows as a 45% ghost with its outline.
  - Front/back resting opacity now follows the slider (0.41 at the default, was a fixed 0.25).
  - Non-Apple phones: shell `min(78dvh, 680px)`, list 40%. iPhones keep `min(62dvh, 560px)` with the bottom sheet.
- **Measured in a browser (dev server, emulated 375x812 Android):** body map 237-249px tall, 38-39% of the panel (was 134-146px, 27-29%); no horizontal overflow. Desktop pane (831px wide): map 425-433px, sidebar 288px. Light theme checked after a reload. **Not checked:** real iPhone or Android device, reduced motion.
- **Open issues carried forward:** all existing IDs unchanged.
- **Next steps:**
  1. Review and merge the `feat/side-view-sculpt` PR into `preview_b`.
  2. Check the side view on a real iPhone (iOS 26/27) and an Android phone.
  3. Second artwork pass on the narrow forearm flexor and serratus strips, and the small unclickable gap under the shoulder.
  4. Decide whether to fade the Surface/Deep switch (DEBT-020) and translate the selector controls (DEBT-019).
### 2026-11-14 — Header Capsule Scroll Tint (branch `LinC/top-pillar-scroll-tint-8f3713`, from `preview_b` @ `0feb8cf`)

- **What was done:** The floating header capsule let page content read through it while scrolling (hero text, "Medical Disclaimer", the wizard's "About 2 min" chip), reported from an Android phone. It now has two states driven by a new `useScrolledPastTop` hook: the original airy tint at the top of a page, easing to a denser tint once the window has scrolled more than 8px. A tint-only fade (`header-capsule-scrim`) appears behind the capsule on scroll to cover the gaps beside it and under the status bar. The wizard-only capsule override was removed so every route uses the same capsule.
- **Commits:**
  - `5e6c6f6` feat(header): scroll-reactive tint for the floating header capsule
- **Files changed:**
  - `src/hooks/use-scrolled-past-top.ts` — new hook; passive window scroll listener, `requestAnimationFrame`-throttled, re-renders only when the answer flips
  - `src/hooks/use-scrolled-past-top.test.ts` — 4 tests (top, threshold both ways, scrolled on mount, cleanup)
  - `src/components/Header.tsx` — `data-scrolled` on the capsule and the new scrim element; wizard override removed
  - `src/index.css` — `header-capsule-inner` two tint states, new `header-capsule-scrim` utility
- **Tint values:** at top 65% dark / 70% light (the original opacities); scrolled 82% dark / 88% light. Tint colour is the app violet (`hsl(270 48% 9%)`) in dark and lavender-white (`hsl(264 44% 97%)`) in light. Blur is unchanged (24px, saturate 180%).
- **Also changed:** `transition: all` replaced with explicit properties; hover lift applies only under `@media (hover: hover)`; both transitions are skipped under `prefers-reduced-motion`.
- **Issues fixed this session:** none from the Known Issues table.
- **New issues found this session:**
  - DEBT-015: `backdrop-filter` on the header capsule did not appear to render on the owner's Android phone (text behind it was sharp in screenshots). Not reproduced or diagnosed; desktop Chromium renders it. The denser scrolled tint and the tint-only scrim are sized to work without blur. — LOW — `src/index.css`
- **TODO/FIXME introduced:** none (pre-existing TODOs unchanged).
- **Test status:** All passing: 557 tests across 127 files (was 553 / 126). Lint 0 errors, 4 warnings (unchanged).
- **Verified in the dev-server preview, not on a device:** both states in dark and light at 375px on `/`, `/wizard` and `/legal`, and at desktop width on `/`; repeated with `backdrop-filter` force-disabled. Known remainder: in light mode with blur disabled, a very faint ghost of large dark headings is still visible inside the scrolled capsule (raise the light scrolled tint from 88% to about 92% if it shows on a device). **Not verified on a real Android or iOS device.**
- **Legal/compliance notes:** None this session.
- **Key decisions made:** Tint is scroll-reactive rather than one fixed value. The capsule and scrim must not rely on `backdrop-filter` to hide content. The capsule reacts to window scroll only; a screen that scrolls inside its own panel will not trigger the dense state (none found, not exhaustively checked).
- **Next steps:**
  1. Check the capsule on the owner's Android phone and on iOS 26/27 from the `preview_b` deploy.
  2. Diagnose why blur does not render on that Android device (DEBT-015).
  3. Tune the light-mode scrolled tint if the faint ghost is visible on a device.

### 2026-11-13 — Quality-of-Life Pass (branch `LinC/quality-of-life`, from `preview_b` @ `09e0921`)

Plan: `docs/superpowers/plans/2026-11-13-quality-of-life.md`. Verified at the end: lint 0 errors (4 warnings, unchanged), typecheck clean, 126 test files / 553 tests pass at the end of the day (was 110 / 466; 119 / 517 after the original plan), `npm run build` OK, server `npm test` 14 pass and `npm run build` OK.

- **Bundle report (Task 1).** `npm run bundle:report` lists what `dist/index.html` loads up front. Baseline and after numbers are in `docs/PERFORMANCE_BASELINE.md`. `vitest.config.ts` now also picks up `scripts/**/*.test.ts`. The Lighthouse run is still pending (owner).
- **Debug logging (Task 2).** `src/lib/devLog.ts` replaces `console.log` in `analyticsStore`, `analytics`, `performance`, `planMigrations` and `ErrorBoundary`. Only the `planMigrations` log was reaching production before; the rest were already DEV-gated.
- **Lazy charts (Task 3): skipped.** `vendor-charts` was not in the initial load, so the plan's condition was not met.
- **Smart Meal Shortcuts (Task 4, §3.6).** "Copy yesterday" (relative to the day being viewed) and an inline "Save as template" name field in `SmartActions`; pure logic in `src/lib/mealShortcuts.ts`; store action `copyMealsFromDate`. Strings in all four locales under `nutrition.shortcuts.*`.
- **Energy Balance Trend (Task 5, §3.7).** `src/lib/energyBalance.ts` + `EnergyBalanceChart` in the Insights tab: calories as bars, weight as a line, 7/14/28-day control, gaps shown as gaps. The "Est. TDEE" sentence from the spec is not built.
- **Offline saves (Task 6): partly done, needs a decision.** Meals and workouts are not written to any server and are not persisted, so there was no network write to protect. Built and tested `src/lib/offlineSave.ts` (queue, idempotent flush) but did **not** wire it or add a "saved offline" toast, because nothing would sync. Fixed a real bug on the way: `preferencesStore.syncToCloud` wiped changes that were queued while a sync was in flight; it now removes only the changes that were in the uploaded snapshot.
- **Exercise search cache (Task 7).** The live search is in `src/lib/services/exerciseSearch.ts`, not `service.ts`. `cachedExerciseSearch` (`src/features/exercise-library/searchCache.ts`) caches non-empty live results for 10 minutes; empty results and failures are never cached. It only matters when the local catalog has no match, because catalog hits never reach the network.
- **Bug found by the browser smoke test.** The Nutrition page did not refresh after a meal was logged (it showed "0 meals logged" until the date changed), including the existing Add Food flow. Fixed with a store subscription and a regression test (`src/pages/Nutrition.refresh.test.tsx`).
- **Home page feature cards (same day, later).** The icon tooltip was being clipped by the card; it now renders at page level and shows a random short quip from `src/data/hoverQuips.ts` (60 English one-liners) instead of repeating the card description. The feature popup has one close control (the X, plus Escape and backdrop click); the bottom Close button is gone.
- **Add to Home Screen prompt refined (same day, later).**
  - Timing: it no longer opens on the first page load. It opens after a plan exists (on `/plan`) or on the home page from the second browser session (`shouldAutoPromptInstallCoach` in `src/lib/install-coach.ts`). The sheet now lives app-wide in `InstallCoachHost` (mounted in `App.tsx`), so the drawer's install entry works on every page and before the prompt has been shown.
  - iPhone: the main button no longer calls `navigator.share` (that sheet does not reliably offer "Add to Home Screen"); it expands written steps that point at the browser's own Share button. **Not verified on a real iPhone / iOS 26-27**: check the step wording against the actual Safari toolbar.
  - Android: `beforeinstallprompt` is captured at app start (`src/lib/install-prompt-capture.ts`, started in `main.tsx`) instead of only while the home page is mounted. **Not verified on a real Android device.**
  - Also: main button text wraps at 375px (was overflowing by 11px), the steps toggle has `aria-expanded`, and an Android user agent on a touch Mac is no longer read as an iPad.
  - New persisted field `visitCount` in the `fitwizard-install-coach-v1` key. It is interface state like the flags beside it and is **not** in `dataExport.ts`; say so if you want it exported.
  - Still open: the prompt is English-only in es/pt/de (96 known-gap keys), and Samsung Internet, Edge, Opera and Firefox are still treated as unsupported.
- **Smoke test coverage.** Run locally on the dev server, not on the beta: log a meal, copy yesterday, energy balance chart with no weigh-ins. Not exercised in a browser: template save from `SmartActions`, the weight line, exercise search, offline. The beta smoke test and the Task 6 offline check are still to do (owner).

### 2026-09-27 — Backlog Close-Out (branch `LinC/backlog-closeout`, from `preview_b` @ `d5ff5c0`)

- `/mcl` dev test route now exists only in DEV builds (AUDIT-004). Verified: the production build no longer contains `MCLIntegrationTest` (PWA precache dropped from 81 to 79–80 entries). A route test (`src/App.mclRoute.test.tsx`) checks dev serves it and production falls through to 404; Vite's build-time removal itself is only verified by grepping `dist/`.
- Cleared the 5 pre-existing `tsc` errors (DEBT-001): missing `beforeEach`/`afterEach` imports in two tests, a `Promise<Response>` mock helper, and `useRef<number | undefined>(undefined)` in `useCountUp.ts`. Added `npm run typecheck` and a CI step so it cannot regress.
- Removed the tracked Finder duplicates `config 2.xml` / `config 3.xml` in `ios/App/App/` and `android/app/src/main/res/xml/` (DEBT-010). An untracked `ios/App/App/config 4.xml` may still sit in the main checkout; it was never tracked, delete it locally.
- Profile data export (GDPR Art. 20) now includes nutrition and body measurements, built by the pure, tested `src/lib/dataExport.ts`. Existing export keys are unchanged; `exportVersion` and `exportedAt` were added. Note: `nutritionStore` persists only `selectedDate` and `measurementsStore` is not persisted, so the export covers in-memory session data. Whether that data should be persisted is a product question.
- Migration `002` is now re-runnable (`DROP POLICY/TRIGGER IF EXISTS`); `006` does not touch its tables. New guide: `docs/SUPABASE_MIGRATIONS.md`. Not run against a real database in this session. Production state remains unverified (SEC-005).
- Added a locale-parity ratchet test (`src/locales/localeParity.test.ts` + `src/test/fixtures/localeGaps.json`). Corrected counts vs `en.json` (558 flat keys): de missing 355, pt 366, es 127 (47 of those are About copy, DEBT-011). `fallbackLng` is `en`, so untranslated keys render English, not raw key strings.
- Decisions made deliberately, not skipped: (a) `Legal.tsx` "What we store" text was NOT changed — it doesn't enumerate nutrition/measurements, but those stores aren't persisted, so nothing new is stored; revisit with legal review if they become persistent. (b) `changelog.ts` and the version were NOT bumped — a 1.0.1 release is the owner's call (`changelog.test.ts` ties the top entry to `package.json`).
- Known limits of the new locale parity test: a key counts as translated if it exists at all (6 de / 10 es / 5 pt keys are English text copied over), and keys deleted from `en.json` are not flagged stale in `localeGaps.json`.
- Independent review (a separate read-only agent) re-ran typecheck, lint, all 110 test files / 466 tests, the client build and 14 server tests: all passed; it found no defects, only the doc inaccuracies corrected in `1e11c81`. Also noted: `config.xml` is gitignored and generated by `npx cap sync` (a fresh clone needs it).
- GitHub record: branch `LinC/backlog-closeout` pushed to `origin` from `preview_b` @ `d5ff5c0`. Commits: `eadb808` (gate /mcl, TS errors, typecheck CI, remove duplicate configs), `8f9d1f6` (export), `d1f1ce6` (migration 002 + guide), `ee58e91` (locale parity + docs), `76e4716` (/mcl route test), `1e11c81` (doc corrections). Nothing was merged or force-pushed; `main` untouched. GitHub CI only runs for pushes to `main`/`preview_b` and for pull requests, so CI on this branch runs once a PR into `preview_b` is open.
- Backfill of the May–Sep 2026 gap (DEBT-014), from git history: exercise catalog refactor and wger/API Ninjas fallbacks with CORS handling (May); mobile drawer and header-capsule polish; MRV warnings i18n; "Wisdom AI" disabled (May 26); security posture hardening and iteration-1 fixes (Jun, PR #35 merged Sep 25); premium page transitions; iOS status-bar chrome fix merged then reverted (Jun 13); `ios:live` localhost warning (Sep 25).

---

### 2026-09-26 — About Page, What's New, Back Navigation

- **What was done:**
  - Built a new `/about` page. Its hero shows the app icon (with a long-press confetti easter egg), and the version pill opens "What's new". The page also has an "Our Story" timeline, a creator card (`CreatorCard`, with photo, glowing aura and flip), mission principles, credits and a "Start your plan" CTA to `/wizard`. Components are in `src/components/about/`.
  - Added `WhatsNewPanel` for release notes. It opens as a Drawer on phones, a Sheet on tablets and a Dialog on desktop, via `useViewportTier`. Notes come from `src/data/changelog.ts`, with versions v0.1.0–v0.7.0 grouped retroactively from git history.
  - Made About discoverable without featuring it:
    - an `AboutSupportCard` at the bottom of Profile
    - a redesigned `Footer`, hidden in native builds
    - native-only `DrawerQuickLinks` in the Header drawer
    - a ⌘K command
  - Added back navigation on every platform: `BackButton` + `useGoBack`, a global `EdgeSwipeBack` + `useEdgeSwipeBack` for touch devices (deduplicated against browser gestures), and `useAndroidBackButton` via the new `@capacitor/app` dependency.
  - Bumped `package.json` 0.0.0 → 1.0.0 to match the native builds, exposed as `__APP_VERSION__`.
  - Legal page: added `?tab=` deep links and reworded the disclaimer.
  - Documentation: added `docs/ABOUT_PAGE.md`.
- **Commits:**
  - `bfda39b` feat(about): About FitWizard page, What's new notes, and back navigation
  - *(plus the docs commit containing this entry and `docs/ABOUT_PAGE.md`)*
  - *Gap note:* 43 earlier commits since the last log update (2026-04-30 → 2026-09-25, from `1e8c9cb` to `62219f7`) were made in sessions that did not run `/after-report`. They are not summarized here; see `git log 4edb1b0..62219f7`. Highlights from their commit titles: exercise search and catalog fallbacks, page transitions, iOS status bar work, the security hardening PR #35, and the dependency refresh (#31, #33).
- **Files changed** (64 vs `preview_b`):
  - `src/pages/About.tsx`, `src/components/about/*` (12 files) — the About page and What's new
  - `src/data/changelog.ts` — release-notes data. A test enforces that its top entry equals the `package.json` version.
  - `src/components/navigation/{BackButton,EdgeSwipeBack}.tsx`, `src/hooks/{useGoBack,useEdgeSwipeBack,useAndroidBackButton,useLongPress}.ts` — back navigation and gestures
  - `src/components/Footer.tsx` — rebuilt: 5 short links, deep links to the Legal tabs, heartbeat animation, hidden when `isNativeApp()`
  - `src/components/Header.tsx` + `src/components/header/DrawerQuickLinks.tsx` — native-only About · Help · Legal row with a one-time "New" dot
  - `src/pages/Profile.tsx` — the About & Support card replaces the hardcoded fake "App Version 1.2.0" string
  - `src/pages/Legal.tsx`, `src/components/legal/ConsentModal.tsx` — `?tab=` deep links, guidance wording, duplicate © removed
  - `src/pages/UserGuide.tsx` — Back button
  - `src/App.tsx` — `/about` route (unguarded, demo-first), `EdgeSwipeBack` and `useAndroidBackButton` mounted, footer hidden in native builds
  - `src/lib/{appInfo,aboutSeen,changelogSeen}.ts` — version constant and localStorage UI flags
  - `src/locales/{en,es,pt,de}.json` — new `about.*`, `navigation.*`, `footer.*`, `header.quick_links.*`, `profile.about_support.*`, `legal.footer.guidance` keys
  - `vite.config.ts` / `vitest.config.ts` / `src/vite-env.d.ts` — `__APP_VERSION__`; Vite honors `PORT` (default 8080)
  - `package.json` / `package-lock.json` — version 1.0.0 and `@capacitor/app`
  - `android/*.gradle`, `ios/App/CapApp-SPM/Package.swift` — `npx cap sync` plugin registration
  - `public/creator-avatar.jpg` (480px), `public/app-icon-384.png`
  - `src/test/setup.ts` — no-op `IntersectionObserver` for jsdom
  - `src/App.*.test.tsx` — platform mock now spreads the real module
  - `docs/ABOUT_PAGE.md`, `CLAUDE.md` — maintenance guide plus an index link
- **Issues fixed this session:**
  - (unlisted): the Profile page showed a hardcoded, fake "App Version 1.2.0 • Build 2026.02". It now shows the real version.
  - (unlisted): all 3 Legal footer links opened the same tab. They now deep-link to Privacy, Terms and Disclaimer.
  - (unlisted): secondary pages had no way back, and the Android system back button had no in-app handling. Both now route through app history.
- **New issues found this session:**
  - DEBT-010: duplicate `config 2.xml` / `config 3.xml` files are tracked in git — LOW — `ios/App/App/`, `android/app/src/main/res/xml/` (committed in `ff07994`)
  - DEBT-011: long-form About copy and release notes are English-only (es/pt/de fall back to en) — LOW — `src/locales/*.json`, `src/data/changelog.ts`
  - DEBT-012: swipe-back, haptics and the Android back button are not yet verified on a real device or simulator — MEDIUM — `src/hooks/useEdgeSwipeBack.ts`, `useAndroidBackButton.ts`
  - DEBT-013: "Get in Touch" is hidden until public social links (Instagram/LinkedIn) are provided; a personal email was intentionally not published — LOW — `src/pages/About.tsx`
  - DEBT-014: this log was not updated for 43 commits (May–Sep 2026) — LOW — `docs/SESSION_LOG.md`
- **TODO/FIXME introduced:** none (pre-existing TODOs unchanged)
- **Test status:** All passing: 455 tests across 107 files, up from the 301/73 baseline. Lint: 0 errors and the 4 pre-existing warnings. App `tsc`: only the 5 errors inherited from `preview_b` (see DEBT-001). Server `tsc`: clean. `npm run build`: passes.
- **Legal/compliance notes:**
  - `Legal.tsx`: the footer line "Generated plans are for educational purposes only." became "Plans are general fitness guidance, not medical advice. Check with a healthcare professional before starting a new program." The duplicate © line was removed. `?tab=` deep links were added.
  - `ConsentModal.tsx`: the Terms and Privacy links now deep-link to their tabs. The consent logic is unchanged.
  - `Profile.tsx`: UI only (About & Support card). Data export is unchanged.
  - **No new external data services and no new personal data types.**
    - The new `localStorage` keys `fitwizard-about-seen` and `fitwizard-changelog-seen` store only UI "seen" flags (non-personal), so no Art. 13/20 changes are needed.
    - `@capacitor/app` is used only for back-button events.
    - The creator photo is a public, author-supplied asset.
  - The guidance wording should get a qualified legal review before store release.
- **Key decisions made:**
  - About is "discoverable, not featured". Web: footer + Settings + ⌘K. Native: drawer quick links (with a one-time "New" dot) + Settings, and the footer is hidden. Never in primary nav.
  - Responsive modal surfaces follow the `ExerciseLibraryDetailModal` split: phone Drawer, tablet Sheet, desktop Dialog.
  - Release notes live in `src/data/changelog.ts`. CI enforces that its top entry equals the `package.json` version. Earlier versions are retroactive milestones.
  - Back navigation: `useGoBack` falls back to Home when there is no in-app history. The edge swipe waits 350ms and skips if the browser already fired `popstate`. Android back goes history → Home → minimize.
  - Stray numbered duplicate files (Finder/iCloud) keep appearing locally. Always check `find . -name '* [0-9].*'` before committing.
- **Open issues carried forward:** SEC-001, SEC-003, SEC-004, SEC-005, DEBT-001 through DEBT-009, AUDIT-001 through AUDIT-006, and the new DEBT-010 through DEBT-014
- **Next steps:**
  1. Verify swipe-back, haptics and Android back on the iOS Simulator and an Android emulator (DEBT-012).
  2. Add the Instagram/LinkedIn "Get in Touch" section once the handles are provided (DEBT-013).
  3. Remove the tracked duplicate `config {2,3}.xml` files (DEBT-010).
  4. Tag releases in git from now on (`git tag v1.0.0` on the merge commit) so release notes and history stay aligned.
  5. Get a legal review of the Legal page guidance wording before App Store / Play submission.

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
| DEBT-001 | ~~Pre-existing TypeScript errors~~ **RESOLVED 2026-09-27** | — | `npm run typecheck` is clean and runs in CI. |
| DEBT-012 | Swipe-back / haptics / Android back not device-verified | `src/hooks/useEdgeSwipeBack.ts`, `src/hooks/useAndroidBackButton.ts` | Unit-tested, and browser-tested with simulated touch. Needs a pass on the iOS Simulator and an Android emulator. |
| AUDIT-001 | DE locale missing 355 keys vs `en.json` (558 flat keys) | `src/locales/de.json` | Untranslated keys fall back to English (`fallbackLng: en`), not raw keys. Gaps are snapshotted in `src/test/fixtures/localeGaps.json`; the parity test blocks new gaps. Legal copy needs a human translator. |
| AUDIT-002 | PT locale missing 366 keys vs `en.json` | `src/locales/pt.json` | Same as AUDIT-001. |
| DEBT-027 | **User data lost on reload:** workout logs, PRs, current plan (guests), nutrition, measurements | `src/stores/planStore.ts:59-64`, `nutritionStore.ts:44-48`, `measurementsStore.ts` | Persistence was cut to preferences only in `26e3534`. Fix: local-first storage plus sync (roadmap 1.1–1.4, Lane E). |
| DEBT-028 | No account deletion (required by Apple and Google) | `src/pages/Profile.tsx:399-403` | Roadmap 1.5, Lane F. |
| DEBT-029 | Native sign-in can't complete: the magic link returns to `window.location.origin`, and there are no deep links | `src/stores/authStore.ts:228-241` | Fix: 6-digit email code (roadmap 2.1, Lane H). |
| DEBT-030 | Session stored in `sessionStorage`; users are signed out whenever the app or tab closes | `src/lib/supabase.ts:72-73` | Roadmap 2.2, decision D2. |
| DEBT-031 | "AI-powered" marketing claim, but there is no AI in the code | `index.html:9,29`, `vite.config.ts:167`, locale `tagline` | Roadmap 0.1 (Lanes B and D). |
| SEC-006 | Database rules: users can write their own streaks, badges and challenge scores; signed-out visitors can read `profiles`; the `circle_members` read policy references itself (likely infinite recursion, not confirmed on a live DB) | `001_circles_schema.sql:75-77,115-122`, `002_exercise_interactions_schema.sql:117-135` | Migration 008 (roadmap 1.6, Lane F). |
| DEBT-032 | iOS: arbitrary network loads allowed, no privacy manifest, no team, iPad and landscape enabled. Android: no release signing, no minify, `allowBackup=true` | `ios/App/App/Info.plist`, `android/app/build.gradle`, `AndroidManifest.xml` | Roadmap 2.5–2.6 (Lane H). |

### MEDIUM

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| DEBT-002 | `analyticsStore.ts` analytics events fire to nowhere | `src/stores/analyticsStore.ts:121` | TODO comment: "Send to PostHog or custom backend". No external destination wired. |
| DEBT-033 | Streak, plans-generated and weekly-progress counters are never updated (no callers) | `src/stores/achievementStore.ts` | Roadmap 0.3 (Lane E). |
| DEBT-034 | Fake data on real screens: Revenue totals, client progress from `Math.random()`, hard-coded circle stats, exercise badges chosen by id length | `Revenue.tsx:48`, `ClientProgress.tsx`, `CircleDashboardTab.tsx`, `ExerciseBadges.tsx:10` | Coach and Circles hidden by flags; badges removed (roadmap 0.5). |
| DEBT-035 | Language picker offers French (no file), omits Portuguese, doesn't save the choice | `src/pages/Profile.tsx:215-222` | Roadmap 0.4 (Lane B). |
| DEBT-036 | Relative `/api/...` calls don't resolve inside native apps | `motivationQuoteClient.ts:137`, `exerciseApiAdapter.ts:95` | Roadmap 2.3 (Lane H). |
| DEBT-037 | Express `/plans/:id` requires a UUID but plan ids are `plan_<hash>`; Express is not deployed | `server/src/index.ts:68,349,380,445` vs `planGenerator.ts:560` | Retire Express (roadmap 1.7, decision D1). |
| SEC-007 | `/api/*` functions allow any origin, with no rate limit (API Ninjas quota exposed) | `api/*.ts` | Roadmap 2.3 (Lane H). |
| DEBT-038 | `public/` is 11 MB (1.7 MB logo, 1.4 MB icons, exercise data in the precache); fonts load from Google at runtime | `public/`, `vite.config.ts:153-163`, `index.html:13-16` | Roadmap 0.7, 2.5. |
| SEC-003 | Legacy JWT in local `.env.local`, `dist/`, Capacitor assets | local only | Delete after rotation confirmed live. |
| SEC-004 | Stale env in worktree `.claude/worktrees/trusting-almeida/` | local only | Sanitize or delete. |
| DEBT-003 | `CircleSettingsTab.tsx` and `CircleMembersTab.tsx` are stub placeholders | `src/components/circles/tabs/` | Marked TODO Phase 5. Not implemented. |
| DEBT-004 | Test coverage gaps: logging flow, progression engine edge cases, nutrition store, circle store | — | See AUDIT_AND_IDEAS.md §5.4 for prioritized list. |
| DEBT-005 | Accessibility partial: RIR color-only indicators, skip-link, wizard keyboard nav | Multiple | See AUDIT_AND_IDEAS.md §5.5. |
| DEBT-009 | Circle/social data not included in GDPR data export | `src/pages/Profile.tsx` | handleExportData exports fitness + readiness data but not circle posts, reactions, or comments. |
| AUDIT-003 | ES locale missing 127 keys vs `en.json` (47 are About copy, DEBT-011) | `src/locales/es.json` | Also has 30 orphaned keys (`circles.*`, `consent.*`, `workout.*`) not in EN — investigate. |
| AUDIT-004 | ~~`/mcl` exposed in production~~ **RESOLVED 2026-09-27** | `src/App.tsx` | Route and chunk exist only when `import.meta.env.DEV`. |

### LOW

| ID | Issue | File(s) | Notes |
|----|-------|---------|-------|
| DEBT-006 | Empty state illustrations use icons, not SVGs | Multiple pages | See AUDIT_AND_IDEAS.md §1.10. |
| DEBT-007 | Smart meal shortcuts not implemented | — | AUDIT_AND_IDEAS.md §3.6. |
| DEBT-008 | Energy balance trend chart not implemented | — | AUDIT_AND_IDEAS.md §3.7 (dual-axis calories vs. weight). |
| AUDIT-005 | 25+ `.map()` calls in components flagged as possibly missing `key=` props | `confetti.tsx:71`, `form-field.tsx:131,161`, `living-background.tsx:156`, `SupernovaIcon.tsx:59`, `PlateCalculator.tsx:138,180`, `OneRepMaxCalculator.tsx:98`, `InstallCoachSheet.tsx:30`, `CommandPalette.tsx:144`, `CircleFeed.tsx:171`, `CircleLayout.tsx:143,150,237`, `CircleLeaderboardTab.tsx:59`, `CircleChallengesTab.tsx:143`, `ChallengeCard.tsx:147`, `CircleCard.tsx:52`, `JoinCircleModal.tsx:121`, `CreateChallengeModal.tsx:190,208`, `ReactionButton.tsx:173`, `ExerciseSwapModal.tsx:217,238` | React will warn and reconciliation may degrade. Verify each — most likely have key on child element not visible from single-line grep. |
| AUDIT-006 | `(window as any).__lastTrendingError` global hack | `src/hooks/useExerciseInteraction.ts:180,183` | Module-level variable would be safer and avoids `window as any`. Pre-existing lint warning. |
| DEBT-010 | ~~Duplicate `config 2/3.xml` tracked in git~~ **RESOLVED 2026-09-27** | — | Removed; an untracked `config 4.xml` may remain in the main checkout — delete locally. |
| DEBT-011 | About long-form copy + release notes English-only | `src/locales/{es,pt,de}.json`, `src/data/changelog.ts` | UI labels are translated; story/mission/creator/changelog bodies fall back to `en`. |
| DEBT-019 | Muscle selector controls are hardcoded English (Sculpt, Surface, Deep; also the older Front/Back/Side) | `src/features/mcl/components/MuscleSelector/ui/` | The MCL feature does not use i18next yet. |
| DEBT-023 | Deep-layer artwork on front and back is a first pass; teres minor and plantaris are thin, and deep shapes overlap each other | `src/features/mcl/data/muscles.ts` | Checked by position tests (`deepAnatomy.test.ts`), not by an anatomist. |
| DEBT-024 | Muscle heads (pec clavicular/sternal, triceps long/lateral/medial, biceps femoris short) share the parent's shape; the ten new deep muscles are not on the side view; internal oblique is not drawn | `src/features/mcl/data/taxonomy/`, `data/muscles.ts` | Searchable today. Separate shapes would change ids saved workouts use. |
| DEBT-026 | Touch preview and the phone flow layout are not device-verified; a touch starting on a muscle does not scroll the page, which may feel sticky on small screens | `svg/useTouchMusclePreview.ts`, `MuscleSelector.tsx`, `AnatomyPanel.tsx` | Unit-tested and browser-tested with simulated touch (2026-11-15). Check on a physical iPhone and Android phone, and with VoiceOver. |
| DEBT-039 | First-run consent screen hardcodes "Your AI workout companion is ready." | `src/components/legal/ConsentModal.tsx:126` | Assigned to Lane B, Day 1 (roadmap 0.1). |
| DEBT-040 | Consent screen says "My data is stored locally on this device"; this becomes inaccurate once Wave 2 sync ships | `src/components/legal/ConsentModal.tsx` | Reword in Lane C Day 5 and Lane A Day 4. |
| DEBT-041 | `pt.json` has a duplicate `"wizard"` key, and JSON tools silently drop the first block | `src/locales/pt.json` | Merge by hand (Lane B Day 2). Never rewrite locale files with a parser. |
| DEBT-042 | `BadgeUnlockModal` is never mounted; badges are now shown as toasts | `src/components/motivation/BadgeUnlockModal.tsx` | Candidate for Lane D's dead-code removal. |
| DEBT-043 | The wizard header says "Coach-built intake" / "Coach intake" while the coach portal is off | `src/pages/Wizard.tsx` and the wizard header | Wording only; Lane B could reword it on Day 4. |
| DEBT-044 | `favorites-store.ts` is unused; exercise favourites live in `preferencesStore` | `src/stores/favorites-store.ts` | Delete in Lane D's dead-code pass (Day 2). |
| DEBT-045 | On a shared device, a signed-out account's training data stays visible until cloud sync ships | `src/stores/authStore.ts` | Deliberate (the alternative is losing data). Lane E Day 6 clears device data after a successful sync. |
| DEBT-046 | ~~Three "Wisdom AI" achievements can't be earned~~ **RESOLVED 2026-11-18 (Lane E Day 4)**. (the Wisdom chat isn't shown) and mention AI | `src/stores/achievementStore.ts` (~214–236) | Lane E Day 4: remove them from `BADGES`. |
| DEBT-047 | UserGuide: Circles tab not behind the flag; "FitWizardly" spelling; all strings hardcoded | `src/pages/UserGuide.tsx` | Lane C Day 2 (flag), Lane B Day 2 (spelling), J2 (strings). |
| DEBT-048 | Rest of the consent tray is hardcoded English | `src/components/legal/ConsentModal.tsx` | Lane C Day 5 (uses the new `consent.*` namespace). |
| DEBT-049 | Auth modal promises "circles and trainer tools", which are hidden in v1 | `src/components/auth/AuthModal.tsx:86` | Lane B Day 2. |
| DEBT-050 | Command palette links to nonexistent routes (`/achievements`, `/settings`, `/auth`) and an external docs site | `src/components/CommandPalette.tsx` | Lane C Day 2. |
| DEBT-051 | `CircleLayout` mock exports `default`, but App imports the named export | `src/App.auth-routing.test.tsx` | Lane C Day 2. |
| DEBT-052 | Social share image is a 512 px square; a 1200×630 card would render better | `index.html`, `public/logo.png` | Lane A / Lane D, Wave 3 (store assets). |
| DEBT-053 | Supabase CLI history is empty (001–006 were applied by hand); a bare `db push` would re-run 001 | staging/production | **Lincoln, Gate 1:** run `supabase migration repair --status applied 001 … 006` first (see `docs/SUPABASE_MIGRATIONS.md`). |
| DEBT-054 | Native wger calls relied on CapacitorHttp, which was removed on Lane H Day 1 | `src/features/exercise-library/service.ts:267` | Lane H Day 2: route through `apiUrl('/api/proxy-wger')`. |
| DEBT-055 | `WgerAdapter.search` calls wger directly on the web, bypassing the proxy allowlist | `src/lib/services/api/exerciseApiAdapter.ts:26` | Lane H Day 2. |
| DEBT-056 | `.claude/*.md` not audited; probably repeat the old stack and locales | `.claude/` | Lane A Day 2. |
| DEBT-057 | Unreachable Wisdom UI still says "AI" | `src/components/wisdom/*`, `src/pages/Plan.tsx` | Lane D Day 2: delete. |
| DEBT-020 | Surface/Deep switch snaps instead of fading; slider thumb (20px) and layer toggle (36-44px) are under the 44px touch guideline | `svg/MuscleCanvas.tsx`, `ui/SculptSlider.tsx`, `ui/LayerToggle.tsx` | Cosmetic. Measured 2026-11-15: deep muscles are removed within 60ms. |
| DEBT-021 | Switching theme without a reload leaves the muscle selector in the old theme; selected-muscle rows in the sidebar are near-invisible in light theme | `src/features/mcl/hooks/useTheme*`, `ui/SelectionSidebar.tsx` | Seen 2026-11-15. Neither file was changed by the sculpt work. |
| DEBT-025 | Enter on a focused muscle can advance the wizard after selecting it | `src/pages/Wizard.tsx` | The existing window-level shortcut handles Enter after the focused SVG control has already handled it. |
| DEBT-022 | `npm run lint` fails locally with 22 errors from generated iOS folders | `eslint.config.js` | Add `ios/DerivedData` and `ios/**/.build` to the ESLint ignores. Also a stray `node_modules/@types/node 2` folder breaks a bare `tsc`. |
| DEBT-013 | About "Get in Touch" hidden | `src/pages/About.tsx` | Waiting for public Instagram/LinkedIn handles. Personal email intentionally not published. See `docs/ABOUT_PAGE.md` §3. |
| DEBT-014 | ~~SESSION_LOG gap May–Sep 2026~~ **BACKFILLED 2026-09-27** (summary) | `docs/SESSION_LOG.md` | See the 2026-09-27 entry; per-commit detail is in git history. |
| AUDIT-007 | ~~CSP `style-src` blocked runtime-injected `<style>` tags~~ **RESOLVED 2026-11-12** | `vercel.json` | Sonner (toasts) and Vaul (drawers) inject their CSS at load; the strict `style-src` left both without a stylesheet on every deployment. Added `'unsafe-inline'` to `style-src` only; `script-src` is unchanged (`'self' 'wasm-unsafe-eval'`). Stricter option for later: per-request nonce (needs server work). Expected and harmless: Vercel's `vercel.live` feedback script is blocked on preview deployments only. |
| DEBT-015 | Header capsule `backdrop-filter` not rendering on an Android phone | `src/index.css` (`header-capsule-inner`) | Seen in owner screenshots 2026-11-14; not reproduced or diagnosed. Scrolled tint and scrim work without blur. |

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
| GDPR Art. 20 — data export includes nutrition logs | Done (in-memory data) | Added 2026-09-27. `nutritionStore` persists only `selectedDate`, so only the current session data exists to export. |
| GDPR Art. 20 — data export includes body measurements | Done (in-memory data) | Added 2026-09-27. `measurementsStore` is not persisted. |
| GDPR Art. 7 — OpenFoodFacts consent gate | Done | Checked before every API call |
| GDPR Art. 7(3) — consent revocation for OpenFoodFacts | Done | Added to Profile page 2026-04-29 |
| GDPR Art. 7 — analytics opt-in defaults `false` | Done | Fixed 2026-04-29 (Planet49) |
| ConsentModal dismissible | Done | Fixed 2026-04-29 |
| OpenFoodFacts IP address disclosed in consent | Done | Added 2026-04-29 |
| OpenFoodFacts disclosed in Legal page | Done | Added 2026-04-29 |
| Data deletion on request | Not implemented | Profile page has placeholder. Backend deletion endpoint missing. |
| Supabase key rotated in Vercel | Done | 2026-04-27 |
| Legacy key revoked in Supabase dashboard | PENDING | Must happen after new deployment verified live (SEC-001) |
| Medical disclaimer | Done | Prominent disclaimer tab in Legal.tsx. Since 2026-09-26 it is also directly linked from the footer (`/legal?tab=disclaimer`). |
| Generated-plan guidance wording ("not medical advice") | Partial | Reworded 2026-09-26 in all 4 locales (`legal.footer.guidance`). Needs qualified legal review before store submission. |
| New localStorage UI flags (`fitwizard-about-seen`, `fitwizard-changelog-seen`) | Done | Non-personal UI state only; no Art. 13/20 disclosure or export needed. |

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

> **Superseded for launch work:** the launch backlog now lives in [`docs/project/BOARD.md`](project/BOARD.md) and [`docs/LAUNCH_ROADMAP.md`](LAUNCH_ROADMAP.md). The items below are kept for history; Lane A reconciles them.

### Immediate (unblocked)
- [ ] Check the wizard muscle step on a real iPhone and Android phone: hold-and-slide preview, scrolling past the map, the selected list — DEBT-026
- [x] Merge the `feat/anatomy-taxonomy-deep-layers` PR after PR 40 (merged as PR 41, `9ffbada`)
- [x] Merge the `feat/side-view-sculpt` PR into `preview_b` (PR 40, `3845d06`)
- [ ] Check the side view on a real iPhone and Android phone
- [ ] Merge PR #28 into `preview_b` — all code review issues resolved
- [x] Guard or remove `/mcl` dev route from production build — AUDIT-004 (done 2026-09-27)
- [ ] Rotate legacy Supabase anon JWT in Supabase dashboard (after confirming publishable-key deployment is live)
- [ ] Delete local legacy JWT from `.env.local`, `dist/`, Capacitor assets
- [ ] Apply Supabase migrations 002 and 004 to production

- [ ] Verify swipe-back, haptics and Android back on the iOS Simulator and an Android emulator — DEBT-012
- [ ] Tag releases in git (`v1.0.0` on the PR #36 merge commit); keep `src/data/changelog.ts` in sync each release
- [ ] Legal review of the `/legal` guidance wording before store submission
- [ ] Check the header capsule scroll tint on a real Android phone and iOS 26/27; diagnose missing blur on Android — DEBT-015

### Deferred by decision (2026-11-12) — revisit next session, not blocking the PR #37 merge
- [ ] Translations (DE/PT/ES gaps, About copy + release notes) and the Delete Account endpoint — see Short-term below
- [ ] Device testing (iOS Simulator, Android emulator) — DEBT-012
- [ ] Legal review of `/legal`; `v1.0.0` tag; About "Get in Touch" handles
- [ ] Delete stray untracked `ios/App/App/config 4.xml` in the main checkout; pull `preview_b` locally after the PR #37 merge
- [ ] Promote `preview_b` work to `main`: production (`fit-wizardly.vercel.app`) is built from `main` and still serves the old CSP (AUDIT-007 fix not live there yet)

### Short-term features
- [ ] Decide where meals and workouts are saved (server/Supabase and/or local persistence). Until then `src/lib/offlineSave.ts` stays unwired — see 2026-11-13 entry
- [ ] Food logger tags every logged food as `snack`, so "Copy Last <meal>" and the new "Save as template" in `SmartActions` only appear when the time-of-day meal type matches a logged meal (in practice, late evening). Add a meal-type choice when logging
- [ ] Run Lighthouse (mobile) on the beta and fill in `docs/PERFORMANCE_BASELINE.md`
- [ ] `src/locales/pt.json` has a duplicate top-level `"wizard"` key; the first block is ignored by the JSON parser
- [x] About FitWizard page + What's new release notes + back navigation (PR #36, 2026-09-26)
- [ ] About "Get in Touch" with Instagram/LinkedIn links — DEBT-013
- [x] Remove tracked duplicate `config {2,3}.xml` files — DEBT-010 (done 2026-09-27)
- [ ] Translate About long-form copy + release notes to es/pt/de — DEBT-011
- [ ] Complete DE locale translation — 355 keys missing — AUDIT-001 (`src/locales/de.json`); remove keys from `localeGaps.json` as you go
- [ ] Complete PT locale translation — 366 keys missing — AUDIT-002 (`src/locales/pt.json`)
- [ ] Fill ES locale gaps — 127 keys missing (47 About), investigate 30 orphaned keys — AUDIT-003 (`src/locales/es.json`)
- [x] Smart Meal Shortcuts — copy previous meal, saved meal templates (AUDIT_AND_IDEAS.md §3.6) (done 2026-11-13)
- [x] Energy Balance Trend — dual-axis calories vs. weight chart in NutritionInsights (§3.7) (done 2026-11-13; TDEE estimate not built)
- [ ] CalendarHeatmap — deferred from History page initial implementation
- [ ] Circle/social data in GDPR export (circle posts, reactions, comments) — DEBT-009
- [ ] Data deletion endpoint (backend + Profile UI)
- [x] Confirm nutrition and measurements data included in export (done 2026-09-27; decide whether those stores should persist)

### Medium-term
- [ ] Wire `analyticsStore.ts` TODO to PostHog or custom analytics backend — DEBT-002
- [ ] CircleSettingsTab and CircleMembersTab Phase 5 implementation — DEBT-003
- [ ] Accessibility audit remaining items (RIR aria-labels, wizard keyboard nav) — DEBT-005
- [ ] Test coverage gaps: logging flow, progression engine edge cases — DEBT-004
- [x] Fix pre-existing TypeScript errors — DEBT-001 (done 2026-09-27)

---

## Key Reference Files

| Purpose | File |
|---------|------|
| Audit roadmap + item status | `AUDIT_AND_IDEAS.md` |
| Auth hardening handoff (PR #23) | `docs/codex-auth-hardening-handoff.md` |
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
