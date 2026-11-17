# FitWizard Launch Roadmap

> **Status:** Current. Written 2026-11-17 from a full review of `preview_b` at `85d5cbd` (all code, docs, migrations, native projects and CI).
> **Owner of updates:** Lane A (see [`docs/project/`](project/README.md)).
> **How this is executed:** the work items below are scheduled day by day, in parallel lanes, in [`docs/project/BOARD.md`](project/BOARD.md). Each lane has a step-by-step brief in [`docs/project/lanes/`](project/lanes/).

## Decisions already made by Lincoln

| Topic | Decision |
|---|---|
| Name | **FitWizard** everywhere users see it. Bundle id stays `com.fitwizardly.app`. Trademark and store-name availability not yet checked (task L5) |
| Positioning | No "AI-powered" claim. FitWizard is a science-based plan builder. A real AI coach is a post-launch idea |
| Business model | Free at launch. A Pro tier is designed later from real usage data |
| v1 audience | Lifters only. Circles and the coach portal are hidden behind feature flags |

## Baseline at the start (Day 0, 2026-11-17)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 4 warnings (pre-existing) |
| `npm run typecheck` | Clean |
| `npm run test:run` | 795 tests in 149 files, all passing (791 / 148 before Day 0 added `featureFlags.test.ts`) |
| `npm --prefix server test` | 14 / 14 passing |

---

## 1. Analysis

### 1.1 What is good

- **A real, deterministic training engine.** `src/lib/planGenerator.ts` (626 lines) and `src/lib/progressionEngine.ts` (629) build splits, sets and reps, a four-week RIR progression with a deload, and per-muscle volume checks against maximum recoverable volume (MRV). It runs offline with no per-user cost.
- **The full lifter loop exists:** a six-step wizard, then the plan, then the workout logger (rest timer, warm-up sets, supersets, plate calculator, RIR or RPE), then the summary, history, analytics and strength curve. Nutrition with barcode lookup and PDF export are also there.
- **A distinctive feature:** the anatomy muscle selector in `src/features/mcl` (front, back and side views, surface and deep layers, search).
- **A solid engineering base:**
  - Strict TypeScript, Zod validation, and CI covering lint, typecheck, tests and build.
  - Row-level security on every database table and a strict Content Security Policy.
  - Every route is lazy-loaded; the initial load is about 338 KB gzipped.
  - PWA with install coaching, dark mode, a consent modal, legal pages and data export.

### 1.2 The biggest problem: user data does not survive a restart

Commit `26e3534` ("Harden auth, persistence, and network security controls", 2026-04-11) cut browser persistence down to preferences only:

| Store | What is saved | What is lost on reload |
|---|---|---|
| `planStore` (`src/stores/planStore.ts:59-64`) | `currentWeek`, weight unit | Current plan, plan history, **all workout logs, all personal records** |
| `nutritionStore` (`src/stores/nutritionStore.ts:44-48`) | `selectedDate` | Profile, targets, meal history, favourites, custom foods, saved meals |
| `trainerStore` (`src/stores/trainerStore.ts:44-48`) | `isTrainerMode` | Clients, templates |
| `measurementsStore` | Nothing (no `persist`) | All measurements |

Only plans come back, and only for signed-in users (`syncWithBackend`, `planStore.ts:186`). No database table exists for workout logs, nutrition, measurements or readiness. A guest who builds a plan and logs a workout loses both on the next launch, which leaves History, Analytics and the strength curve empty after every restart. For a training log, this is the product not working.

### 1.3 Other verified defects

