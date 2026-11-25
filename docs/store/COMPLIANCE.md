# Store compliance answers

> **Draft, 2026-11-25 (Lane A, Day 5).** Age rating, Google's health-app declaration, the medical disclaimer, account deletion and encryption export compliance, from the code on `preview_b` at `aaa63b7`. Not legal advice.
>
> **⚠ Wording not verified.** Neither Apple's age-rating questionnaire nor Google's help pages could be read from this environment on 2026-11-25 (`support.google.com` is unreachable here; Apple's age-rating help wasn't fetched). Question names below are from each form as last known. Lincoln matches them to the live forms when filling them in. The privacy forms are in [`APPLE_PRIVACY.md`](APPLE_PRIVACY.md) (wording verified) and [`GOOGLE_DATA_SAFETY.md`](GOOGLE_DATA_SAFETY.md) (not verified).

## 1. Age rating

FitWizard v1 has no violence, sexual content, profanity, drugs, alcohol, tobacco, gambling, horror, contests, ads, purchases, web browser or chat. Circles (the only social feature, with posts and comments) is **off** in v1 (`VITE_FEATURE_CIRCLES` defaults to false, `src/lib/featureFlags.ts`), and so is the coach portal.

### Apple (App Store Connect → App Information → Age Rating)

| Topic (as last known) | Answer | Source |
|---|---|---|
| Violence (cartoon, realistic, prolonged), sexual content or nudity, profanity or crude humour, horror or fear themes | None | Content is exercise plans, logs and nutrition |
| Alcohol, tobacco or drug use or references | None | The food database (Open Food Facts) can return drinks such as beer if searched; this is user-requested nutrition data, not promoted content. Lincoln to confirm "None" |
| Simulated gambling, contests | None | |
| **Medical or treatment information** | **Infrequent/mild, or None: Lincoln to confirm.** The app shows general training information and a medical disclaimer; it gives no diagnosis or treatment | Disclaimer tab in `src/pages/Legal.tsx`; terms "Not medical advice" |
| **Health or wellness topics** (if the form asks) | **Yes** | Fitness, nutrition targets, body measurements and readiness check-ins |
| Unrestricted web access | No | No in-app browser; the app links only to its own pages and to third-party privacy policies |
| User-generated content shared with others / messaging or chat | No | Circles off in v1 |
| Advertising | No | No ad SDK in `package.json` |
| In-app controls (parental controls, age assurance) | None | |

**Expected rating:** 4+ (Apple computes it from the answers). If the form treats "Medical or treatment information" as frequent, the rating rises; answer it honestly as the disclaimer describes.

### Google (Play Console → App content → Content rating, IARC questionnaire)

| Topic (as last known) | Answer |
|---|---|
| Category | **All other app types** (not a game, not social, not a news or reference app) |
| Violence, fear, sexuality, language, controlled substances, crude humour, gambling | No to all |
| Can users interact or exchange content with each other? | **No** (Circles off) |
| Does the app share the user's current location with other users? | No |
| Does the app allow users to buy digital goods? | No |
| Does the app contain ads? | No (also answer **No** on App content → Ads) |

**Expected rating:** Everyone / PEGI 3 / USK 0.

### Target audience (Google) and minimum age

- **Not directed at children.** The privacy policy currently says `13 [Lincoln to confirm]` (`POLICY_VALUES.age`, `src/pages/Legal.tsx`).
- Google's Target audience question: pick age groups **13–15, 16–17 and 18+** if the minimum is 13, or **18+ only** if Lincoln raises it. Don't pick any group under 13 (that brings in the Families policy).
- **Lincoln to confirm the minimum age.** It must match the privacy policy and the Apple age rating.

## 2. Google health-app declaration

