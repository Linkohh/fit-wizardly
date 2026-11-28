# FitWizard privacy policy and terms of service

> **Draft for review (Lincoln's task L9).** This is not legal advice and has not been reviewed by a qualified professional. Text in square brackets is still to be filled in. The Spanish copy in the app is a draft too.

- **Last updated:** 2026-11-28 (draft; Lane A Day 8)
- **Effective date:** [Lincoln confirms: effective date, set at launch]
- **In the app:** [`src/pages/Legal.tsx`](../src/pages/Legal.tsx) (Privacy Policy and Terms of Service tabs). This file is the same English text; change both together, and the `legal.*` keys in `src/locales/en.json` and `es.json`.
- **Account-deletion page for Google Play:** `/legal?tab=privacy#delete-account` on the production web origin.
- **Source:** [`docs/store/DATA_INVENTORY.md`](store/DATA_INVENTORY.md), current through #100 (crash-report and analytics consent split, #98; PostHog, #75; deleted-item wipe, #96 and #97; local notifications, #89).
- **GDPR pre-review:** [`docs/store/GDPR_PRE_REVIEW.md`](store/GDPR_PRE_REVIEW.md). The clean copy for the reviewer is [`docs/store/PRIVACY_FOR_REVIEW.md`](store/PRIVACY_FOR_REVIEW.md).

## Values still to fill in

Each one is a single constant, `POLICY_VALUES` in `src/pages/Legal.tsx`. When one is confirmed, replace its text there (and here); a note that only says something is now true, such as `wipe`, becomes an empty string.

| Key | Current placeholder | Who |
|---|---|---|
| `controller` | [Lincoln confirms: name and postal address of the person or company responsible] | Lincoln (Art. 13(1)(a)) |
| `region` | [Lincoln confirms: Supabase project region] | Lincoln, from the Supabase dashboard |
| `email` | [Lincoln confirms: public support email] | Lincoln (not a personal address) |
| `jurisdiction` | [Lincoln confirms: governing law] | Lincoln, with the lawyer |
| `age` | 13 [Lincoln confirms: minimum age; 16 recommended for the EU] | Lincoln (see the pre-review, Art. 8) |
| `backup` | [Lincoln confirms: Supabase backup period] | Lincoln, from the Supabase plan |
| `transfers` | [Lincoln confirms: each DPA accepted, and the transfer mechanism per provider] | Lincoln (pre-review, Art. 28 and Arts. 44–49) |
| `basis` | [lawyer confirms] | The reviewer (each legal basis is a proposal) |
| `syncConsent` | [Lincoln confirms: the explicit-consent step at first sign-in is built before launch] | Lincoln; not built yet (pre-review, Art. 9) |
| `wipe` | [Lincoln confirms: live once migration 009 is applied to production] | Lincoln, at L2 step 5 |
| `sentryRegion`, `sentryRetention`, `sentryIp` | EU (Frankfurt) or US; 90 days; the IP setting | Lincoln at L6 |
| `posthogIp`, `posthogRetention` | "Discard client IP data"; the plan default | Lincoln at L6 |
| `vercelRegion`, `vercelRetention` | region from the dashboard; the plan default | Lincoln |
| `effective` | [Lincoln confirms: effective date, set at launch] | Lincoln |

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
- Your sign-in: when you sign in, a sign-in token from our authentication provider (Supabase) is saved on your device so you stay signed in after you close the app or browser. In a browser it's kept in this site's local storage; in the iPhone and Android apps it's kept in the app's private preferences. It identifies your session only and holds no workout or health data. Signing out deletes it from your device.
- In our cloud database, if you sign in: we use Supabase, and your data is stored in [Lincoln confirms: Supabase project region]. Each account can read and change only its own records.
- What syncs: your plans, workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises and favourite exercises. The app syncs when you sign in, when your device comes back online, when you return to the app, and shortly after each change. Nothing is sent while you are offline or signed out; changes made while signed out are sent the next time you sign in.
- The first time you sign in on a device, the app keeps your account's copy of any record that exists in both places, and uploads only the records that exist only on that device.
- Signing out: the app syncs one last time, warns you if any changes haven't been backed up yet, and then erases your training data from the device. Your account keeps the synced copy.
- Some of the services listed below are in other countries, so your data may be processed outside the country where you live. Supabase, Vercel, Sentry and PostHog are companies based in the United States. Where your data leaves the European Economic Area or the UK, it is protected by the European Commission's Standard Contractual Clauses or the EU-US Data Privacy Framework, as set out in each provider's data processing agreement. [Lincoln confirms: each DPA accepted, and the transfer mechanism per provider]

## Who receives your data

We share data only with the services that run FitWizard's features:

- Supabase runs accounts, sign-in emails and the cloud database. It receives your email address, profile and synced data when you sign in. [Privacy policy](https://supabase.com/privacy)
- Vercel (Vercel Inc.) hosts the app and our server functions. It receives your IP address and device details with every request. Usage statistics on the website (Vercel Web Analytics), only if you turn on "Share anonymous usage statistics": to count page visits and see which pages are used, it receives the page address and the page you came from, your browser, operating system and device type, and the country worked out from your IP address. It sets no cookies, and visits aren't linked to your IP address; to count unique visits it uses a hash of the request that resets every day. It isn't used in the iPhone and Android apps. Where: [Lincoln confirms: Vercel's infrastructure, region from the dashboard]. How long: [Lincoln confirms: the plan default]. It is off unless you turn it on, and turning the switch off in Profile → Details → Privacy Settings stops it straight away, with no reload. [Privacy policy](https://vercel.com/legal/privacy-policy)
- Open Food Facts provides food search, only if you turn on food lookup. It receives the barcode or search text and your IP address. Without food lookup, nothing is sent. [Privacy policy](https://world.openfoodfacts.org/privacy)
- wger provides the exercise catalogue. Catalogue and search requests go through our servers, so wger sees our server's address, not yours. Exercise pictures load directly from wger, so wger sees your IP address. [Privacy policy](https://wger.de)
- API Ninjas provides a backup exercise search and the daily quote. Requests go through our servers, and it receives only the search text. [Privacy policy](https://api-ninjas.com)
- Crash reports (Sentry, from Functional Software, Inc.), only if you turn on "Send crash reports": to find and fix errors that break the app. Only when the app hits an error, Sentry receives the error message and stack trace, the part of the screen where it happened, the app version, your browser and operating system, and the page path without query strings. Crash reports never include your name, email address, account ID, cookies, or any workout, body, readiness or nutrition data. Sentry sees your IP address when a report arrives, but our project is set not to store it [Lincoln confirms: the Sentry setting at L6]. Where: Sentry's [Lincoln confirms: EU (Frankfurt) or US] data region. How long: [Lincoln confirms: 90 days, the plan default]. It is off unless you turn it on, and turning it off in Profile → Details → Privacy Settings stops reporting straight away, with no reload. [Privacy policy](https://sentry.io/privacy/)
- Usage statistics (PostHog, from PostHog Inc.), only if you turn on "Share anonymous usage statistics": to learn which features people use, so we know what to improve. PostHog receives events without your name or email: which screens you open, and when you finish steps such as creating a plan, starting or finishing a workout, logging a meal or signing in. Events can include a few general details: your goal type, days per week, number of exercises, workout length in minutes, and whether you use the web, iPhone or Android app. They never include your name, email address, account ID, weights, reps, body measurements, readiness answers or what you eat. Page addresses are sent without query strings, and IDs and invite codes in them are removed. PostHog keeps a random identifier in the app's local storage to group events from one device; it is deleted when you turn usage statistics off. Session recording, automatic click tracking and surveys are off. PostHog sees your IP address when an event arrives, but our project is set not to store it [Lincoln confirms: "Discard client IP data" at L6]. Where: PostHog EU Cloud (Frankfurt, Germany). How long: [Lincoln confirms: the plan default]. This is the same switch as Vercel Web Analytics; it is off unless you turn it on, and turning it off in Profile → Details → Privacy Settings stops sending straight away, with no reload. [Privacy policy](https://posthog.com/privacy)

Apple and Google distribute the app and collect their own data under their own policies. Workout reminders and rest-timer alerts in the iPhone and Android apps are local notifications: the app schedules them on your device, only after you allow notifications, and nothing about them leaves your device. Your reminder settings stay on the device and are not synced.

Social circles and the coach portal are switched off and collect nothing. We will update this policy before turning either on.

We do not sell or rent your data, and we do not share it for advertising.

## Why we use it

- To provide the app: build plans, log workouts and meals, and show your history and progress. Without an account this happens only on your device. Legal basis: providing the service you asked for [lawyer confirms].
- To keep your data in your account and on your other devices, if you sign in. Because this includes health-related data (such as body measurements, readiness check-ins and nutrition), the legal basis is your explicit consent, which you can withdraw at any time [lawyer confirms] [Lincoln confirms: the explicit-consent step at first sign-in is built before launch].
- To sign you in and keep your account secure. Legal basis: providing the service you asked for [lawyer confirms].
- To look up foods and exercises when you ask. Food lookup is used only with your consent; exercise search sends no personal data [lawyer confirms].
- To find and fix crashes, if you turn on crash reports. Legal basis: your consent [lawyer confirms].
- To understand which parts of the app are used, if you turn on usage statistics. Legal basis: your consent [lawyer confirms].
- To protect our server functions from abuse (see How long we keep it). Legal basis: our legitimate interest in keeping the service available and secure [lawyer confirms].

## How long we keep it

- On your device: until you delete it in the app, use Erase data on this device, clear the app's or the browser's data, or uninstall the app.
- In your account: until you delete it, or delete your account. When you delete a synced item, including a plan, its content is wiped from our servers straight away. Only a deletion marker stays (the item's ID, or for a daily log its date, and the time it was deleted), so that your other devices remove the item too; the marker is removed when you delete your account [Lincoln confirms: live once migration 009 is applied to production]. Your device keeps only your latest 20 plans, but older plans stay in your account.
- Your email address, your profile and the record of which exercises you viewed are kept until you delete your account.
- Sign-in codes work once and expire after a short time.
- The sign-in token on your device: until you sign out, delete your account, or clear the app's or the browser's data.
- To limit each address to 60 requests a minute, our server functions keep your IP address in memory with a request count. They never write it to disk, log it or share it, but it can stay in memory until that server instance shuts down. Vercel's own request logs follow Vercel's policy.
- Sentry keeps crash reports for [Lincoln confirms: 90 days, the plan default]. PostHog keeps usage events for [Lincoln confirms: the plan default], and Vercel Web Analytics keeps page-view statistics for [Lincoln confirms: the plan default]. Open Food Facts, wger and API Ninjas keep what they receive under their own policies.

## Your choices

- Privacy settings: choose separately whether to send crash reports, share anonymous usage statistics, and allow food lookup. All three are off unless you turn them on. Change them at any time in Profile → Details → Privacy Settings. Turning one off takes effect straight away. If you say no, that service receives nothing from you.
- Export: Profile → Details → Export Data (JSON) saves a file, in a common machine-readable format, with what the app keeps about you: plans (including a workout in progress), workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, your wizard and onboarding answers, the date you agreed to these terms and your usage-statistics and food-lookup choices, and, if you are signed in, your account email and profile.
- Delete items: you can delete plans, meals, custom foods, saved meals and body measurements in the app. If you are signed in, the item's content is wiped from our servers straight away, and only a deletion marker stays so your other devices remove it too [Lincoln confirms: live once migration 009 is applied to production].
- No account: use FitWizard without signing in, and your training data stays on your device. To remove it, use Profile → Details → Erase data on this device.
- Your rights: depending on where you live (for example in the EU, the UK or some US states), you can ask to see your data, correct it, delete it or get a copy of it, ask us to limit or stop using it, and withdraw any consent at any time (this doesn't affect what was done before). You can do much of this yourself in the app: export, edit, delete items, or delete your account. For anything else, email [Lincoln confirms: public support email]; we reply within one month. You can also complain to your local data protection authority.

<a id="delete-account"></a>

## Delete your account

You can delete your account and your data at any time.

- In the app: open Profile, go to Details, tap Delete account, type DELETE and confirm. This permanently deletes your account and everything stored with it on our servers: your email address and profile, plans, workout history, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, exercise favourites and collections, and the record of which exercises you viewed. The FitWizard data on that device is erased at the same time. Deletion happens straight away and can't be undone, so download a copy first with Profile → Details → Export Data (JSON).
- Not signed in? Your data is only on your device. Remove it with Profile → Details → Erase data on this device (type DELETE to confirm), or by uninstalling the app or clearing the site's data in your browser.
- Can't sign in, or don't have the app? Email [Lincoln confirms: public support email] from the address on your account, with the subject 'Delete my account'. We will confirm that the address is yours and delete the account within 30 days.
- If you created a circle or challenge, it stays for its other members, with you removed as its creator.
- Other devices where you were signed in keep their copy on the device until you sign out there, or uninstall the app.
- What may remain: copies in our database provider's routine backups until they expire ([Lincoln confirms: Supabase backup period]), and data already sent to the services listed above, which they keep under their own policies.

## Security

Data travels over encrypted connections (HTTPS). In our cloud database, access rules let each account read and change only its own records, and the key that can delete accounts is kept only on our server. No storage is perfectly secure, so please keep your device and your email account secure too.

## Children

FitWizard is not directed at children under 13 [Lincoln confirms: minimum age; 16 recommended for the EU], and we do not knowingly collect their data. If you believe a child has given us data, contact us and we will delete it.

## Contact

FitWizard is run by [Lincoln confirms: name and postal address of the person or company responsible], who is responsible for your data (the data controller). Questions or requests about your privacy: [Lincoln confirms: public support email].

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

These terms are governed by the laws of [Lincoln confirms: governing law].

### Contact

Questions about these terms: [Lincoln confirms: public support email].

---

## Notes for the reviewer

These are the facts in the code that the text above relies on, so the reviewer can check them.

| Claim | Where it comes from |
|---|---|
| Guests send no training data to us | Sync runs only for a signed-in user with Supabase configured (`src/lib/sync/triggers.ts`); `DATA_INVENTORY.md` "Signed in" |
| What syncs, and when | Contract 5 in [`docs/project/CONTRACTS.md`](project/CONTRACTS.md); plans through the same engine (`plansCollection` in `src/lib/sync/collections/training.ts`, #81), favourites through `user_exercise_preferences` |
| Deleting a synced item wipes its content on the server; only the key, `user_id`, `deleted_at` and `updated_at` remain, and other devices remove the item | Migration `supabase/migrations/009_purge_tombstone_content.sql` (#97; trigger on `plans` and the seven 007 tables; `plans.created_at` also kept) and `keyOfTombstone()` in `src/lib/sync/engine.ts` (#96). The client change must ship before 009 reaches production (`docs/SUPABASE_MIGRATIONS.md`, L2 step 5); until then the `wipe` placeholder stays. Plans use the engine since #81; the 20-plan device cap never deletes from the account (`trackDeletions: false`) |
| Sign-out syncs, warns about unsent changes, then erases the device | `prepareSignOut()` and `completeSignOut()` in `src/lib/sync/signOut.ts` (#81) |
| Account deletion removes every linked row | `supabase/functions/delete-account/` and the cascade checked by `supabase/tests/delete_account.test.sql` (contract 4) |
| In-app Delete account and Erase data on this device | Profile → Details (`src/components/account/AccountDeletionSection.tsx`, Lane F Day 4, #73); wording from the Lane F Day 4 handoff. Not yet run against the deployed function (Gate 1, after L10) |
| Email deletion within 30 days | Default chosen here; Lincoln to confirm the process and time |
| IP kept in memory for the rate limit | `api/_lib/guard.ts`; see "Our own API functions" in `DATA_INVENTORY.md` |
| Crash reports and usage statistics are separate opt-ins, both off by default, revoked without a reload | `src/components/legal/ConsentModal.tsx`, `src/lib/consent.ts` (`fitwizard_crash_reports_consent`, `fitwizard_analytics_consent`), `Sentry.close()` in `src/lib/monitoring.ts`, `opt_out_capturing()` in `src/lib/analytics/track.ts`, Vercel Analytics unmount in `src/App.tsx` (#98). Nothing is sent until L6 sets the DSN and key |
| PostHog EU, no person profiles, allow-listed properties, URLs reduced to route patterns | `buildPostHogConfig` and `scrubUrl` in `src/lib/analytics/track.ts` (#75): `api_host` `eu.i.posthog.com`, `person_profiles: 'never'`, `opt_out_persistence_by_default: true` |
| Vercel Web Analytics: no cookies, daily-resetting hash, web only | Vercel's Web Analytics privacy page (checked by search 2026-11-28; it does not say outright that the raw IP is dropped, hence "not linked to your IP"); `!nativeApp` in `src/App.tsx` (DEBT-127, #75). Full URLs are still sent until DEBT-149 is fixed (Lane C Day 6) |
| Local notifications stay on the device | `src/hooks/useLocalNotifications.ts` (contract 10, #89); `fitwizard-reminders` and `fitwizard-notif-asked` are device-only and not synced |
| Export contents | `buildUserDataExport` in `src/lib/dataExport.ts`, export version 3 (#73). The `consent` block has the consent date, analytics and food lookup, **not** the crash-report flag yet (Lane C Day 5 asked Lane F to add it; DEBT-150), so the text names only those |
| No camera, location or contacts access | No camera, location or contacts API is used in `src/`, and the native projects declare no such permissions |
| Other devices keep their copy after deletion | Lane F Day 4 handoff (new issue); Lane E Day 7 sign-out work |
| Sign-in token kept on the device until sign-out | `src/lib/authSessionStorage.ts` (Lane H Day 4, #74; ADR 12): localStorage on the web, `@capacitor/preferences` in the apps |

The third-party privacy links were written from known URLs and are not verified yet. Vendor transfer facts (DPAs, SCCs, DPF, regions) are checked in the GDPR pre-review, with sources.
