# Apple App Privacy answers (App Store Connect)

> **Draft, 2026-11-25 (Lane A, Day 5).** Answers for App Store Connect → your app → **App Privacy**, built from [`DATA_INVENTORY.md`](DATA_INVENTORY.md) and the code on `preview_b` at `aaa63b7`. Not legal advice; the reviewer (L9) checks it with the privacy policy.
>
> **Wording checked** against Apple's [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) page on 2026-11-25. Definitions quoted below are Apple's. The page shows no "last updated" date, so re-read it on the day you submit. The App Store Connect help page was only partly readable from here; the questionnaire steps below follow the developer page.
>
> **Answer for the build you submit.** Apple asks what the submitted app collects. Two rows depend on Lincoln's L6 keys (Sentry, PostHog): if the build has no key, that data isn't collected. Both cases are given.

## How to read this

- **Collected** (Apple): "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time." Data "processed only on device is not 'collected'".
- **Linked** (Apple): linked "to the user's identity (via their account, device, or other details)". Personal data under privacy laws counts as linked.
- **Tracking** (Apple): linking app data with third-party data for targeted advertising or ad measurement, or sharing it with a data broker. **FitWizard does neither** (no ad SDK, no data broker; `PrivacyInfo.xcprivacy` declares `NSPrivacyTracking` false). So every "used for tracking?" answer is **No**, and the app needs no App Tracking Transparency prompt.
- **Guests** (no account) send no training data off the device. Most rows below apply only to people who sign in, which is optional. Apple's form has no "only if signed in" option, so the answers describe a signed-in user.

## Step 1: "Do you or your third-party partners collect data from this app?"

**Yes.** Source: account email and synced training data go to Supabase when signed in (`src/stores/authStore.ts`, `src/lib/sync/`).

## Step 2: data types collected