| ID | Finding | Evidence |
|---|---|---|
| A | The app says "AI-powered", but there is no AI anywhere in the code | `index.html:9,29`; `vite.config.ts:167`; `src/locales/en.json:4`; `src/pages/UserGuide.tsx` |
| B | The streak, plans-generated and weekly-progress counters never update | `incrementPlansGenerated` and `updateStreak` are never called outside `achievementStore.ts` |
| C | Some screens show made-up numbers | `src/pages/Revenue.tsx:48`; `src/components/trainer/ClientProgress.tsx:11-27` (`Math.random()`); `CircleDashboardTab.tsx`; `ExerciseBadges.tsx:10` |
| D | The language picker offers French (no French file exists), leaves out Portuguese, and doesn't save the choice | `src/pages/Profile.tsx:215-222` vs `src/lib/i18n.ts:59-70` |
| E | Translations are incomplete: of 576 English keys, es is missing 127, de 355 and pt 366; many components have English hard-coded | `src/test/fixtures/localeGaps.json` |
| F | Users can't delete their account | `src/pages/Profile.tsx:399-403` (commented out) |
| G | Sign-in can't complete inside the native apps: the magic link returns to `window.location.origin`, and nothing handles deep links | `src/stores/authStore.ts:228-241`; `Info.plist`; `AndroidManifest.xml` |
| H | The session is kept in `sessionStorage`, so users are signed out when the app or tab closes | `src/lib/supabase.ts:72-73` |
| I | Relative `/api/...` calls don't resolve inside a native app | `src/lib/motivation/motivationQuoteClient.ts:137`; `src/lib/services/api/exerciseApiAdapter.ts:95` |
| J | iOS: arbitrary network loads are allowed, there is no privacy manifest and no signing team, landscape and iPad are enabled, and the display name is "Fit Wizardly" | `ios/App/App/Info.plist` |
| K | Android: no release signing, no code shrinking, `allowBackup="true"` | `android/app/build.gradle:19-23`; `AndroidManifest.xml:4` |
| L | Express rejects real plan ids: it expects a UUID, but ids look like `plan_<hash>`. Express is also not deployed anywhere; production writes to Supabase directly | `src/lib/planGenerator.ts:560` vs `server/src/index.ts:68,349,380,445` |
| M | Database access rules: users can write their own streak, badge and challenge-score rows; signed-out visitors can read `profiles`; the `circle_members` read policy queries its own table, which likely causes an infinite-recursion error (**not confirmed against a live database**) | `001_circles_schema.sql:75-77,115-122`; `002_exercise_interactions_schema.sql:117-135` |
| N | Production may be missing migrations 002 and 004 (SEC-005). The legacy Supabase key is still in git history and not revoked (SEC-001) | `docs/SESSION_LOG.md` |
| O | No crash reporting, and product analytics events are thrown away | `src/components/ErrorBoundary.tsx:19-26`; `src/stores/analyticsStore.ts:108-127` |
| P | `public/` is 11 MB: a 1.7 MB header logo, three 1.4 MB icons, and 3.7 MB of exercise data in the offline pre-cache list | `vite.config.ts:153-163` |
| Q | Fonts load from Google at runtime. This fails offline and has to be disclosed for privacy | `index.html:13-16` |
| R | The `/api/*` functions accept any origin with no rate limit, so the API Ninjas quota is exposed | `api/*.ts` |
| S | `main` is more than 100 commits behind `preview_b`, so production serves old code | `docs/SESSION_LOG.md` |
| T | The docs describe files, versions and variables that don't exist; the privacy policy has placeholders and wrong claims about third parties | Docs audit (see 1.4) |

### 1.4 Documentation state

- `README.md` was the Lovable starter template. It was rewritten on Day 0.
- `CLAUDE.md`, `docs/ENGINEERING.md`, `SECURITY.md`, `ORCHESTRATION.md`, `API_REFERENCE.md` and `DESIGN_SYSTEM.md` refer to things that don't match the repo:
  - Tailwind 3.4 (it's actually 4.2) and a French locale (it's actually pt)
  - `server/src/routes` and `server/src/middleware`, `SUPABASE_SERVICE_KEY`, Railway and Docker, `/api/plans` (none of these exist)
  - A `.gemini/.../task.md` file that isn't in the repo
- `docs/privacy-policy.md` has a placeholder email and a literal `{TODAY}`. It says no third parties receive data, but Supabase, Open Food Facts, wger, Vercel Analytics and Google Fonts all do.
- `docs/readiness-rubric.md` has never been filled in.
- These are accurate: `docs/SESSION_LOG.md` (session entries), `ABOUT_PAGE.md`, `SUPABASE_MIGRATIONS.md`, `VERCEL_SECRET_ROTATION.md` and `PERFORMANCE_BASELINE.md`.

