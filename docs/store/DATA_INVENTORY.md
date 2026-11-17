# Data inventory

The single source for the privacy policy (`src/pages/Legal.tsx`, `docs/privacy-policy.md`), Apple's App Privacy answers and Google Play's Data safety form. When you add stored data or a new third party, add a row here in the same PR (ADR 10).

- **Built from:** the code on `preview_b` at 2026-11-17 (every persisted store in `src/stores/`, every `fetch` and Supabase call in `src/` and `api/`, the CSP in `vercel.json`, `index.html`), plus the Lane D Day 1, Lane E Day 2–3 and Lane H Day 1 handoffs.
- **Status:** **Now** means it's in the code today. **After Wave N** means planned in the launch project and not built yet.
- **Device storage** means IndexedDB database `fitwizard`, store `kv`, on the web, and `Directory.Data/stores/<key>.json` (Capacitor Filesystem) on iOS and Android. It is never localStorage (ADR 11).
- **"Signed in"** means Supabase is configured and the user has signed in with email. Guests never send training data to Supabase.
- **Export** means the Profile → Export data JSON file (`buildUserDataExport` in `src/lib/dataExport.ts`, export version 2). Lane F's export v3 (Wave 2) is due to cover the gaps marked below.
- **Supabase region:** not recorded in the repo. Lincoln to provide it for the privacy policy.

## Training and health data

| Data | Example fields | Where stored | Sent to | Why | Retention | In export? | Status |
|---|---|---|---|---|---|---|---|
| Workout plans | goal, split, days, exercises, sets, reps, RIR | Device storage, key `fitwizard-plans` (current plan and plan history) | Supabase table `plans` when signed in (`src/lib/plans/`) | Core feature | Until the user deletes the plan or erases data | Yes (`planHistory`) | **Now** |
| Workout logs | per set: reps, weight, RIR; date, total volume | Device storage, `fitwizard-plans` (up to 1,000 logs) | Supabase `workout_logs` when signed in | Core feature, history, analytics | Until deleted | Yes | **Now** on device; Supabase **after Wave 2** (sync, Lane E Day 6) |
| In-progress workout | sets logged so far, start time | Device storage, `fitwizard-plans` (`activeWorkout`) | Nobody | Resume after a crash or restart | Until the workout is finished or discarded | No | **Now** |
| Personal records | exercise, type (weight, reps, volume), value, date | Device storage, `fitwizard-plans` (up to 500) | Supabase `personal_records` when signed in | Progress tracking | Until deleted | Yes | **Now** on device; Supabase **after Wave 2** |
| Training preferences | current week, preferred weight unit | Device storage, `fitwizard-plans` | Nobody | Settings | Until erased | No | **Now** |
| Nutrition logs | meals, foods, calories, macros, timestamps | Device storage, `fitwizard-nutrition-storage` | Supabase `nutrition_days` when signed in | Nutrition tracking | Until deleted | Yes (`nutrition.history`) | **Now** on device; Supabase **after Wave 2** |
| Nutrition settings | profile (age, sex, height, weight, activity level, goal, water goal), calorie and macro targets, custom foods, favourite foods, saved meals | Device storage, `fitwizard-nutrition-storage` | Supabase `nutrition_settings` when signed in | Targets and quick logging | Until deleted | Yes | **Now** on device; Supabase **after Wave 2** |
| Body measurements | date, body weight, body-fat %, chest, waist, hips, arms, thighs, calves, neck, shoulders | Device storage, `fitwizard-measurements` | Supabase `body_measurements` when signed in | Progress tracking | Until deleted | Yes | **Now** on device; Supabase **after Wave 2** |
| Readiness check-ins | date, sleep quality, muscle soreness, energy, stress (ratings 1–5), overall score | Device storage, `readiness-storage` | Supabase `readiness_entries` when signed in | Readiness-based advice | Until deleted | Yes (`readinessLogs`) | **Now** on device; Supabase **after Wave 2** |
| Achievements | badges, counters, streaks, weekly goal | Device storage, `fitwizard-achievements` | Supabase `user_state.achievements` when signed in | Motivation | Until erased | **No** (export v3, Wave 2) | **Now** on device; Supabase **after Wave 2** |
| Custom exercises | name, muscles, equipment, notes | Device storage, `fitwizard-custom-exercises` | Supabase `user_state.custom_exercises` when signed in | User's own exercises | Until deleted | **No** (export v3, Wave 2) | **Now** on device; Supabase **after Wave 2** |
| Exercise favourites and library settings | favourite exercise IDs, collections, filter presets, recently viewed, library settings, offline queue | localStorage `fitwizard-preferences` (WebView localStorage on native). No health data | Supabase `user_exercise_preferences` when signed in (`src/lib/preferences/preferencesRepo.ts`) | Exercise library | Until erased | Settings only (`settings`); favourites and collections **no** (export v3) | **Now** |
| Exercise interactions | exercise ID, interaction type (for example `view`), time | In memory queue | Supabase `exercise_interactions` when signed in (`src/hooks/useExerciseInteraction.ts`) | Exercise stats and badges | Until account deletion | No | **Now** |
| Wizard answers in progress | goal, experience, constraints (for example `no_overhead`), equipment, muscles, schedule | localStorage `fitwizard-wizard` | Nobody | Resume the wizard | Cleared on sign-out, or when the wizard is reset | No | **Now** |
| Onboarding answers | avatar emoji, role, goals of interest (display name is **not** saved) | localStorage `fitwizard-onboarding` | Nobody | Personalise the home screen | Cleared on sign-out | No | **Now** |

