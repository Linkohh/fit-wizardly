# Google Play Data safety answers (Play Console)

> **Draft, 2026-11-25 (Lane A, Day 5).** Answers for Play Console → App content → **Data safety**, built from [`DATA_INVENTORY.md`](DATA_INVENTORY.md) and the code on `preview_b` at `aaa63b7`. Not legal advice; the reviewer (L9) checks it with the privacy policy.
>
> **⚠ Wording not verified.** Google's help pages (`support.google.com`) could not be reached from this environment on 2026-11-25, so the question wording, data-type names and exceptions below are from Google's form as last known, **not** checked against the live form. Lincoln: open the form in Play Console and match each answer to the question shown there. Anything that doesn't line up is marked for review in the PR.
>
> **Answer for the build you submit.** Two rows depend on Lincoln's L6 keys (Sentry, PostHog). Both cases are given.

## How to read this

- **Collected** (Google, as last known): data transmitted off the device. Data processed only on the device isn't collected.
- **Shared** (Google, as last known): data transferred to a third party. Transfers to a **service provider** that processes data on your behalf (Supabase, Vercel, Sentry, PostHog) are not "sharing". A transfer the user starts and expects (for example sharing a workout card through the share sheet) is also not sharing.
- **Guests** send no training data off the device. Training data is collected only when someone signs in, which is optional, so those types are **optional** in the answers below.

## Section 1: overview questions