### 1.5 What is holding it back, most important first

1. Data doesn't persist (1.2).
2. Accounts don't work on phones (G, H) and can't be deleted (F).
3. The app makes claims that aren't true (A, C).
4. Nothing reports crashes or shows whether people use it (O).
5. There's no native build, signing or release pipeline (J, K), and no testing on real devices.

Missing features are not the problem. The app already has more features than a v1 needs.

---

## 2. Rules for anyone implementing this

- **Read first:** `CLAUDE.md`, the "Common Gotchas" section of `docs/SESSION_LOG.md`, `docs/project/README.md`, and your lane file. Until Lane A's Day 1 lands, treat the other lens docs as unreliable.
- **Setup each session:** Node 22, then `npm ci` (cloud sessions do not come with dependencies installed).
- **Every pull request** must pass `npm run lint`, `npm run typecheck` and `npm run test:run`. New logic gets a Vitest test beside it.
- **UI text** always goes through `t('key', 'English fallback')`, with keys added to `en.json` and `es.json`. `src/locales/localeParity.test.ts` is a ratchet: gaps may shrink, never grow.
- **Colours:** use semantic tokens only. Tokens live in the `@theme` block of `src/index.css` (Tailwind 4). Never edit `src/components/ui/*`.
- **Privacy rule (ADR 10):** any new kind of stored data or new third party must be:
  - disclosed in `src/pages/Legal.tsx`
  - included in `src/lib/dataExport.ts`
  - consent-gated, if it leaves the device
- **Releases:** follow the README "Releasing" section.

---

## 3. Work items

Each item has an ID. The project board schedules them, and the lane files break each one into steps with a definition of done. The owning lane is in brackets.

### Phase 0: Honest and tidy

- **0.1 Remove the AI claim** [B; D edits `vite.config.ts`]
  - Files: `index.html` (title, description, Open Graph and Twitter tags), the `tagline` key in all four locale files, `src/pages/Legal.tsx`, the About components, `src/pages/UserGuide.tsx`, `src/data/changelog.ts`, and the unused `ProgressionRecommendations.tsx` / `SplitRecommender.tsx`.
  - Search for: `AI-powered|AI-Powered|AI powered|artificial intelligence`.
  - Replacement line: "Science-based workout plans, built around you."
- **0.2 Feature flags** [C]. The module `src/lib/featureFlags.ts` already exists (Day 0).
  - When a flag is off, the routes in `src/App.tsx:237-290` render `NotFound`.
  - Gate the nav in `src/components/header/mobile-drawer-model.ts:112-145`, `Header.tsx`, `CommandPalette.tsx`, `src/contexts/navigation-direction-context.tsx`, `NotFound.tsx` and `UserGuide.tsx`.
  - Gate the coach toggles in `Profile.tsx`, `Header.tsx`, `Index.tsx`, `Plan.tsx`, `Analytics.tsx` and `wizard/steps/GoalStep.tsx`.
  - Force `isTrainerMode` to false when coach is off.
  - Onboarding skips the `role` step (`src/stores/onboardingStore.ts:56-58`).
  - Hide coach and circle badges in the badge display component.
  - Tests: existing tests mock the flags on; add `src/App.feature-flags.test.tsx`.
- **0.3 Wire the counters** [E]
  - In `src/pages/Wizard.tsx:135-137`, call `incrementPlansGenerated()` after saving the plan.
  - In `planStore.completeWorkout`, call `updateStreak()` and `incrementWeeklyProgress()`. Surface unlocks the way `readinessStore.ts:74` does.
  - Make sure the weekly progress resets at week rollover.
  - Skip posting to circles when circles is off.
- **0.4 Language picker** [B]
  - Build it from `AVAILABLE_LANGUAGES` with `changeLanguage()` (`src/lib/i18n.ts`).
  - Add a `launchReady` field and show en and es only.
  - Translate the Profile labels.
  - Fix the duplicate `"wizard"` key in `pt.json` (lines 13 and 154).
  - Delete the unused `LanguageSelector.tsx`.
