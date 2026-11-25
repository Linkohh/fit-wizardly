# Data inventory

The single source for the privacy policy (`src/pages/Legal.tsx`, `docs/privacy-policy.md`), Apple's App Privacy answers and Google Play's Data safety form. When you add stored data or a new third party, add a row here in the same PR (ADR 10).

- **Built from:** the code on `preview_b` at 2026-11-17 (every persisted store in `src/stores/`, every `fetch` and Supabase call in `src/` and `api/`, the CSP in `vercel.json`, `index.html`, `api/_lib/guard.ts`), plus the Lane D Day 1, Lane C Day 3, Lane D Day 3, Lane E Day 2–6, Lane F Day 3–4 and Lane H Day 1–4 handoffs. Updated 2026-11-18 for Wave 1 Day 2 (self-hosted fonts, wger through the proxy, sync keys, API limits), 2026-11-21 for Lane F Day 4 (#73: deletion UI, guest erase, export v3), 2026-11-23 for Lane H Day 4 (#74: lasting sign-in session), and 2026-11-25 for Wave 2 Day 5 (#80–#85: Lane H's share cache; the store-form decisions). Lane F Day 5 (#80), Lane B Day 5 (#82), Lane D Day 5 (#84) and the theme fade (#85) add no stored data or third party. Lanes B (#76) and D (#78) Day 4 add no stored data or third party.
- **Status:** **Now** means it's in the code today. **After Wave N** means planned in the launch project and not built yet.
- **Device storage** means IndexedDB database `fitwizard`, store `kv`, on the web, and `Directory.Data/stores/<key>.json` (Capacitor Filesystem) on iOS and Android. It is never localStorage (ADR 11).
- **"Signed in"** means Supabase is configured and the user has signed in with email. Guests never send training data to Supabase.
- **Export** means the Profile → Export data JSON file (`buildUserDataExport` in `src/lib/dataExport.ts`, **export version 3** since #73). The column names the export key.
- **Supabase region:** not recorded in the repo. Lincoln to provide it for the privacy policy.

## Training and health data

| Data | Example fields | Where stored | Sent to | Why | Retention | In export? | Status |
|---|---|---|---|---|---|---|---|
| Workout plans | goal, split, days, exercises, sets, reps, RIR | Device storage, key `fitwizard-plans` (current plan and plan history) | Supabase table `plans` when signed in, through the sync engine like the other tables (`plansCollection` in `src/lib/sync/collections/training.ts`, #81). A delete is marked with `deleted_at` and reaches every signed-in device; the device keeps the newest 20 plans, and older ones stay in the account | Core feature | Until the user deletes the plan or erases data | Yes (`planHistory`, `currentPlan`) | **Now** |
| Workout logs | per set: reps, weight, RIR; date, total volume | Device storage, `fitwizard-plans` (up to 1,000 logs) | Supabase `workout_logs` when signed in | Core feature, history, analytics | Until deleted | Yes | **Now**: device, and Supabase when signed in (sync on since #66, Lane E Day 6) |
| In-progress workout | sets logged so far, start time | Device storage, `fitwizard-plans` (`activeWorkout`) | Nobody | Resume after a crash or restart | Until the workout is finished or discarded | Yes (`activeWorkout`) | **Now** |
| Personal records | exercise, type (weight, reps, volume), value, date | Device storage, `fitwizard-plans` (up to 500) | Supabase `personal_records` when signed in | Progress tracking | Until deleted | Yes | **Now**: device, and Supabase when signed in (sync on since #66) |
| Training preferences | current week, preferred weight unit | Device storage, `fitwizard-plans` | Nobody | Settings | Until erased | Yes (`trainingPreferences`) | **Now** |
| Nutrition logs | meals, foods, calories, macros, timestamps | Device storage, `fitwizard-nutrition-storage` | Supabase `nutrition_days` when signed in | Nutrition tracking | Until deleted | Yes (`nutrition.history`) | **Now**: device, and Supabase when signed in (sync on since #66) |
| Nutrition settings | profile (age, sex, height, weight, activity level, goal, water goal), calorie and macro targets, custom foods, favourite foods, saved meals | Device storage, `fitwizard-nutrition-storage` | Supabase `nutrition_settings` when signed in | Targets and quick logging | Until deleted | Yes | **Now**: device, and Supabase when signed in (sync on since #66) |
| Body measurements | date, body weight, body-fat %, chest, waist, hips, arms, thighs, calves, neck, shoulders | Device storage, `fitwizard-measurements` | Supabase `body_measurements` when signed in | Progress tracking | Until deleted | Yes | **Now**: device, and Supabase when signed in (sync on since #66) |
| Readiness check-ins | date, sleep quality, muscle soreness, energy, stress (ratings 1–5), overall score | Device storage, `readiness-storage` | Supabase `readiness_entries` when signed in | Readiness-based advice | Until deleted | Yes (`readinessLogs`) | **Now**: device, and Supabase when signed in (sync on since #66) |
| Achievements | badges, counters, streaks, weekly goal | Device storage, `fitwizard-achievements` | Supabase `user_state.achievements` when signed in | Motivation | Until erased | Yes (`achievements`) | **Now**: device, and Supabase when signed in (sync on since #66) |
| Custom exercises | name, muscles, equipment, notes | Device storage, `fitwizard-custom-exercises` | Supabase `user_state.custom_exercises` when signed in | User's own exercises | Until deleted | Yes (`customExercises`) | **Now**: device, and Supabase when signed in (sync on since #66) |
| Exercise favourites and library settings | favourite exercise IDs, collections, filter presets, recently viewed, library settings, offline queue | localStorage `fitwizard-preferences` (WebView localStorage on native). No health data | Supabase `user_exercise_preferences` when signed in (`src/lib/preferences/preferencesRepo.ts`) | Exercise library | Until erased | Yes (`exercisePreferences`, `settings`) | **Now** |
| Exercise interactions | exercise ID, interaction type (for example `view`), time | In memory queue | Supabase `exercise_interactions` when signed in (`src/hooks/useExerciseInteraction.ts`) | Exercise stats and badges | Until account deletion | No | **Now** |
| Wizard answers in progress | goal, experience, constraints (for example `no_overhead`), equipment, muscles, schedule | localStorage `fitwizard-wizard` | Nobody | Resume the wizard | Cleared on sign-out, or when the wizard is reset | Yes (`wizardDraft`) | **Now** |
| Onboarding answers | avatar emoji, role, goals of interest (display name is **not** saved) | localStorage `fitwizard-onboarding` | Nobody | Personalise the home screen | Cleared on sign-out | Yes (`onboarding`) | **Now** |
| Sync outbox | which items changed (collection and item ID) and when; **no content** | Device storage, `fitwizard-sync-outbox` | Nobody (it tells the sync engine what to upload) | Upload changes made offline | Until the change is uploaded, or erased | No | **Now** |
| Sync cursor | the last pull position per table (timestamps) | Device storage, `fitwizard-sync-cursor` | Nobody | Pull only what changed | Until erased | No | **Now** |
| First-upload record | the account IDs this device has already backed up to | Device storage, `fitwizard-sync-first-upload` | Nobody | So the first-sign-in upload runs once per account per device | Until erased | No | **Now** (#66, Lane E Day 6) |

Every row in this table except exercise interactions (which live only in memory and in Supabase) is erased by `clearLocalUserData()` (`src/lib/storage/clearLocalUserData.ts`). That covers the nine stores in `USER_DATA_STORES` (including `fitwizard-wizard` and `fitwizard-onboarding`, since #59) and all three sync keys (outbox, cursor, first-upload record), and it also empties the outbox in memory. "Erase data on this device" (guests) and account deletion use it (#73). Sign-out separately clears the wizard and onboarding keys (`clearSensitiveStorage` in `src/stores/authStore.ts`).

**Cloud sync (on since #66, Lane E Day 6):** for a signed-in user, the seven migration 007 tables sync with Supabase: on sign-in, when the device comes back online, when the app returns to the foreground, and 2 seconds after a change. Nothing is sent while offline or signed out; changes made while signed out are tracked and sent at the next sign-in. On the **first sign-in on a device**, the app pulls the account first and uploads only records that exist solely on this device (the cloud copy wins where both exist), then shows a toast. One trade-off: badges and streaks earned as a guest on a second device are replaced by the account's. Items whose day can't be stored stay on the device only. Rows pulled from the cloud go through the same load checks as the device copy. Exercise favourites keep their existing separate sync (`user_exercise_preferences`). The Profile page shows the sync status.

**Sign-out erases training data from the device** (#81, Lane E Day 7, DEBT-045 closed). Profile → **Sign out** syncs one last time, warns if some changes are still unsent (for example offline), then runs `clearLocalUserData()` (`src/lib/sync/signOut.ts`). The account keeps the synced copy.

## Account data

| Data | Example fields | Where stored | Sent to | Why | Retention | In export? | Status |
|---|---|---|---|---|---|---|---|
| Account email | email address | Supabase Auth; session token on the device: `localStorage` key `sb-<project>-auth-token` on the web, `@capacitor/preferences` (iOS UserDefaults, Android SharedPreferences) in the apps. Kept until sign-out (ADR 12, #74); it used to be `sessionStorage`, which cleared when the tab closed | Supabase (sign-in emails are sent by Supabase) | Sign-in | Until account deletion | Yes (`account`) | **Now** |
| Profile | display name (from the email's local part or auth metadata), timezone, role (`client`), avatar URL (empty) | Supabase table `profiles` (`src/stores/authStore.ts`) | Supabase | Account | Until account deletion (cascade from `auth.users`) | Yes (`account`) | **Now** |
| Account deletion | the signed-in user's access token (no body) | — | Supabase Edge Function `delete-account` (`supabase/functions/delete-account/`): verifies the token, then deletes that user with the service-role key, which exists only as a secret in this function | Right to delete | Deletes the account and every row that references it (cascade; checked by `supabase/tests/delete_account.test.sql`). Circles and challenges the user created survive with `created_by` cleared | — | **Now (in code)**: function built (#65); in-app **Profile → Details → Delete account** (type DELETE to confirm) and guest **Erase data on this device** built (#73, `src/components/account/AccountDeletionSection.tsx`, `src/lib/account/deleteAccount.ts`). The function is deployed at L10. After deletion, other signed-in devices keep their local copy until they sign out (Lane F Day 4 issue) |
| Email-code sign-in | 6-digit code sent in the sign-in email (with the link, which web users can still tap) | Not stored by the app; typed into the sign-in dialog and sent once to Supabase (`verifyEmailCode` in `src/stores/authStore.ts`) | Supabase Auth | Sign-in on web and native (the only path on native) | Single use; expires after 10 minutes once L11 sets Supabase's code lifetime to 600 seconds | — | **Now** (#62, Lane H Day 3). No new stored data |

## Consent and app settings (on the device, no personal data)

| Data | Key | Where stored | Sent to | Status |
|---|---|---|---|---|
| Consent given (timestamp) | `fitwizard_consent_v1` | localStorage | Nobody | **Now** |
| Analytics opt-in | `fitwizard_analytics_consent` and `fitwizard-analytics` (`hasConsented`) | localStorage | Nobody | **Now** |
| Food lookup opt-in (Open Food Facts) | `fitwizard_nutrition_lookup_consent` | localStorage | Nobody | **Now** |
| Crash-report opt-in | `fitwizard_analytics_consent`, shared with analytics until Lane C Day 5 adds its own toggle (then `fitwizard_crash_reports_consent`) | localStorage | Nobody | **Now** (shared key, #69) |
| Sign-in session | `sb-<project>-auth-token` (plus `-user` and `-code-verifier`): the Supabase session token, no workout or health data | localStorage (web), `@capacitor/preferences` (native). Falls back to sessionStorage for the tab, or memory, if localStorage can't be written | Supabase (sent with each signed-in request) | **Now** (#74, Lane H Day 4). Removed by sign-out |
| Language | `fitwizard-language` | localStorage | Nobody | **Now** |
| Theme | `fitwizard-theme` | localStorage | Nobody | **Now** |
| About and What's new seen | `fitwizard-about-seen`, `fitwizard-changelog-seen` | localStorage | Nobody | **Now** |
| Install coach | `fitwizard-install-coach-v1` (localStorage), `fitwizard-install-coach-visit` (sessionStorage) | Browser storage | Nobody | **Now** |
| Motion tilt permission | `fitwizard-motion-granted` | localStorage | Nobody | **Now** |
| Anatomy view preferences | `fitwizard.mcl.sculpt.v1` | localStorage | Nobody | **Now** |
| Persistent-storage request made | `fitwizard-storage-persist-requested` | localStorage | Nobody | **Now** (#64, Lane E Day 5): the browser is asked once, after the first save, not to evict the app's saved data (`requestPersistentStorage()` in `src/lib/storage/appStorage.ts`) |
| Pending circle invite code | `pendingInviteCode` | sessionStorage | Nobody | **Now** (Circles is off by default) |

The consent timestamp and the analytics and food-lookup choices are in the export (`consent`) since #73. The other settings here are not.

## Caches (public content, no personal data)

| Data | Where stored | Source | Notes | Status |
|---|---|---|---|---|
| Exercise catalogue (bundled snapshot) | Cache Storage `exercise-data` (service worker) | Same origin, `/exercise-data/*.json` | Public exercise catalogue JSON, up to 4 entries, refreshed in the background (Lane D Day 1) | **Now** |
| Exercise library last-known-good copy | localStorage `fitwizard:exercise-library:last-known-good:v2`, `fitwizard:exercise-library:failure-meta:v1` | wger | Offline fallback | **Now** |
| Exercise search results | In memory, 10 minutes | wger, API Ninjas | The search text is sent to wger or API Ninjas; see below | **Now** |
| Daily quote | localStorage `fitwizard:motivation-quote:v1` | API Ninjas through `/api/motivation-quote` | | **Now** |
| App shell | Service worker precache | Same origin | Scripts, styles, icons | **Now** |
| Shared workout card | App cache folder: `Caches/share/` (iOS), `cache/share/` (Android). Native only | Made on the device | Written only so the phone's share sheet can read it (`useShare`, `src/hooks/useShare.ts`); leaves the device only if the person picks a share target. The OS may clear it at any time. On the web, the image goes straight to `navigator.share` | **Now** (#83, Lane H Day 5) |

## Data sent off the device

| Data | Example fields | Sent to | How | Why | Consent | Retention | Status |
|---|---|---|---|---|---|---|---|
| Barcode and food search | barcode number or search text | Open Food Facts (`world.openfoodfacts.org`), images from `images.openfoodfacts.org` | Direct from the app (`src/lib/openFoodFacts.ts`) | Food lookup | Yes: the food lookup opt-in. Without it, no request is made | Open Food Facts' policy; the app keeps no log | **Now** |
| Exercise catalogue requests | page URL, search text | wger (`wger.de`), through the Vercel function `/api/proxy-wger` | Server side on web and native, for both the catalogue sync and live search (`apiUrl()`, Lane H Day 2). wger sees Vercel's IP, not the user's | Exercise library | No (public catalogue; no personal data is sent) | wger's policy | **Now** |
| Exercise images | image URL | wger (`wger.de`) | Loaded directly by the browser or WebView (`img-src` allows `wger.de`), so wger sees the user's IP and user agent | Exercise pictures | No | wger's policy | **Now** |
| Exercise search fallback | search text | API Ninjas (`api.api-ninjas.com`) through the Vercel function `/api/exercise-search-ninjas` | Server side; the user's IP stays with Vercel | Search when wger fails | No (no personal data) | API Ninjas' policy | **Now** |
| Daily quote | none | API Ninjas through `/api/motivation-quote` | Server side | Motivation | No | — | **Now** |
| Page views | page path, referrer, device type, country (from IP) | Vercel Web Analytics (same origin, `/_vercel/insights`) | `@vercel/analytics`, mounted only with consent (`src/App.tsx`) | Product analytics | Yes: analytics opt-in | Vercel's policy | **Now** |
| Crash reports | error message, stack trace, component stack, app version, browser and OS, page path without query string or hash. No name, email, account ID, cookies or workout, body or nutrition data; health-like `extra` keys and console breadcrumbs are dropped before sending | Sentry (`*.ingest.sentry.io`; region set by the DSN). Sentry sees the IP address when a report is sent; the project should be set not to store it (L6) | `@sentry/browser`, loaded only when a DSN is set at build time **and** the user opted in (`src/lib/monitoring.ts`, contract 8); route error boundaries report through `captureError()` | Fix crashes | Yes: the analytics opt-in for now; its own toggle from Lane C Day 5. Not yet stopped when consent is revoked mid-session (Day 5) | Sentry's default (about 90 days on most plans; Lincoln confirms at L6) | **Built, off until L6** (#69): no DSN is set, and the production build contains no Sentry code |
| Product analytics events | event name (for example `plan_generated`, `workout_completed`), simple properties; never weights, measurements, readiness or food | PostHog | `src/lib/analytics/track.ts` (contract 9) | Product decisions | Yes: analytics opt-in | PostHog plan default | **After Wave 2** (Lane C Day 4) |
| Workout reminders and rest timer alerts | reminder days and time, rest end time | Nobody: local notifications, on the device only | `useLocalNotifications` (contract 10) | Reminders | OS notification permission | Until cancelled | **After Wave 2** (Lane H Days 5–6) |
| Circles (social groups) | circle membership, activity posts, reactions, comments | Supabase (`circles`, `circle_members`, `circle_activities`, `activity_reactions`, `activity_comments`, `circle_challenges`) | Supabase client | Social feature | — | Until deleted | Code exists, but **off** (`VITE_FEATURE_CIRCLES` defaults to false). Not in v1 |
| Coach portal | trainer mode, client list | localStorage `fitwizard-trainer`; Supabase `profiles` (`is_trainer`) | Supabase | Coach feature | — | Cleared on sign-out | Code exists, but **off** (`VITE_FEATURE_COACH` defaults to false). Not in v1 |

Not active, recorded so nobody discloses them by mistake: `src/lib/analytics.ts` (wizard funnel events) only logs to the console in development and has no endpoint; the `analyticsStore` event queue has no upload (the `fetch` is commented out). `src/components/ErrorBoundary.tsx` now reports through `captureError()`, which sends nothing until Sentry is configured and consented (see Crash reports).

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
- Food lookups and exercise searches: **decided on Day 5** (Lincoln to confirm). Apple: not collected (only used to answer the request in real time; [`APPLE_PRIVACY.md`](APPLE_PRIVACY.md)). Google: declared as in-app search history, processed ephemerally ([`GOOGLE_DATA_SAFETY.md`](GOOGLE_DATA_SAFETY.md)).
- Nutrition, body measurements and readiness: **recommended on Day 5** to declare as Health as well as Fitness on both forms (Lincoln to confirm). If accepted, Lane H adds Health to the manifest.
- Day 5 also found the manifest is missing **User ID** (every synced row has the account ID) and **Other User Content** (free-text notes), and that **Product Interaction** is linked (exercise views go to `exercise_interactions` with the account ID). The changes for Lane H are listed in `APPLE_PRIVACY.md` → "Manifest changes".

## Third parties

| Name | Purpose | Data sent | Region | Privacy policy | Status |
|---|---|---|---|---|---|
| Supabase | Accounts, database, sign-in emails | Email, profile, synced training data, exercise preferences and interactions | Lincoln to provide (project region) | [supabase.com/privacy](https://supabase.com/privacy) | **Now** |
| Vercel | Hosting, serverless functions (`/api/*`), Web Analytics | Every request (IP, user agent); page views with consent | Vercel's global network; function region not set in `vercel.json` | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) | **Now** |
| Open Food Facts | Barcode and food search | Barcode or search text, IP | France (Open Food Facts is a French non-profit) | [world.openfoodfacts.org/privacy](https://world.openfoodfacts.org/privacy) | **Now**, with consent |
| wger | Exercise catalogue and images | Catalogue and search requests from Vercel's servers (Vercel's IP); image requests from the user's device (the user's IP) | Germany (wger.de), not verified | [wger.de](https://wger.de) (policy URL not verified) | **Now** |
| API Ninjas | Exercise search fallback, daily quotes | Search text, from Vercel's servers only | Unknown | [api-ninjas.com](https://api-ninjas.com) (policy URL not verified) | **Now** |
| Sentry (Functional Software, Inc.) | Crash reports | Errors only, opt-in; no PII and no health data (see the crash-reports row) | Region of the DSN; EU recommended; Lincoln picks at L6 | [sentry.io/privacy](https://sentry.io/privacy/) | **Built, off until L6** (#69) |
| PostHog | Product analytics | Event names and simple properties, no health values | Chosen when Lincoln creates the project (US or EU) | [posthog.com/privacy](https://posthog.com/privacy) | **After Wave 2**, opt-in |
| Apple / Google | App distribution; native local notifications are scheduled by the OS on the device | Nothing from the app beyond what the stores collect themselves | — | — | **After Wave 2** |

### Our own API functions (`/api/*`)

`api/_lib/guard.ts` (Lane H Day 2) protects every Vercel function:
- **Origin allowlist:** only `ALLOWED_ORIGINS`, the deployment's own Vercel URLs, `capacitor://localhost` and `https://localhost` may call them from a browser. Any other origin gets a 403. Requests with no `Origin` header (same-origin) pass.
- **Rate limit:** 60 requests a minute per IP address. To enforce it, each function instance keeps the caller's **IP address in memory**, with a request count for the current one-minute window. The count resets after a minute, but the entry is not removed then: it stays until that IP calls again (the entry is replaced), the table reaches 10,000 entries (expired entries are pruned, and if it's still full the table is cleared), or the function instance stops. So retention is **up to the life of the function instance**, not one minute. The guard never writes the IP to disk, logs it or sends it anywhere. Vercel's own platform request logs are separate and follow Vercel's policy. Over the limit, the reply is a 429.
- The functions store nothing else about the caller. Upstream services (wger, API Ninjas) see Vercel's IP, not the user's.

The policy links were written from known URLs. This environment couldn't reach them, so Lane A Day 4 should open each one before the privacy policy cites it.

## Keeping this current

- Add or change a row in the same PR that adds stored data, a third party or a `connect-src` host.
- Before Day 4 (privacy policy) and Day 5 (store forms), re-run the checks this was built from: `grep -rn "persist(\|createUserDataStorage" src/stores`, `grep -rnE "fetch\(|\.from\('" src api`, and the `connect-src` list in `vercel.json`.