| Apple data type | Collect? | Linked? | Tracking? | Purposes | Why, and where in the code |
|---|---|---|---|---|---|
| **Contact info → Email Address** | Yes | Yes | No | App Functionality | Sign-in with an email code (Supabase Auth). `verifyEmailCode` and the sign-in actions in `src/stores/authStore.ts`; inventory "Account email". |
| **Contact info → Name** | **No** (Lincoln to confirm) | — | — | — | The app never asks for a name. `profiles.display_name` is filled from the email's local part or auth metadata (`getDisplayNameForUser`, `src/stores/authStore.ts` ~36–38); the onboarding name isn't saved. With email-only sign-in there is no other source. If Lincoln prefers to be cautious, declare it as Linked / App Functionality. |
| **Identifiers → User ID** | **Yes** | Yes | No | App Functionality | Apple: "account ID, assigned user ID… that can be used to identify a particular user or account". Every synced row carries the Supabase account ID (`user_id`, migration 007; `src/lib/sync/`). **Not in `PrivacyInfo.xcprivacy` today**: Lane H adds `NSPrivacyCollectedDataTypeUserID` (linked, app functionality). |
| **Identifiers → Device ID** | No | — | — | — | No advertising ID or device ID is read. No ad SDK in `package.json`. |
| **Health & Fitness → Fitness** | Yes | Yes | No | App Functionality | Apple: "Fitness and exercise data". Plans, workout logs (sets, reps, weight, RIR), personal records, custom exercises, achievements, synced when signed in (`src/lib/sync/collections/training.ts`). Already in the manifest. |
| **Health & Fitness → Health** | **Yes (recommended; Lincoln to confirm)** | Yes | No | App Functionality | Apple: "Health and medical data, including… any other user provided health or medical data". Body measurements (body weight, body-fat %), the nutrition profile (age, sex, height, weight), meals and calories, and readiness check-ins (sleep quality, soreness, stress) are user-provided health data that sync when signed in. No HealthKit is used. **Not in the manifest today**: Lane H adds `NSPrivacyCollectedDataTypeHealth` if Lincoln agrees. Under-declaring is the riskier mistake here. |
| **User Content → Other User Content** | Yes (recommended) | Yes | No | App Functionality | Apple: "Any other user-generated content". Free-text notes on workouts and exercises, custom exercise names, custom foods and saved meals, synced when signed in. Could be argued as Fitness or Health; declaring it costs nothing and covers the free text. |
| **Search History** | **No** (Lincoln to confirm) | — | — | — | Food searches go to Open Food Facts and exercise searches to wger or API Ninjas (through `/api/*`) only to answer that search. FitWizard keeps no search log, and those services are APIs the app calls, not "third-party partners whose code you've added". This fits Apple's "service the transmitted request in real time". If Lincoln prefers caution: Not linked, App Functionality. |
| **Usage Data → Product Interaction** | **Yes** | **Yes** | No | App Functionality; Analytics (only if PostHog ships, below) | (1) Exercise views are written to Supabase `exercise_interactions` with the account ID for exercise stats and badges (`src/hooks/useExerciseInteraction.ts` ~127–135). (2) Favourites, collections and recently viewed exercises sync to `user_exercise_preferences`. Both are linked. (3) Opt-in analytics (PostHog, #75, not merged) would add the Analytics purpose. **The manifest says not linked**; Lane H changes it to linked (see "Manifest changes"). |
| **Diagnostics → Crash Data** | **Only if L6 sets a Sentry DSN for this build** | No | No | App Functionality | Opt-in crash reports (`src/lib/monitoring.ts`, contract 8). No name, email, account ID or health data; the page path drops its query string. No DSN today, so today's build sends nothing. |
| **Diagnostics → Performance Data, Other Diagnostic Data** | No | — | — | — | Sentry is set up for errors only; no performance tracing is turned on in `src/lib/monitoring.ts`. |
| **Location → Coarse / Precise** | No | — | — | — | The app reads no location. The profile's timezone (`Intl…timeZone`) isn't location under Apple's definition (coarser than a city). Note: Sentry and Vercel see the IP address, which they could map to a country; Sentry is set not to store it (L6). |
| **Contacts, Photos or Videos, Audio, Browsing History, Sensitive Info, Financial Info, Purchases, Messages, Gameplay, Customer Support, Other Data Types** | No | — | — | — | None of these exist in the code. Camera and photos aren't used (barcode numbers are typed). Motion data drives a tilt effect on the welcome screen and stays on the device (`NSMotionUsageDescription`). Circles (messages, posts) are off in v1 (`VITE_FEATURE_CIRCLES` false). |

### Product analytics (PostHog), depends on #75 and L6

- **If the submitted build has a PostHog key and the analytics opt-in:** add the **Analytics** purpose to Product Interaction. PostHog events carry no account ID (contract 9), but Product Interaction is already linked through `exercise_interactions`, so the type stays **linked**.
- **If not:** Product Interaction is App Functionality only.
- **Vercel Web Analytics** (page views) is mounted with consent in `src/App.tsx:440`, including in the native app. In the app, its script path resolves to the bundled app, where it doesn't exist, so it is expected to send nothing. **Unverified on a device.** Lincoln can check with Safari's Web Inspector on an iPhone (Network tab, filter `insights`). Lane C could make this explicit by mounting it only when `!nativeApp`.

## Step 3: privacy policy and contact

| Field | Answer | Source |
|---|---|---|
| Privacy Policy URL | `https://[domain: Lincoln to provide, L3]/legal?tab=privacy` | `src/pages/Legal.tsx`; route `/legal` in `src/App.tsx:317` |
| User Privacy Choices URL (optional) | The same page, `#delete-account` for deletion | `Legal.tsx` deletion section (Day 4) |

## Manifest changes this implies (for Lane H, `ios/App/App/PrivacyInfo.xcprivacy`)

The App Store form and the manifest must agree. Today's manifest declares Email, Fitness, Crash Data (not linked) and Product Interaction (not linked). If Lincoln accepts the answers above:

1. Add **User ID**: linked, App Functionality.
2. Add **Health**: linked, App Functionality (if Lincoln agrees).
3. Add **Other User Content**: linked, App Functionality.
4. Change **Product Interaction** to **linked**, purposes App Functionality and (with PostHog) Analytics.
5. Crash Data stays not linked. If crash reports are ever tied to the account ID, change it to linked.

## Questions for Lincoln

1. **Health:** declare body measurements, nutrition and readiness as Health as well as Fitness? Recommended: **yes**.
2. **Search History and Name:** recommended **not collected**, for the reasons above. Confirm, or declare them to be cautious.
3. **L6:** will the first submitted build include the Sentry DSN and the PostHog key? That decides the Crash Data row and the Analytics purpose.
4. **Domain (L3)** for the privacy policy URL.
