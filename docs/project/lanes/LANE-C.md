# Lane C: App Shell & Observability

**Mission:**
- Hide what isn't in v1 (Circles, coach portal) without deleting it.
- Make crashes visible.
- Measure what users actually do, with consent.

**Active:** Days 1–6 (Day 7 off). With 4 agents, this lane is paired with Lane D.

## Read first
- `docs/project/README.md`
- `docs/project/CONTRACTS.md` #1, #8 and #9
- `src/App.tsx`
- `src/lib/consent.ts`
- `src/components/legal/ConsentModal.tsx`

## Owns

**Wave 1**
- `src/App.tsx`
- `src/components/Header.tsx` (except the logo `src`, which is Lane D's on Day 1)
- `src/components/header/*`, `src/components/CommandPalette.tsx`
- `src/contexts/navigation-direction-context.tsx`
- `src/pages/NotFound.tsx`
- Circles and coach links in `src/pages/UserGuide.tsx`, from Day 2 (Lane B edits AI wording there on Day 1)
- `src/stores/trainerStore.ts`, `src/stores/onboardingStore.ts`
- The coach toggle in `src/pages/Profile.tsx`, `src/pages/Index.tsx`, `src/pages/Plan.tsx`, `src/pages/Analytics.tsx` and `src/components/wizard/steps/GoalStep.tsx`
- `src/components/motivation/BadgeDisplay.tsx`
- `src/main.tsx` from Day 3 (Lane E adds `HydrationGate` on Day 1)
- `vercel.json` from Day 3 (Lane H edits the font CSP on Day 2)
- `src/components/ErrorBoundary.tsx`

**Wave 2**
- The same files, plus `src/components/legal/ConsentModal.tsx`, `src/lib/consent.ts`, `src/stores/analyticsStore.ts`, `src/lib/analytics/*` and `src/lib/monitoring.ts`

**Locale keys:** `featureFlags.*`, `consent.*`, `errors.*`

## Must not touch
Data stores other than `trainerStore` and `onboardingStore`, the sync code, native files, `Legal.tsx` (send disclosure text to Lane A).

## Contracts
- **Uses:** #1 feature flags (already merged).
- **Provides:** #8 monitoring (Day 3), #9 analytics (Day 4).

---

## Day 1: Flags, part 1 — routes and every way in (0.2)

### Steps
1. In `src/App.tsx`, around lines 237–290:
   - Wrap the `/clients`, `/clients/:clientId`, `/templates` and `/revenue` routes so they render `<NotFound />` when `!isFeatureEnabled('coach')`.
   - Do the same for `/circles`, `/circles/join/:inviteCode` and `/circles/:circleId/*` when `!isFeatureEnabled('circles')`.
   - Read the flags once at module level (`const COACH = isFeatureEnabled('coach')`). They're build-time values.
   - The `pendingInviteCode` effect (around line 335) should do nothing when circles is off.
2. In `src/components/header/mobile-drawer-model.ts`, `buildMobileNavItems` (around line 112):
   - Leave out the `/circles` item when circles is off.
   - Return no trainer items when coach is off, even if `isTrainerMode` is true.
3. In `src/components/Header.tsx`, apply the same filtering to the desktop nav. Hide the "Coach Mode" toggle (around line 662) and the trainer dropdown entries when coach is off.
4. In `src/components/CommandPalette.tsx`, hide the Circles command (around line 86) and the circles group (around line 142) when circles is off. Also hide any coach commands.
5. In `src/contexts/navigation-direction-context.tsx`, it's fine to keep the routes in the ordering list; just confirm nothing renders a link from it.
6. In `src/pages/NotFound.tsx`, hide the `/circles` link (around line 66) when circles is off.
7. Tests:
   - Add `src/App.feature-flags.test.tsx`. With both flags off, each of the seven paths renders the NotFound page. With both on (`vi.stubEnv`), they render their pages. Follow the pattern in `src/App.auth-routing.test.tsx`.
   - For existing tests that render Circles or coach UI, add `vi.stubEnv('VITE_FEATURE_CIRCLES','true')` / `('VITE_FEATURE_COACH','true')` in `beforeEach`, plus `vi.unstubAllEnvs()` in `afterEach`.
   - Extend `src/components/__tests__/Header.mobile-menu-layout.test.tsx` and the drawer model test for both flag states.

### Done when
- [ ] With the default `.env.example` values, no menu, palette or link leads to Circles or coach pages, and typing those URLs shows NotFound.
- [ ] With both flags `true`, everything works as before.
- [ ] Lint, typecheck and tests are green.

---

## Day 2: Flags, part 2 — coach mode, onboarding and badges (0.2)

> **Carried over from Day 1 handoffs (added 2026-11-17 by the coordinator).** Do these too:
> - `CommandPalette.tsx` has commands for `/achievements`, `/settings` and `/auth`. None of those routes exist, so they land on the 404 page. Point them at real routes (`/profile`, the auth modal) or remove them. The "Documentation" command opens `docs.fitwizardly.com`, which may not exist; point it at `/guide`. DEBT-050.
> - `App.auth-routing.test.tsx`: the `CircleLayout` mock exports `default`, but `App.tsx` imports the named export. Fix the mock. DEBT-051.
> - Check `TrainerDashboard` on Index once `trainerStore` forces coach mode off.
> - Gate the UserGuide Circles tab, which is already on this day's list. DEBT-047.


### Steps
1. `src/stores/trainerStore.ts`:
   - When `!isFeatureEnabled('coach')`, `isTrainerMode` is always `false`. Do this in the initial state, in the persisted-state sanitiser (`sanitizeTrainerPersistedState`, around line 46) and in `setTrainerMode` / toggle (around lines 64–80).
   - Every page computes `isTrainerEnabled = isTrainerAuthorized && isTrainerMode`, so this single change disables coach behaviour everywhere.
2. Hide the coach toggle UI when coach is off:
   - `Profile.tsx` (the trainer section, around line 61 onward)
   - `GoalStep.tsx` (around line 33)
   - Also check `Index.tsx`, `Plan.tsx` and `Analytics.tsx` for visible coach entry points (for example `TrainerDashboard`) and hide them.
   - Don't edit other parts of `Profile.tsx`; Lane B owns the language block.
3. `src/stores/onboardingStore.ts`, around lines 56–62:
   - When coach is off, `getStepsForRole` returns `['welcome', 'goals']`, and `setRole` is forced to `'user'`.
   - Update `src/components/onboarding/OnboardingFlow.test.tsx` and `src/test/onboardingStore.test.ts`: the existing role and coach cases set the coach flag on, and a new case covers the flag off.
4. `src/components/motivation/BadgeDisplay.tsx`:
   - Leave out badges whose id starts with `circle_`, `team_player` or `social_butterfly` when circles is off.
   - Leave out `trainer_activated`, `first_client`, `clients_*` and `template_creator` when coach is off.
   - Filter in the component. **Don't edit `achievementStore.ts`**; Lane E owns it.
5. `src/pages/UserGuide.tsx`: hide the Circles tab (around lines 29 and 142–182) when circles is off.

### Done when
- [ ] With flags off: onboarding has no role step, there is no coach toggle anywhere, and the badge grid shows no social or coach badges.
- [ ] With flags on: unchanged.
- [ ] Tests cover both states.

---

## Day 3: Crash reporting (3.1)

> **Carried over from Day 2 handoffs and review (added 2026-11-18 by the coordinator).** Do these too:
> - Add the crash-reporting consent key to `docs/store/DATA_INVENTORY.md`'s consent table **through your handoff** (Lane A edits the file).
> - Analytics consent is stored twice (`fitwizard-analytics.hasConsented` and `fitwizard_analytics_consent`; DEBT-061). Crash consent must use **one** key. Pick the one in `src/lib/consent.ts` and say in your handoff which one Day 4/5 should settle on for analytics.
> - `BadgeUnlockModal.tsx` was deleted by Lane D (#54), so that note from your Day 2 handoff is closed. `BadgeDisplay`/`BadgeGrid` has no consumer in the app now (DEBT-066). Decide in your handoff: keep it for a future achievements page, or let Lane D delete it in Wave 2.


### Steps
1. `npm install @sentry/react`. Don't add `@sentry/capacitor` yet; native setup is a Lane H follow-up after Gate 2. Note this in your handoff.
2. Create `src/lib/monitoring.ts` (contract #8):
   - `initMonitoring()` runs `Sentry.init` only when `import.meta.env.VITE_SENTRY_DSN` is set **and** `hasAnalyticsConsent()` returns true (`src/lib/consent.ts`). Use a separate `crashReportsConsent` key if you add one on Day 5. Until then, reuse the analytics consent.
   - Set `release: __APP_VERSION__`, `environment: import.meta.env.MODE`, `tracesSampleRate: 0` (errors only), and the strictest `dataCollection` setting (Sentry SDK v11 removed `sendDefaultPii`; see the Lane C Day 3 handoff).
   - `beforeSend`: strip query strings and drop any `extra` keys that look like health data (weights, measurements, food).
   - `captureError(error, context?)` always works. It forwards to Sentry if initialised, otherwise `console.error`.
   - Listen for `CONSENT_RESOLVED_EVENT` so monitoring starts as soon as the user consents.
3. In `src/main.tsx`, call `initMonitoring()` before render.
4. In `src/components/ErrorBoundary.tsx`, replace the body of `logErrorToService` (around lines 19–26) with `captureError(error, { componentStack })`.
5. Add per-route boundaries in `src/App.tsx`:
   - Wrap the element passed to each `<Route>`, or wrap the `<Routes>` block inside `PageTransition`, in an `ErrorBoundary` with a compact fallback card: "This page hit a problem." plus **Try again** (resets the boundary) and **Go home**.
   - Key the boundary by `location.pathname` so navigating away recovers.
   - The global boundary stays in place.
6. `vercel.json`: add the Sentry ingest host for your DSN region to `connect-src`, for example `https://*.ingest.sentry.io` or the exact host. Use the exact host if L6 has given you the DSN.
7. Add `VITE_SENTRY_DSN=` to `.env.example` in a "Monitoring" block.
8. Tests:
   - `monitoring.test.ts`: no DSN → no init; DSN without consent → no init; DSN with consent → init called.
   - A per-route boundary test: a route that throws shows the fallback, and the header still renders.
9. Handoff: send Lane A disclosure text for Sentry (what is sent, the region, and that it's opt-in).

### Done when
- [ ] Throwing inside one page shows the per-route fallback, and the rest of the app still works.
- [ ] With a DSN and consent, a test error reaches Sentry (Lincoln checks this after L6).
- [ ] Tests are green.

---

## Day 4: Product analytics (3.2)

Decision **D5**. Default: PostHog, EU region.

### Steps
1. `npm install posthog-js`.
2. Create `src/lib/analytics/track.ts` (contract #9):
   - Initialise PostHog lazily, using a dynamic import, only when `VITE_POSTHOG_KEY` is set and `hasAnalyticsConsent()` is true.
   - Use `api_host` for the EU region, `autocapture: false`, `capture_pageview: false` (send page views manually on route change), `persistence: 'localStorage'` and `disable_session_recording: true`.
   - `track(event, props)` checks that `props` contains only allowed keys (`step`, `goal`, `days_per_week`, `exercise_count`, `duration_min`, `source`, `platform`) and drops anything else. This is the guard against sending health values.
3. Replace the code that discards events in `src/stores/analyticsStore.ts` `flushEvents` (around lines 108–127): forward queued events to `track()`. If the store no longer earns its keep, reduce it to a thin wrapper and say so in the handoff.
4. Send page views from the router: a small `usePageViews()` hook in `App.tsx` that calls `track('$pageview')` on `location.pathname` change. Add `'$pageview'` to the event union in `CONTRACTS.md` as a documented change.
5. Wire these events. Only add the call; for files other lanes own, put the one-line `track()` call in your handoff for the owner to add, **except** where noted:
   - `plan_generated` (`Wizard.tsx`, owned by Lane E in Wave 1 and Lane B in Wave 2): handoff to Lane B.
   - `workout_started` and `workout_completed` (`planStore.ts`, Lane E): handoff to Lane E.
   - `meal_logged` (`nutritionStore.ts`, Lane E): handoff to Lane E.
   - `signed_in` (`authStore.ts`, Lane H): handoff to Lane H.
   - `onboarding_completed` and `wizard_step_completed`: Lane B on Day 4.
6. `vercel.json`: add the PostHog EU ingest hosts to `connect-src`.
7. `.env.example`: add `VITE_POSTHOG_KEY=` to the Monitoring block.
8. Tests: the allow-list strips health keys, nothing is sent without consent, and nothing is initialised without a key.

### Done when
- [ ] With a key and consent, events appear in PostHog live events (Lincoln checks).
- [ ] Without consent, there are zero network calls to PostHog (Playwright or a unit test with a mocked import).

---

## Day 5: Consent screen and disclosures

### Steps
1. `ConsentModal.tsx`: add two separate, clearly labelled toggles, both **off by default**:
   - "Send crash reports" (Sentry)
   - "Share anonymous usage statistics" (PostHog plus Vercel Analytics)
   
   Store them under new keys in `src/lib/consent.ts` (`CRASH_REPORTS_CONSENT_STORAGE_KEY`, alongside `ANALYTICS_CONSENT_STORAGE_KEY`). Switch `monitoring.ts` to the crash-reports key.
2. Make sure the Profile → Privacy Settings button (`requestConsentModal`) reopens the modal, and that revoking consent stops both tools immediately: call `posthog.opt_out_capturing()` and `Sentry.close()`.
3. Update `ConsentModal.test.tsx`.
4. In the handoff, give Lane A the exact disclosure text for `Legal.tsx`: tool, purpose, data sent, region, retention (per vendor default; Lincoln confirms), and how to opt out.

**Done when:** each toggle works on its own, revoking takes effect without a reload, and tests are green.

---

## Day 6: Hardening

1. Error-boundary tests for the three heaviest pages (Plan, Workout logger, Analytics). Each renders its fallback when a child throws.
2. If L6 is done and `SENTRY_AUTH_TOKEN` is available as a Vercel build environment variable, add `@sentry/vite-plugin` to upload source maps at build time. Never commit the token. If not available, document the steps for Lincoln in the handoff.
3. Go through `App.tsx` and remove anything made obsolete by the flags (for example eager imports of circle components that are now unreachable). Lazy imports are fine to keep.

**Done when:** the boundary tests pass and the source-map setup is either done or documented.