| Question (as last known) | Answer | Source |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | Account email and synced training data (Supabase) when signed in |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | Every remote call is HTTPS: Supabase (`src/lib/supabase.ts`), `/api/*` on Vercel, Open Food Facts, wger. The Android manifest requests `INTERNET` and `POST_NOTIFICATIONS` (and removes the plugin's `SCHEDULE_EXACT_ALARM`), sets no `usesCleartextTraffic` and has no network security config; `capacitor.config.ts` uses `androidScheme: 'https'`. Live reload (`ios:live`, dev only) is iOS and not part of release builds |
| Which methods of account creation does your app support? | **Username and other authentication** (email with a one-time code). No password, no OAuth | `src/stores/authStore.ts` (email code, contract 7) |
| Do you provide a way for users to request that their data is deleted? | **Yes** | In app: Profile → Details → **Delete account** (type DELETE), `src/components/account/AccountDeletionSection.tsx`. Guests: **Erase data on this device** |
| Delete account URL (web) | `https://[domain: Lincoln to provide, L3]/legal?tab=privacy#delete-account` | Section `delete-account` in `src/pages/Legal.tsx` (Day 4). It covers in-app deletion, guest erasure and an email request for people who can't sign in. **Needs the support email** (placeholder in `POLICY_VALUES`) |
| Data deletion without deleting the account (optional) | **No (account deletion only). BLOCKED ON LINCOLN** (question 6). Deleting a plan, log or entry while signed in removes it from the app and the user's devices, but the sync engine only marks the cloud row deleted: it sets `deleted_at`, and the row's content stays in Supabase until the account is deleted (DEBT-097). Guests can erase the device, but a guest has no data on our servers | `src/lib/sync/engine.ts` (push sets `deleted_at`, ~168); DEBT-097 |
| Has your app completed an independent security review (MASA)? | **No** | Optional |
| Is your app designed for children / in the Families program? | **No** | Not directed at children; minimum age is a Lincoln decision (see `COMPLIANCE.md`) |

## Section 2: data types

For each type: collected, shared, processed ephemerally, required or optional, purposes. "Optional" means a user can use the app without giving it.

| Category → type | Collected | Shared | Ephemeral | Required? | Purposes | Why, and where in the code |
|---|---|---|---|---|---|---|
| **Personal info → Email address** | Yes | No | No | Optional (only for an account) | App functionality; Account management | Sign-in code to the user's email (Supabase Auth). `src/stores/authStore.ts` |
| **Personal info → Name** | **No** (Lincoln to confirm) | — | — | — | — | Never asked for. `profiles.display_name` is copied from the email's local part (`getDisplayNameForUser`, `authStore.ts` ~36–38). If Lincoln wants caution: Collected, optional, App functionality |
| **Personal info → User IDs** | Yes | No | No | Optional | App functionality; Account management | The Supabase account ID on every synced row (`user_id`, migration 007) |
| **Health and fitness → Fitness info** | Yes | No | No | Optional | App functionality | Plans, workout logs, personal records, custom exercises, achievements; synced when signed in (`src/lib/sync/collections/training.ts`) |
| **Health and fitness → Health info** | **Yes (recommended; Lincoln to confirm)** | No | No | Optional | App functionality | Body measurements (weight, body-fat %), nutrition profile (age, sex, height, weight), meals and calories, readiness (sleep, soreness, stress); synced when signed in. No Health Connect |
| **App activity → App interactions** | Yes | No | No | Optional | App functionality; Analytics (only with PostHog, below) | Exercise views to `exercise_interactions` with the account ID (`src/hooks/useExerciseInteraction.ts` ~127–135); recently viewed exercises in `user_exercise_preferences` |
| **App activity → Other actions** | Yes | No | No | Optional | App functionality | Favourite exercises and collections, synced to `user_exercise_preferences` (`src/lib/preferences/preferencesRepo.ts`) |
| **App activity → Other user-generated content** | Yes | No | No | Optional | App functionality | Workout and exercise notes, custom exercise names, custom foods, saved meals; synced when signed in |
| **App activity → In-app search history** | **Collected, processed ephemerally** (recommended; Lincoln to confirm) | No | **Yes** | Optional | App functionality | Food search text goes straight to Open Food Facts (with the food-lookup opt-in); exercise search text goes to wger or API Ninjas through `/api/*`. Nothing keeps it. Google (as last known) asks for ephemeral data to be declared and marked ephemeral, rather than left out |
| **App info and performance → Crash logs** | **Only if L6 sets a Sentry DSN** | No (Sentry is a service provider) | No | Optional (opt-in) | App functionality | `src/lib/monitoring.ts`: opt-in, no account ID, no health data |
| **App info and performance → Diagnostics** | **Only if L6 sets a Sentry DSN** | No | No | Optional | App functionality | Sentry reports include app version, browser and OS (inventory "Crash reports"). No performance tracing (`tracesSampleRate: 0`) |
| **Device or other IDs** | No | — | — | — | — | No advertising ID or device ID |
| **Location → Approximate / Precise** | No | — | — | — | — | No location API. Timezone only |
| **Workout reminders and rest alerts** (not a Google data type) | No | — | — | — | — | Local notifications scheduled by the OS on the device (#89). The reminder days and time stay in device storage (`fitwizard-reminders`) and are never sent. Nothing to declare. `POST_NOTIFICATIONS` is a normal runtime permission; no exact-alarm declaration is needed because `SCHEDULE_EXACT_ALARM` is removed from the manifest |
| **Financial info, Messages, Photos and videos, Audio, Files and docs, Calendar, Contacts, Web browsing, Installed apps** | No | — | — | — | — | Not in the code. Circles (messages) are off in v1. Shared workout cards are written to the cache only for the share sheet the user opens (Lane H Day 5) |

### Product analytics (PostHog), depends on #75 and L6

- **If the build has a PostHog key:** App interactions gains the **Analytics** purpose (opt-in, no account ID, no health values; contract 9). PostHog is a service provider, so it's not "sharing".
- **Vercel Web Analytics** is mounted with consent in `src/App.tsx:440`, but in the Android app its script path points at the bundled app, so it is expected to send nothing. **Unverified on a device** (check with Chrome remote debugging, Network tab, filter `insights`).

## Section 3: what the store listing will show (check after saving)

- "No data shared with third parties"
- "Data collected": Personal info, Health and fitness, App activity (plus App info and performance if Sentry ships)
- "Data is encrypted in transit"
- "You can request that data be deleted"

## Questions for Lincoln

1. **Verify every question** above against the live form (wording not checked; see the top note).
2. **Health info:** declare it? Recommended **yes**, to match the Apple answer.
3. **Search history:** declare as ephemeral (recommended) or leave out?
4. **L6:** Sentry DSN and PostHog key in the first Play build?
5. **Domain (L3) and support email** for the deletion URL. Play rejects the form without a working deletion page.
6. **DEBT-097, deleted items in the cloud:** keep tombstoned content until account deletion (this answer stays **No**), or have the coordinator (Lane E) purge the content when an item is deleted (clear it and keep only the id and `deleted_at`), which would make this answer **Yes**. No default; until you decide, the answer is **No**.
