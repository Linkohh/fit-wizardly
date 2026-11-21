# FitWizard privacy policy and terms of service

> **Draft for review (Lincoln's task L9).** This is not legal advice and has not been reviewed by a qualified professional. Text in square brackets is still to be filled in. The Spanish copy in the app is a draft too.

- **Last updated:** 2026-11-21 (draft)
- **Effective date:** [set at launch]
- **In the app:** [`src/pages/Legal.tsx`](../src/pages/Legal.tsx) (Privacy Policy and Terms of Service tabs). This file is the same English text; change both together, and the `legal.*` keys in `src/locales/en.json` and `es.json`.
- **Account-deletion page for Google Play:** `/legal?tab=privacy#delete-account` on the production web origin.
- **Source:** [`docs/store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md), current through #69. When the inventory changes, update this policy in the same PR (ADR 10).

## Values still to fill in

Each one is a single constant, `POLICY_VALUES` in `src/pages/Legal.tsx`.

| Value | Current placeholder | Who |
|---|---|---|
| Supabase project region | [Supabase region: Lincoln to provide] | Lincoln |
| Public support email (not a personal address) | [support email: Lincoln to provide] | Lincoln |
| Governing law | [governing law: Lincoln to provide] | Lincoln |
| Minimum age | 13 [Lincoln to confirm] | Lincoln; 16 may be needed for some EU countries |
| Database backup period | [backup period: Lincoln to confirm] | Lincoln, from the Supabase plan |
| Effective date | [set at launch] | Lincoln |

---

# Privacy policy

## In short

FitWizard works without an account. If you don't sign in, your training data is kept on your device and is not sent to us.

If you sign in, your training data is also saved to our cloud database so you can use it on other devices.

Some optional features send limited data to other services, and only after you turn them on. Each one is listed below. We do not sell your data, show ads, or track you across other apps and websites.

## What we collect

Depending on the features you use, FitWizard stores:

- Training data: workout plans, workout logs (sets, reps, weight and effort), a workout in progress, personal records, your current week and your preferred weight unit.
- Nutrition data: the meals and foods you log, with calories and macros, and your nutrition profile (age, sex, height, weight, activity level, goal and water goal), targets, custom foods, favourite foods and saved meals.
- Body and recovery data: body measurements (such as body weight, body-fat percentage and tape measurements) and daily readiness check-ins (ratings for sleep quality, muscle soreness, energy and stress).
- Progress and library data: achievements, badges and streaks, custom exercises you create, favourite exercises, collections, filter presets, recently viewed exercises and library settings. When you are signed in, we also record which exercises you view.
- Setup answers: your answers in the plan wizard (goal, experience, equipment, muscles, schedule, and limits such as avoiding overhead work) and in onboarding (avatar, role and interests).
- Account data, if you sign in: your email address and a profile with a display name (taken from your email address) and your timezone. To sign in, we email you a link and a 6-digit code. The code is used once and is not stored by the app.
- Settings and choices: your privacy choices, language, theme and similar settings, and the bookkeeping sync needs (which items changed and when, never their content).
- Technical data: like any website, our hosting provider receives your IP address and browser or device details with every request.

FitWizard does not access your location, contacts, camera, photos, or health records from other apps.

## Where your data is stored

- On your device: in the app's own storage (IndexedDB in a browser, app storage files on iPhone and Android) and, for small settings, in browser storage. FitWizard adds no encryption of its own; your device's protections, such as a screen lock, apply.
- In our cloud database, if you sign in: we use Supabase, and your data is stored in [Supabase region: Lincoln to provide]. Each account can read and change only its own records.
- What syncs: your plans, workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises and favourite exercises. The app syncs when you sign in, when your device comes back online, when you return to the app, and shortly after each change. Nothing is sent while you are offline or signed out; changes made while signed out are sent the next time you sign in.
- The first time you sign in on a device, the app keeps your account's copy of any record that exists in both places, and uploads only the records that exist only on that device.
- Signing out does not yet remove your training data from the device. After signing out, you can remove it with Erase data on this device (see Delete your account below).
- Some of the services listed below are in other countries, so your data may be processed outside the country where you live.

## Who receives your data

We share data only with the services that run FitWizard's features:

- Supabase runs accounts, sign-in emails and the cloud database. It receives your email address, profile and synced data when you sign in. [Privacy policy](https://supabase.com/privacy)
- Vercel hosts the app and our server functions. It receives your IP address and device details with every request. If you allow analytics, Vercel Web Analytics also records page views (the page, the referring page, device type and country). [Privacy policy](https://vercel.com/legal/privacy-policy)
- Open Food Facts provides food search, only if you turn on food lookup. It receives the barcode or search text and your IP address. Without food lookup, nothing is sent. [Privacy policy](https://world.openfoodfacts.org/privacy)
- wger provides the exercise catalogue. Catalogue and search requests go through our servers, so wger sees our server's address, not yours. Exercise pictures load directly from wger, so wger sees your IP address. [Privacy policy](https://wger.de)
- API Ninjas provides a backup exercise search and the daily quote. Requests go through our servers, and it receives only the search text. [Privacy policy](https://api-ninjas.com)
- Sentry receives crash reports, only if you allow them. A report contains the error, the app version, your browser or device type and the page, but not your name, email address, account or training data. Sentry sees your IP address when a report is sent. Crash reporting is not switched on yet. [Privacy policy](https://sentry.io/privacy/)
- PostHog (planned) will receive product events if you allow analytics, such as 'plan generated' or 'workout completed', never weights, measurements, readiness or food. It is not in use yet; we will update this policy before it is. [Privacy policy](https://posthog.com/privacy)

Apple and Google distribute the app and collect their own data under their own policies. Workout reminders and rest-timer alerts (coming soon) are scheduled on your device and are not sent to anyone.

Social circles and the coach portal are switched off and collect nothing. We will update this policy before turning either on.

We do not sell or rent your data, and we do not share it for advertising.

## Why we use it

- To provide the app: build plans, log workouts and meals, and show your history and progress.
- To keep your data in your account and on your other devices, if you sign in.
- To sign you in and keep your account secure.
- To look up foods and exercises when you ask.
- To find and fix crashes, if you allow crash reports.
- To understand which parts of the app are used, if you allow analytics.
- To protect our server functions from abuse (see How long we keep it).

## How long we keep it

- On your device: until you delete it in the app, use Erase data on this device, clear the app's or the browser's data, or uninstall the app.
- In your account: until you delete it, or delete your account. Deleted plans are removed straight away. Other synced items are marked as deleted so that your other devices remove them too; the marked record is removed for good when you delete your account.
- Your email address, your profile and the record of which exercises you viewed are kept until you delete your account.
- Sign-in codes work once and expire after a short time.
- To limit each address to 60 requests a minute, our server functions keep your IP address in memory with a request count. They never write it to disk, log it or share it, but it can stay in memory until that server instance shuts down. Vercel's own request logs follow Vercel's policy.
- Sentry keeps crash reports for about 90 days. Vercel Web Analytics, Open Food Facts, wger and API Ninjas keep what they receive under their own policies.

## Your choices

- Privacy settings: choose whether to allow analytics (which also covers crash reports for now) and food lookup. Change them at any time in Profile → Details → Privacy Settings. If you say no, those services receive nothing from you.
- Export: Profile → Details → Export Data (JSON) saves a file with what the app keeps about you: plans (including a workout in progress), workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, your wizard and onboarding answers, your privacy choices and settings, and, if you are signed in, your account email and profile.
- Delete items: you can delete plans, meals, custom foods, saved meals and body measurements in the app.
- No account: use FitWizard without signing in, and your training data stays on your device.
- Depending on where you live, you may have the right to access, correct, delete or move your data, or to object to how we use it. Contact us to use these rights.

<a id="delete-account"></a>

## Delete your account

You can delete your account and your data at any time.

- In the app: open Profile, go to Details, tap Delete account, type DELETE and confirm. This permanently deletes your account and everything stored with it on our servers: your email address and profile, plans, workout history, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, and the record of which exercises you viewed. The FitWizard data on that device is erased at the same time. Deletion happens straight away and can't be undone, so download a copy first with Profile → Details → Export Data (JSON).
- Not signed in? Your data is only on your device. Remove it with Profile → Details → Erase data on this device (type DELETE to confirm), or by uninstalling the app or clearing the site's data in your browser.
- Can't sign in, or don't have the app? Email [support email: Lincoln to provide] from the address on your account, with the subject 'Delete my account'. We will confirm that the address is yours and delete the account within 30 days.
- If you created a circle or challenge, it stays for its other members, with you removed as its creator.
- Other devices where you were signed in keep their copy on the device until you sign out and erase it there, or uninstall the app.
- What may remain: copies in our database provider's routine backups until they expire ([backup period: Lincoln to confirm]), and data already sent to the services listed above, which they keep under their own policies.

## Security

Data travels over encrypted connections (HTTPS). In our cloud database, access rules let each account read and change only its own records, and the key that can delete accounts is kept only on our server. No storage is perfectly secure, so please keep your device and your email account secure too.

## Children

FitWizard is not directed at children under 13 [Lincoln to confirm], and we do not knowingly collect their data. If you believe a child has given us data, contact us and we will delete it.

## Contact

Questions or requests about your privacy: [support email: Lincoln to provide].

## Changes to this policy

We will update this page when what the app collects or shares changes, and change the date at the top. For significant changes, we will tell you in the app before they take effect.

---

# Terms of service

### Agreeing to these terms

By using FitWizard, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the app.

### Not medical advice

FitWizard gives general fitness information only. It is not medical advice, diagnosis or treatment, and it does not replace a doctor, physiotherapist or other qualified professional. Read the Medical Disclaimer before you start training.

### Your responsibility

- Check with a healthcare professional before starting a new program, especially if you have a health condition or an injury.
- Train within your limits, use good form and suitable equipment, and stop if you feel pain, dizziness or shortness of breath.
- Enter accurate information, such as your weight or injuries, because plans and targets depend on it.
- Keep your device and the email account you sign in with secure.

### Accounts

An account is optional. To sign in, you need access to your email address. You can delete your account at any time (see Delete your account in the Privacy Policy).

### Acceptable use

Please do not:

- use FitWizard for anything unlawful;
- try to get into other people's accounts or data, or get around the app's security or rate limits;
- overload, scrape or attack the app or its server functions;
- copy, resell or redistribute the app, except where its licences allow.

### Licence and content

You may use FitWizard for your own personal, non-commercial purposes. Exercise data comes from wger and food data from Open Food Facts. Their communities provide it under their own licences, and we cannot guarantee that it is complete or accurate.

### No warranty

FitWizard is provided 'as is' and 'as available', without warranties of any kind, to the extent the law allows. We do not promise that it will be free of errors or always available, or that saved data will never be lost, so export your data if it matters to you.

### Limitation of liability

To the extent the law allows, the creators of FitWizard are not liable for any injury, loss or damage that results from using the app or following its plans. Nothing in these terms limits rights that the law does not allow to be limited.

### Changes and ending

We may update these terms. We will change the date at the top and tell you in the app about significant changes. You can stop using FitWizard at any time, and we may suspend access for misuse.

### Governing law

These terms are governed by the laws of [governing law: Lincoln to provide].

### Contact

Questions about these terms: [support email: Lincoln to provide].

---

## Notes for the reviewer

These are the facts in the code that the text above relies on, so the reviewer can check them.

| Claim | Where it comes from |
|---|---|
| Guests send no training data to us | Sync runs only for a signed-in user with Supabase configured (`src/lib/sync/triggers.ts`); `DATA_INVENTORY.md` "Signed in" |
| What syncs, and when | Contract 5 in [`docs/project/CONTRACTS.md`](project/CONTRACTS.md); plans through `src/lib/plans/`, favourites through `user_exercise_preferences` |
| Deleted synced items are marked, not removed, until account deletion | The sync engine sets `deleted_at` and never hard-deletes (`src/lib/sync/engine.ts`); plans are hard-deleted (`src/lib/plans/supabasePlansRepo.ts`) |
| Account deletion removes every linked row | `supabase/functions/delete-account/` and the cascade checked by `supabase/tests/delete_account.test.sql` (contract 4) |
| In-app Delete account and Erase data on this device | Profile → Details (`src/components/account/AccountDeletionSection.tsx`, Lane F Day 4, #73); wording from the Lane F Day 4 handoff. Not yet run against the deployed function (Gate 1, after L10) |
| Email deletion within 30 days | Default chosen here; Lincoln to confirm the process and time |
| IP kept in memory for the rate limit | `api/_lib/guard.ts`; see "Our own API functions" in `DATA_INVENTORY.md` |
| Crash reports: opt-in, not switched on | `src/lib/monitoring.ts` (contract 8); no DSN set until L6 |
| PostHog and local notifications | Planned (Lane C Day 4, Lane H Days 5–6); the text says so |
| Export contents | `buildUserDataExport` in `src/lib/dataExport.ts`, export version 3 (#73) |
| No camera, location or contacts access | No camera, location or contacts API is used in `src/`, and the native projects declare no such permissions |
| Other devices keep their copy after deletion | Lane F Day 4 handoff (new issue); Lane E Day 7 sign-out work |

The third-party privacy links were written from known URLs. This environment couldn't reach those sites, so they are not verified yet.