Play Console has a **Health apps** declaration under App content (as last known; **not verified**, the page couldn't be reached). It asks whether the app has health features and which ones.

| Feature (as last known) | FitWizard | Source |
|---|---|---|
| Activity and fitness | **Yes**: training plans, workout logging, personal records | `src/lib/planGenerator.ts`, `src/components/logging/*` |
| Nutrition and weight management | **Yes**: meal and calorie logging, macro targets, body weight and measurements | `src/stores/nutritionStore*`, `fitwizard-measurements` |
| Sleep management, stress management | **No** (Lincoln to confirm): readiness asks for a 1–5 rating of sleep and stress to suggest training intensity; it doesn't track or manage sleep or stress | `readiness-storage`, `src/components/recovery/*` |
| Medical device, clinical, disease management, medication, period tracking, health research | No | |
| Health Connect permissions | **None requested**. The app doesn't read or write Health Connect | `AndroidManifest.xml` has only `INTERNET` |

If the declaration asks for a disclaimer, use the one below.

## 3. Medical disclaimer: where it appears

| Place | Path | Source |
|---|---|---|
| First run, before using the app | The consent dialog: a required checkbox, "I understand this is **not medical advice**", with links to the terms and privacy policy | `src/components/legal/ConsentModal.tsx` (~146, links ~212–220) |
| Legal page, Medical Disclaimer tab (opens by default) | `/legal` or `/legal?tab=disclaimer`. Reached from the footer on the web, the menu drawer's quick links and About in the apps | `src/pages/Legal.tsx` (tab `disclaimer`); `src/components/header/DrawerQuickLinks.tsx:11`; `src/pages/About.tsx:27` |
| Terms of Service | "Not medical advice" section (`terms-not-medical-advice`) | `src/pages/Legal.tsx` ~180 |
| Store listing text | **To add on Day 6** (`docs/store/LISTING.md`): one closing line, "FitWizard gives general fitness information and is not medical advice. Talk to a doctor before starting a new exercise or nutrition programme." No medical claims anywhere in the listing | Lane A Day 6 |

## 4. Account deletion

| Path | How | Source |
|---|---|---|
| **In the app (signed in)** | Profile → Details → **Delete account**, type DELETE to confirm. Calls the `delete-account` Edge Function, which deletes the user and every row that references them (cascade), then signs out quietly and erases the device | `src/components/account/AccountDeletionSection.tsx`, `src/lib/account/deleteAccount.ts`, `supabase/functions/delete-account/` |
| **In the app (guest)** | Profile → Details → **Erase data on this device** | `clearLocalUserData()`, `src/lib/storage/clearLocalUserData.ts` |
| **On the web (Google's required URL)** | `https://[domain: Lincoln to provide, L3]/legal?tab=privacy#delete-account`. Explains both in-app paths and how to ask by email if you can't sign in | `Legal.tsx` section `delete-account` (Day 4) |
| **By email** | `[support email: Lincoln to provide]` | `POLICY_VALUES.email` in `Legal.tsx` |

**Blockers before submission:**
- The `delete-account` function must be **deployed** (L10 for staging, L2 for production). Until then the in-app button fails for signed-in users.
- The support email and domain must be filled in, or the web deletion page has no working contact.
- Apple requires in-app deletion for apps with account creation: met by the first path once deployed.

## 5. Encryption export compliance

| Question (as last known) | Answer | Source |
|---|---|---|
| Does your app use encryption? | **Yes**, only through the operating system's HTTPS (TLS) for network calls. Sign-in is a one-time email code checked by Supabase over HTTPS. The app adds no encryption of its own and stores data unencrypted in the app's own storage (privacy policy, "Where your data is stored") | `src/lib/supabase.ts`; no crypto library in `package.json` |
| Does it qualify for an exemption? | **Yes**: encryption limited to HTTPS through the OS and authentication is exempt. No export documentation needed. **Lincoln confirms** | |
| `ITSAppUsesNonExemptEncryption` in `Info.plist` | **Not set today** (`ios/App/App/Info.plist`). Lane H can add `<key>ITSAppUsesNonExemptEncryption</key><false/>` so App Store Connect stops asking on every build | Lane H owns `ios/` |
| France declaration | Not needed for exempt encryption (as last known) | |

## Questions for Lincoln

1. **Minimum age:** 13 (current draft) or higher? It sets the Google target audience and must match the policy.
2. **Medical or treatment information** on Apple's questionnaire: "None" or "Infrequent"? Recommended: **Infrequent/mild** if the form counts general training guidance, otherwise None.
3. **Health declaration:** do readiness ratings count as sleep or stress management? Recommended: **no**.
4. **Encryption:** confirm the exemption, and whether Lane H should add `ITSAppUsesNonExemptEncryption = NO`.
5. **Support email and domain** (blocks the deletion URL and the email path).