- **0.5 Fake content on lifter screens** [B]
  - Remove `ExerciseBadges` from the library.
  - In `MealSuggestions.tsx`, the Unsplash images are blocked by the CSP: remove them or bundle local images.
- **0.6 One name** [H]
  - Change it in `capacitor.config.ts` `appName`, `Info.plist` `CFBundleDisplayName` and its motion usage string, Android `strings.xml`, and the `package.json` name (`fitwizard`).
  - Keep the bundle id.
  - Update the share and docs URLs after L3.
- **0.7 Assets** [D]
  - Regenerate the icons from `resources/icon.png` at 48, 180, 192, 384 and 512 px, compressed.
  - Replace the header logo (`Header.tsx:558`) with a WebP.
  - Take the exercise JSON out of the PWA `includeAssets` and add a Workbox `runtimeCaching` rule (StaleWhileRevalidate) instead.
  - Remove "AI-powered" from the manifest description.
  - Target: `public/` under 5 MB.
- **0.8 Dead code** [D]
  - Run `knip`; remove only what it confirms is unused.
  - Keep `offlineSave.ts` and `planMigrations.ts`.
  - Remove `lovable-tagger`, the root PDFs, `.lovable/` and the empty `apps/`.
  - Add ESLint ignores for `ios/DerivedData` and `ios/**/.build`.
- **0.9 Fix misleading docs** [A]
  - `CLAUDE.md`: versions, locales, directory tree; remove the `.gemini` link and the context-mode block.
  - `AGENTS.md`: handle per decision D6.
  - Add banners to the lens docs.
  - Merge `IOS_XCODE_COMPATIBILITY.md` into `docs/IOS_DEVELOPMENT.md`.

### Phase 1: Data that survives, accounts that can be deleted

- **ADR 11: local-first.** All user data is saved on the device immediately and works without an account or a signal. When the user is signed in, it also syncs to Supabase. This reverses the April decision for data stores. The defence against injected scripts is the strict CSP with no third-party scripts, not storing nothing.
- **1.1 Storage layer** [E]: `src/lib/storage/appStorage.ts`, an async Zustand `StateStorage`.
  - Web: IndexedDB via `idb-keyval`, and call `navigator.storage.persist()` after the first save.
  - Native: `@capacitor/filesystem` in `Directory.Data`.
  - Choose between them with `isNativeApp()`.
  - Add a `HydrationGate` that holds `LoadingScreen` until the stores have rehydrated.
  - Add a date reviver modelled on `normalizePlanDates` (`src/lib/plans/supabasePlansRepo.ts:7`).
- **1.2 Persist the stores** [E], each with a `version` and `migrate`.
  - `planStore`: plans, logs, PRs and `activeWorkout`; raise the caps to 1000 logs and 500 PRs.
  - `nutritionStore`: everything.
  - `measurementsStore`: add `persist`.
  - Move readiness, achievements, custom exercises and favourites to `appStorage`, copying the old localStorage data once.
  - `clearSensitiveStorage` (`src/stores/authStore.ts:58-70`) clears device copies on account sign-out only, never for guests.
- **1.3 Migration `007_user_data.sql`** [F], following the `004_plans_schema.sql` pattern.
  - Seven tables (columns in [`docs/project/CONTRACTS.md`](project/CONTRACTS.md)): owner-only RLS, `ON DELETE CASCADE` from `auth.users`, a `deleted_at` tombstone, and the `set_updated_at()` trigger.
  - Update `src/types/supabase.ts`.
- **1.4 Sync engine** [E] in `src/lib/sync/`.
  - Each data type is a `SyncCollection<T>`, with `pull`, `push` and `syncAll`.
  - Merge rule: per record, the newest `updated_at` wins, and a tombstone beats an older edit. Model it on `mergePlanHistory` (`src/lib/plans/planSyncService.ts:17`).
  - Outbox: `src/lib/offlineSave.ts`.
  - Sync runs on sign-in, when the device comes back online, when the app resumes, and 2 seconds after a local write.
  - On first sign-in, upload any guest data.
  - Move plans onto the engine last.
  - Show a sync indicator in Profile.