Every row in this table except exercise interactions is erased by `clearLocalUserData()` (`src/lib/storage/clearLocalUserData.ts`), which "Erase data on this device" and account deletion use (Lane F, Wave 2). Wizard and onboarding keys are cleared by sign-out (`clearSensitiveStorage` in `src/stores/authStore.ts`).

**Sign-out keeps training data on the device** until cloud sync ships (Lane E Day 3, DEBT-045). The privacy text must say so until Wave 2.

## Account data

| Data | Example fields | Where stored | Sent to | Why | Retention | In export? | Status |
|---|---|---|---|---|---|---|---|
| Account email | email address | Supabase Auth; session tokens on the device (Supabase client) | Supabase (sign-in emails are sent by Supabase) | Sign-in | Until account deletion | No | **Now** |
| Profile | display name (from the email's local part or auth metadata), timezone, role (`client`), avatar URL (empty) | Supabase table `profiles` (`src/stores/authStore.ts`) | Supabase | Account | Until account deletion (cascade from `auth.users`) | No | **Now** |
| Account deletion | — | — | Supabase function `delete-account` | Right to delete | Deletes the account and every row (cascade) | — | **After Wave 2** (Lane F Day 3–4) |
| Email-code sign-in | 6-digit code | Not stored by the app | Supabase Auth | Sign-in on native | Single use | — | **After Wave 1** (Lane H Day 3) |

## Consent and app settings (on the device, no personal data)

| Data | Key | Where stored | Sent to | Status |
|---|---|---|---|---|
| Consent given (timestamp) | `fitwizard_consent_v1` | localStorage | Nobody | **Now** |
| Analytics opt-in | `fitwizard_analytics_consent` and `fitwizard-analytics` (`hasConsented`) | localStorage | Nobody | **Now** |
| Food lookup opt-in (Open Food Facts) | `fitwizard_nutrition_lookup_consent` | localStorage | Nobody | **Now** |
| Crash reporting opt-in | set by Lane C | localStorage | Nobody | **After Wave 1** (Lane C Day 3) |
| Language | `fitwizard-language` | localStorage | Nobody | **Now** |
| Theme | `fitwizard-theme` | localStorage | Nobody | **Now** |
| About and What's new seen | `fitwizard-about-seen`, `fitwizard-changelog-seen` | localStorage | Nobody | **Now** |
| Install coach | `fitwizard-install-coach-v1` (localStorage), `fitwizard-install-coach-visit` (sessionStorage) | Browser storage | Nobody | **Now** |
| Motion tilt permission | `fitwizard-motion-granted` | localStorage | Nobody | **Now** |
| Anatomy view preferences | `fitwizard.mcl.sculpt.v1` | localStorage | Nobody | **Now** |
| Persistent-storage request made | `fitwizard-storage-persist-requested` | localStorage | Nobody | **Now** |
| Pending circle invite code | `pendingInviteCode` | sessionStorage | Nobody | **Now** (Circles is off by default) |

## Caches (public content, no personal data)

| Data | Where stored | Source | Notes | Status |
|---|---|---|---|---|
| Exercise catalogue (bundled snapshot) | Cache Storage `exercise-data` (service worker) | Same origin, `/exercise-data/*.json` | Public exercise catalogue JSON, up to 4 entries, refreshed in the background (Lane D Day 1) | **Now** |
| Exercise library last-known-good copy | localStorage `fitwizard:exercise-library:last-known-good:v2`, `fitwizard:exercise-library:failure-meta:v1` | wger | Offline fallback | **Now** |
| Exercise search results | In memory, 10 minutes | wger, API Ninjas | The search text is sent to wger or API Ninjas; see below | **Now** |
| Daily quote | localStorage `fitwizard:motivation-quote:v1` | API Ninjas through `/api/motivation-quote` | | **Now** |
| App shell | Service worker precache | Same origin | Scripts, styles, icons | **Now** |

## Data sent off the device

| Data | Example fields | Sent to | How | Why | Consent | Retention | Status |
|---|---|---|---|---|---|---|---|
| Barcode and food search | barcode number or search text | Open Food Facts (`world.openfoodfacts.org`), images from `images.openfoodfacts.org` | Direct from the app (`src/lib/openFoodFacts.ts`) | Food lookup | Yes: the food lookup opt-in. Without it, no request is made | Open Food Facts' policy; the app keeps no log | **Now** |
| Exercise catalogue requests | page URL, search text | wger (`wger.de`) | Web: through the Vercel function `/api/proxy-wger`; native: direct today (Lane H plans to route it through the proxy). Search (`WgerAdapter.search`) calls wger directly on both | Exercise library | No (public catalogue; no personal data is sent) | wger's policy | **Now** |
| Exercise search fallback | search text | API Ninjas (`api.api-ninjas.com`) through the Vercel function `/api/exercise-search-ninjas` | Server side; the user's IP stays with Vercel | Search when wger fails | No (no personal data) | API Ninjas' policy | **Now** |
| Daily quote | none | API Ninjas through `/api/motivation-quote` | Server side | Motivation | No | — | **Now** |
| Page views | page path, referrer, device type, country (from IP) | Vercel Web Analytics (same origin, `/_vercel/insights`) | `@vercel/analytics`, mounted only with consent (`src/App.tsx`) | Product analytics | Yes: analytics opt-in | Vercel's policy | **Now** |
| Fonts | IP address, user agent | Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | `index.html` stylesheet link | Typography | No | Google's policy | **Now**. **Remove this row when Lane H's Day 2 (self-hosted fonts) merges** |
| Crash reports | error, stack trace, device and OS, app version; no health values | Sentry | `src/lib/monitoring.ts` (contract 8) | Fix crashes | Yes: opt-in, off by default | Sentry plan default | **After Wave 1** (Lane C Day 3) |
| Product analytics events | event name (for example `plan_generated`, `workout_completed`), simple properties; never weights, measurements, readiness or food | PostHog | `src/lib/analytics/track.ts` (contract 9) | Product decisions | Yes: analytics opt-in | PostHog plan default | **After Wave 2** (Lane C Day 4) |
| Workout reminders and rest timer alerts | reminder days and time, rest end time | Nobody: local notifications, on the device only | `useLocalNotifications` (contract 10) | Reminders | OS notification permission | Until cancelled | **After Wave 2** (Lane H Days 5–6) |
| Circles (social groups) | circle membership, activity posts, reactions, comments | Supabase (`circles`, `circle_members`, `circle_activities`, `activity_reactions`, `activity_comments`, `circle_challenges`) | Supabase client | Social feature | — | Until deleted | Code exists, but **off** (`VITE_FEATURE_CIRCLES` defaults to false). Not in v1 |
| Coach portal | trainer mode, client list | localStorage `fitwizard-trainer`; Supabase `profiles` (`is_trainer`) | Supabase | Coach feature | — | Cleared on sign-out | Code exists, but **off** (`VITE_FEATURE_COACH` defaults to false). Not in v1 |

Not active, recorded so nobody discloses them by mistake: `src/stores/favorites-store.ts` (`fitwizard-favorites`) is imported nowhere (DEBT-044, Lane D deletes it); `src/lib/analytics.ts` (wizard funnel events) only logs to the console in development and has no endpoint; the `analyticsStore` event queue has no upload (the `fetch` is commented out); `src/components/ErrorBoundary.tsx` sends nothing.

## How this maps to the iOS privacy manifest

`ios/App/App/PrivacyInfo.xcprivacy` (Lane H Day 1) declares tracking: **false**, no tracking domains, and four collected types. The store forms must match it.

| Manifest type | Linked to the user | Purpose | Rows above | Optional |
|---|---|---|---|---|
| Email address | Yes | App functionality | Account email | No, for accounts (guests give none) |
| Fitness | Yes | App functionality | Plans, workout logs, personal records, nutrition, measurements, readiness (once synced to Supabase) | Yes: only when signed in |
| Crash data | No | App functionality | Crash reports (Sentry) | Yes: opt-in |
| Product interaction | No | Analytics | Page views (Vercel), product analytics events (PostHog) | Yes: opt-in |

Checks for whoever fills in the forms:
- If crash reports or analytics are ever tied to the account ID, both manifest entries must change to **linked**.
- Food lookups and exercise searches go to third parties but carry no identifier and aren't stored by the app. Decide (Lane A Day 5) whether they count as "collected" under each store's definition. Flag for Lincoln.
- Nutrition and body measurements are health-adjacent. Google's Data safety form lists "Health info" and "Fitness info" separately; Apple has "Health" and "Fitness". The manifest currently declares Fitness only. Lane A Day 5 must check the current wording and decide whether "Health" also applies.

## Third parties

| Name | Purpose | Data sent | Region | Privacy policy | Status |
|---|---|---|---|---|---|
| Supabase | Accounts, database, sign-in emails | Email, profile, synced training data, exercise preferences and interactions | Lincoln to provide (project region) | [supabase.com/privacy](https://supabase.com/privacy) | **Now** |
| Vercel | Hosting, serverless functions, Web Analytics | Every request (IP, user agent); page views with consent | Vercel's global network; function region not set in `vercel.json` | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) | **Now** |
| Open Food Facts | Barcode and food search | Barcode or search text, IP | France (Open Food Facts is a French non-profit) | [world.openfoodfacts.org/privacy](https://world.openfoodfacts.org/privacy) | **Now**, with consent |
| wger | Exercise catalogue | Page and search requests, IP (direct calls) or Vercel's IP (proxied calls) | Germany (wger.de), not verified | [wger.de](https://wger.de) (policy URL not verified) | **Now** |
| API Ninjas | Exercise search fallback, daily quotes | Search text, from Vercel's servers only | Unknown | [api-ninjas.com](https://api-ninjas.com) (policy URL not verified) | **Now** |
| Google Fonts | Web fonts | IP, user agent | Google's global network | [policies.google.com/privacy](https://policies.google.com/privacy) | **Now**, until Lane H Day 2 merges |
| Sentry | Crash reports | Error details, device and OS, app version | Chosen when Lincoln creates the project (US or EU) | [sentry.io/privacy](https://sentry.io/privacy/) | **After Wave 1**, opt-in |
| PostHog | Product analytics | Event names and simple properties, no health values | Chosen when Lincoln creates the project (US or EU) | [posthog.com/privacy](https://posthog.com/privacy) | **After Wave 2**, opt-in |
| Apple / Google | App distribution; native local notifications are scheduled by the OS on the device | Nothing from the app beyond what the stores collect themselves | — | — | **After Wave 2** |

The policy links were written from known URLs. This environment couldn't reach them, so Lane A Day 4 should open each one before the privacy policy cites it.

## Keeping this current

- Add or change a row in the same PR that adds stored data, a third party or a `connect-src` host.
- Before Day 4 (privacy policy) and Day 5 (store forms), re-run the checks this was built from: `grep -rn "persist(\|createUserDataStorage" src/stores`, `grep -rnE "fetch\(|\.from\('" src api`, and the `connect-src` list in `vercel.json`.