- **1.5 Account deletion** [F]
  - Run `supabase init` / `link` and check that the existing migration names are accepted (not yet verified).
  - Add an Edge Function, `delete-account`, using the service-role key held as a function secret.
  - UI: a dialog where the user types DELETE. Guests get "erase this device" instead.
  - Export version 3.
  - Add a web deletion section on `/legal` (Google Play requires one).
- **1.6 Migration `008_policy_fixes.sql`** [F]
  - Use an `is_circle_member()` `SECURITY DEFINER` helper.
  - Remove client writes to streaks, badges and challenge scores.
  - `profiles`: you can read your own row, and signed-in users can read the profiles of people they share a circle with. Nobody signed out can read profiles.
  - Add the missing DELETE policies and cascades.
- **1.7 Retire Express** [F, if D1 = yes]. Remove `server/`, its CI steps, the Vite proxy, `src/lib/apiClient.ts`, the API branch of `plansClient.ts`, the `VITE_USE_API` / `VITE_API_URL` / `VITE_PLANS_PROVIDER` variables, and the related docs.
- **1.8 Release v1.1.0** [A and Lincoln]. Merge `preview_b` into `main`.

### Phase 2: Ready for native

- **2.1 Email-code sign-in** [H]
  - Add `{{ .Token }}` to the Supabase email template.
  - Add `verifyEmailCode()` via `verifyOtp({ type: 'email' })`.
  - Code entry uses the existing `input-otp`, with a 60-second resend cooldown.
  - This needs no deep links and works the same on every platform. Social sign-in comes after launch, because offering Google makes Sign in with Apple mandatory on iOS.
- **2.2 Lasting sessions** [H, decision D2]. Native uses `@capacitor/preferences`; web uses `localStorage`. Record as ADR 12.
- **2.3 API base and hardening** [H]
  - Add `src/lib/apiBase.ts` (`apiUrl()`, `VITE_PUBLIC_APP_ORIGIN`).
  - Add a per-IP rate limit in `api/*`.
  - Align `api/proxy-wger.ts` with the dev proxy: HTTPS only, reject redirects, no raw error text.
- **2.4 Native plugins** [H]
  - Preferences, status bar, splash screen, keyboard, native share.
  - Local notifications: rest timer ended, workout reminders. Ask for permission on first use.
  - Wrap each plugin like `src/hooks/useHaptics.ts`.
  - Turn off `CapacitorHttp` globally.
- **2.5 iOS** [H]
  - Remove the ATS exception.
  - Portrait only, `arm64`, iPhone only (D4).
  - Add `PrivacyInfo.xcprivacy` and the signing team.
  - Self-host the fonts with `@fontsource/*` and update the CSP.
- **2.6 Android** [H]
  - Release signing from a git-ignored `keystore.properties`.
  - Turn on minification and set `allowBackup="false"`.
  - Add `android:*` npm scripts.
- **2.7 Real devices** [H with Lincoln]. Platform matrix, the lifter loop, kill-and-reopen persistence, code sign-in, offline sync, notifications, safe areas, the back button and the keyboard. Close DEBT-012, 015, 020 and 026.

### Phase 3: Good enough for strangers

- **3.1 Crash reporting** [C]
  - Add `src/lib/monitoring.ts` with Sentry, initialised only when a DSN is set and the user has consented.
  - Replace the stub in `ErrorBoundary.tsx` and add an error boundary per route.
  - Add the Sentry host to the CSP.
- **3.2 Product analytics** [C]
  - `track()` with PostHog EU (D5), consent-gated.
  - Events: `onboarding_completed`, `wizard_step_completed`, `plan_generated`, `workout_started`, `workout_completed`, `meal_logged`, `signed_in`, `account_deleted`.
  - No health values in events.
- **3.3 Translation** [J1, J2]. Hard-coded text moves into `t()`; complete Spanish (D3).
- **3.4 Accessibility** [D]
  - RIR text labels.
  - 44 px minimum touch targets on the sculpt slider and layer toggle.
  - `MotionConfig reducedMotion="user"`.
  - Fix DEBT-021 (theme in the muscle selector) and DEBT-025 (Enter key in the wizard).
- **3.5 End-to-end tests** [D]. A Playwright test of the lifter loop with a reload, plus a chromium CI job.
- **3.6 First five minutes**
  - a: empty states [B].
  - b: PDF export bugs: duplicated "DAY 1:", wrapping headers, garbled emoji [D].
  - c: fewer taps to the first plan [B].

### Phase 4: Store submission

- **4.1 Privacy policy and terms** [A]. Accurate, hosted at `/legal`, and reviewed by a qualified person. A draft written by AI is not legal advice.
- **4.2 Store forms** [A]. Apple privacy labels, Google Data Safety, the health declaration, the age rating and the disclaimer.
- **4.3 Listing** [A]. Copy and screenshots (Playwright at the required sizes).
- **4.4 Test tracks** [Lincoln]. TestFlight and a Play closed test. New personal Play accounts need at least 12 testers for 14 days; **check the current rule in Play Console**.
- **4.5 Release pipeline** [H: Android build job; D: `npm audit` gate and Dependabot]. Git tags per release.
- **4.6 Readiness rubric** [A]. Fill in `docs/readiness-rubric.md` as the go/no-go record.

### Phase 5: Desktop

- The installed PWA is the desktop app first.
- A Microsoft Store package via PWABuilder.
- A Tauri 2 wrapper for macOS. Tauri over Electron: installers of a few MB instead of 100+, and no bundled browser to keep patched.

### Phase 6: After launch (not scheduled)

1. Pro subscription via RevenueCat, designed from Phase 3 analytics data.
2. Apple Health and Health Connect.
3. Circles relaunch with report, block and moderation (required by both stores for user content). Also: real stats in place of the hard-coded ones, finished Settings and Members tabs (DEBT-003), and invite brute-force limits.
4. Coach portal on real tables, replacing the `ClientProgress.tsx` and `Revenue.tsx` mocks, then a coach subscription.
5. Widgets and watch apps.
6. A real server-side AI coach. Only then can the AI wording come back.

---

## 4. Open decisions (defaults apply if unanswered by the day needed)

| ID | Decision | Default | Needed by |
|---|---|---|---|
| D1 | Retire the Express server? | Yes (production doesn't use it) | Day 5, Lane F |
| D2 | Keep users signed in across restarts (move the session out of `sessionStorage`)? | Yes | Day 4, Lane H |
| D3 | Launch languages | English and Spanish | Day 2, Lane B |
| D4 | iPhone only for v1, no iPad? | Yes | Day 1, Lane H |
| D5 | Analytics tool | PostHog, EU region | Day 4, Lane C |
| D6 | Is `AGENTS.md` / "context-mode" used on Lincoln's machine? | No, so delete it | Day 1, Lane A |

## 5. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Merge conflicts between parallel lanes | Medium | File ownership, contracts, rebase rule, fixed merge order (`docs/project/README.md`) |
| Integration bugs nobody owns | Medium | Gate smoke tests, buffer days, a Playwright loop test in CI from Day 4 |
| One reviewer can't keep up with about seven PRs a day | High with 7 lanes | Run 4 agents; keep PRs small |
| Sync loses or duplicates data | Medium | Tombstones, per-record merge, engine tests, two weeks on the beta before `main`, JSON export as a manual backup |
| Cloud agents can't build iOS or run Supabase | Certain | Lane F tests SQL on local Postgres with an `auth` stub, and Lincoln applies it to staging. Lane H edits native config, and Lincoln builds on a Mac |
| Apple rejects it as "just a website" (guideline 4.2) | Medium | Notifications, haptics, native share, offline use, no web footer on native |
| Migration 008 breaks Circles | Medium | Circles is off in v1; test on staging first |
| Scope creep | High | Phase 6 is the parking lot |

## 6. Timeline (honest)

- About **12 project days** of agent work. With daily merges, that's roughly **3 calendar weeks** for the code.
- Some waits can't be shortened by adding agents:
  - Apple Developer enrolment (can take several days)
  - Google Play's 14-day closed test, starting at Gate 2 (Day 7)
  - Store review (Apple is often 1 to 3 days; this varies)
  - Device testing and PR review by Lincoln
- Earliest realistic dates: iOS submission around Day 10. Android production around Day 7 plus 14 days, so **about 4 to 5 weeks from the start**.
