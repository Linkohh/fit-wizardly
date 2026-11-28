# GDPR pre-review

> **Preparation for legal review, not legal advice.** Lane A (Day 8, 2026-11-28) wrote this for Lincoln's task L9. It checks the app and the draft privacy policy against the GDPR, and briefly against two US state laws, so a qualified reviewer can start from facts. Every status is a pre-review opinion. A qualified person signs off.

- **Built from:** the code on `preview_b` at `cffb4a7` (after #100), [`DATA_INVENTORY.md`](DATA_INVENTORY.md), the draft policy ([`docs/privacy-policy.md`](../privacy-policy.md), `src/pages/Legal.tsx`), and the handoffs for #75, #96–#99.
- **Vendor facts** (DPAs, transfer mechanisms, regions) come from the vendors' own pages, found by web search on 2026-11-28. Each one is marked "verify", because the agent read search summaries, not the signed documents. They go stale; re-check them before L9 sign-off if more than 30 days have passed.
- **Status key:** ✅ **Covered** · ⚠️ **Gap** (needs work before launch) · ⚖️ **Lincoln or lawyer decides**

## Summary

| | |
|---|---|
| **Biggest gap** | **Art. 9 explicit consent.** Signed-in users' body measurements, readiness check-ins, nutrition profile and logs (and probably workout logs) sync to Supabase. Nothing in the sign-in or sync flow asks for explicit consent to that. The welcome tray's "I Agree & Continue" accepts the Terms and Privacy Policy as a bundle, which isn't explicit, specific consent. Minimal fix: §A, row 9.3 |
| **Other launch gaps** | Name and address of the controller (Art. 13(1)(a)); an EU representative, or geo-restriction (Art. 27); DPAs accepted with all four processors (Art. 28); minimum age (Art. 8); migration 009 on production so the deletion text is true; crash-report flag missing from the export (DEBT-150); Vercel Analytics sends full URLs (DEBT-149, Lane C Day 6) |
| **Already strong** | Works fully without an account, so guests' data never reaches us. Crash reports and usage statistics are separate opt-ins, off by default, and revoked without a reload. PostHog is in the EU with no person profiles and allow-listed properties. Sentry drops PII and health keys. There's in-app export, item deletion with a server-side wipe (009), account deletion, and guest erase. Database access is limited by RLS (row-level security) |
| **Lincoln's decisions** | 12 below, each with a recommended default. The four that block launch: controller identity, the Art. 9 consent step, Art. 27 (representative or geo-restrict), and minimum age |

---

## A. GDPR requirement table

### Art. 5: principles

| # | Requirement | Status | Evidence | Fix or question |
|---|---|---|---|---|
| 5.1 | Lawfulness, fairness, transparency | ⚠️ | Policy sections in `Legal.tsx`; legal bases added today as proposals (`{{basis}}` = "[lawyer confirms]") | Depends on Art. 6 and 9 below |
| 5.2 | Purpose limitation | ✅ | Each purpose in the policy's "Why we use it" matches one processing activity in the ROPA (§C). Analytics events can't carry health values (allow-list in `src/lib/analytics/track.ts`, `ALLOWED_PROP_KEYS`) | — |
| 5.3 | Data minimisation | ✅ mostly | No name is asked for (display name comes from the email's local part, `src/stores/authStore.ts`). Onboarding doesn't save the display name. PostHog uses `person_profiles: 'never'`, URLs are reduced to route patterns (`scrubUrl`), and only 7 property keys are allowed. Sentry uses `dataCollection` minimum and drops health-like keys (`src/lib/monitoring.ts`, `HEALTH_KEY_PATTERN`) | ⚠️ `exercise_interactions` records every exercise a signed-in user views, until account deletion (migration 002). Is that needed for a feature that exists in v1? See decision D-12. ⚠️ Vercel Analytics sends full URLs with plan IDs (DEBT-149, fix in Lane C Day 6) |
| 5.4 | Accuracy | ✅ | Users edit their own entries; profile is generated | — |
| 5.5 | Storage limitation | ⚠️ | Per data type below. Most account data is kept "until you delete it". That's acceptable for a user-controlled log, but there's **no inactivity limit** | Decision D-8: delete accounts after e.g. 24 months without sign-in, with an email warning? Default: **yes, 24 months**, built after launch; until then the policy says "until you delete it" (true today) |
| 5.6 | Integrity and confidentiality | ✅ | HTTPS only; RLS on every table (`supabase/tests/*`); service-role key only inside `delete-account` (`supabase/functions/delete-account/`); session token in app-private storage (ADR 12) | Device storage isn't encrypted by the app (disclosed). Lawyer: is that acceptable for health data on a shared device? |
| 5.7 | Accountability | ⚠️ | This pack, the ROPA (§C), DPIA outline (§E) | Lincoln keeps the signed DPAs, ROPA and DPIA on file |

**Retention per data type** (5.5):

| Data | Where | Kept until | Source |
|---|---|---|---|
| Training, nutrition, body, readiness, achievements, custom exercises | Device | User deletes it, erases the device, signs out (sign-out erases), or uninstalls | `clearLocalUserData.ts`, `signOut.ts` |
| Same, synced | Supabase | Item deleted (content wiped at once by 009; marker kept) or account deleted | migration 009, `delete-account` |
| Deletion marker | Supabase | Account deletion. It holds the key (`id`, or the **date** for `nutrition_days` and `readiness_entries`), `user_id`, `deleted_at`, `updated_at`, and `plans.created_at` | 009 handoff |
| Email, profile | Supabase Auth, `profiles` | Account deletion | cascade test `delete_account.test.sql` |
| Exercise views | Supabase `exercise_interactions` | Account deletion | migration 002 |
| Session token | Device | Sign-out | `authSessionStorage.ts` |
| IP address (rate limit) | Vercel function memory | Life of the function instance | `api/_lib/guard.ts` |
| Vercel request logs | Vercel | Vercel's policy | ⚖️ Lincoln checks the plan's log retention |
| Crash reports | Sentry | [90 days, plan default] | L6 |
| Usage events | PostHog EU | [plan default] | L6. ⚠️ Recommend setting the shortest retention that still answers product questions (e.g. 12 months) |
| Page views | Vercel Web Analytics | [plan default] | Lincoln checks |
| Backups | Supabase | [plan's backup period] | ⚠️ Lincoln reads it from the plan. Deleted accounts survive in backups until they expire; the policy says so |

### Art. 6: lawful basis per purpose

These bases are **proposals** for the reviewer. They're in the policy text now, each followed by "[lawyer confirms]".

| # | Purpose | Proposed basis | Status | Note |
|---|---|---|---|---|
| 6.1 | App features on the device (guest) | 6(1)(b) contract | ⚖️ | Arguably the controller processes nothing here: the data never leaves the device and we can't reach it. Lawyer: does local-only storage count as our processing at all? |
| 6.2 | Account and sign-in (email, profile) | 6(1)(b) contract | ✅ | Needed to provide the account the user asks for |
| 6.3 | Cloud sync of training and health data | 6(1)(b) **plus** Art. 9(2)(a) explicit consent | ⚠️ | Art. 9 needs its own condition; see 9.3 |
| 6.4 | Exercise views (`exercise_interactions`) | 6(1)(f) legitimate interest, or 6(1)(b) if a feature uses it | ⚖️ | Needs a balancing test if kept (D-12) |
| 6.5 | Crash reports (Sentry) | 6(1)(a) consent | ✅ | Opt-in, separate, off by default (#98). Consent is also what ePrivacy needs, so it's the simpler choice than legitimate interest |
| 6.6 | Usage statistics (PostHog, Vercel Web Analytics) | 6(1)(a) consent | ✅ | Same toggle for both, off by default |
| 6.7 | Food lookup (Open Food Facts) | 6(1)(a) consent | ✅ | Gated before every request (`src/lib/openFoodFacts.ts`). Open Food Facts receives the request directly, as its own controller |
| 6.8 | Rate limiting (IP in memory) | 6(1)(f) legitimate interest | ✅ | Short-lived, memory only, never logged by us. Disclosed |
| 6.9 | Hosting logs (Vercel platform) | 6(1)(f) | ✅ | Disclosed in "Technical data" |
| 6.10 | Breach handling, answering rights requests | 6(1)(c) legal obligation | ✅ | Not in the policy; add one line if the reviewer wants it |

### Art. 9: special-category (health) data

| # | Requirement | Status | Evidence | Fix or question |
|---|---|---|---|---|
| 9.1 | Identify health data | ⚖️ | Body measurements (weight, body-fat %, girths), readiness (sleep quality, soreness, stress, energy), nutrition profile (age, sex, height, weight) and logs are very likely health data. Workout logs and PRs are probably health data when linked to an account (they reveal physical condition). The iOS manifest already declares **Health** and **Fitness** (`PrivacyInfo.xcprivacy`, #92) | Lawyer confirms which categories count. The pre-review treats all synced training data as health data, the safe default |
| 9.2 | Guests | ✅ | Guests' data stays on the device; sync runs only for a signed-in user (`src/lib/sync/triggers.ts`). Exercise interactions are sent only when signed in | — |
| 9.3 | **Signed-in sync needs explicit consent, or another 9(2) condition** | ⚠️ **Gap** | **Not collected today.** `src/components/auth/AuthModal.tsx` and `EmailCodeStep.tsx` contain no consent wording. Sync starts on `SIGNED_IN` (`startSync` in `src/lib/sync/triggers.ts`). The only agreement anywhere is the welcome tray's "By clicking I Agree, you accept our Terms of Service and Privacy Policy" (`src/components/legal/ConsentModal.tsx`): bundled with the Terms, not specific to health data, and given before any account exists. No other 9(2) condition fits a consumer fitness app (not 9(2)(h) medical care; not 9(2)(e) manifestly made public) | **Minimal fix** (proposed DEBT-155, HIGH; Lanes H, E and F, about one day): **1.** After the first successful sign-in on a device, and before `startSync` runs, show one screen "Back up your health and fitness data". It lists the categories (workouts, body measurements, readiness, nutrition), says where they go (Supabase, `{{region}}`), and has an unticked checkbox: "I agree that FitWizard stores this health data in my account". Buttons: Continue (disabled until ticked) and "Not now" (stay signed out, data stays on the device). **2.** Store `{ version, given_at }` in `user_state` (migration 010, Lane F), and locally, so a second device doesn't ask again. Include it in the export. **3.** Withdrawal: Profile → Privacy Settings gets "Stop cloud backup". It stops sync, signs out, and offers Delete account (which already deletes the cloud copy). **4.** Sync code checks the flag before every push (Lane E), so a missing flag never uploads. Alternative the lawyer may prefer: a lighter in-flow checkbox on the sign-in dialog itself (fewer taps, same storage) |
| 9.4 | Health data in third-party tools | ✅ | PostHog allow-list blocks health keys; `track.test.ts` covers `weight`, `reps`, `body_fat`, `calories`, `meal`. Sentry `beforeSend` drops health-like `extra` keys and breadcrumbs (`monitoring.ts`). Neither has an account ID | Values under allowed keys aren't checked for meaning (Lane C note). Code review rule, not a gap |

### Arts. 7 and 8: consent conditions; children

| # | Requirement | Status | Evidence | Fix or question |
|---|---|---|---|---|
| 7.1 | Consent is freely given, specific, informed, unambiguous | ✅ for the three toggles | Three separate unticked checkboxes, each with a one-line description of what's sent and to whom (`ConsentModal.tsx`; `consent.*` keys) | ⚠️ "I Agree & Continue" is required to use the app and accepts the Terms and Policy. Fine as acceptance of terms; it must **not** be relied on as GDPR consent for anything (see 9.3) |
| 7.2 | Proof of consent (7(1)) | ⚠️ | Only `fitwizard_consent_v1` (ISO timestamp) and `'true'` flags in localStorage. No record of which text version was agreed to, and nothing is kept server-side for the toggles | For the toggles (no account), device-only records are probably proportionate; lawyer confirms. For the Art. 9 consent, store version and time (9.3). Proposed DEBT-156 (LOW): record the policy version with the consent timestamp |
| 7.3 | Withdrawal as easy as giving (7(3)) | ✅ | Profile → Details → Privacy Settings reopens the tray (`requestConsentModal`, `src/pages/Profile.tsx` ~line 393). Revocation is immediate: `Sentry.close()`, `posthog.opt_out_capturing()` (which also deletes PostHog's stored ID), Vercel Analytics unmounts (#98 tests) | The Privacy Settings label is hard-coded English (Lane J) |
| 7.4 | Consent not bundled with the service (7(4)) | ✅ | The app works with all three toggles off | — |
| 8.1 | Age of digital consent: 13–16 by member state, where an information society service relies on consent for a child | ⚖️ | Policy says "not directed at children under 13 [Lincoln confirms]" (`POLICY_VALUES.age`). No age question anywhere. The Art. 9 consent (9.3) **is** consent, so for users under the national age (16 in e.g. Germany and the Netherlands; 13–15 elsewhere) a parent would have to consent | **D-4 recommended default: minimum age 16**, with one line "I'm 16 or older" on the sync-consent screen. That removes the parental-consent problem across the EU. It also matches Google's "18+ or 16+" target-audience choice more easily than 13 (`COMPLIANCE.md` §1). Lawyer: is a self-declaration enough? |

### Arts. 12–14: transparency (policy checklist, Art. 13)

| # | Item | Status | Where in the policy |
|---|---|---|---|
| 13.1 | Identity and contact of the controller | ⚠️ | `contact.p1` now names `{{controller}}`: "[Lincoln confirms: name and postal address …]". Must be filled in (D-1) |
| 13.2 | DPO contact | ✅ n/a | A DPO is required only for large-scale **core** processing of special data (Art. 37(1)(c)). ⚖️ Lawyer: at launch scale, probably not; say "no DPO appointed" if the reviewer prefers |
| 13.3 | Purposes and legal basis | ⚠️ | "Why we use it", with the proposed bases bracketed |
| 13.4 | Legitimate interests named | ✅ | Abuse protection; exercise views if kept (6.4) |
| 13.5 | Recipients | ✅ | "Who receives your data": Supabase, Vercel (hosting + Web Analytics), Open Food Facts, wger, API Ninjas, Sentry, PostHog, Apple/Google |
| 13.6 | Transfers outside the EEA and the safeguard | ⚠️ | `storage.transfers` now names SCCs and the DPF, with `{{transfers}}` bracketed until the DPAs are accepted |
| 13.7 | Retention periods | ⚠️ | "How long we keep it"; vendor retention bracketed |
| 13.8 | Rights (access, rectification, erasure, restriction, portability, objection) | ✅ | `choices.rights` (rewritten today) |
| 13.9 | Right to withdraw consent | ✅ | `choices.rights`, `choices.consent` |
| 13.10 | Right to complain to a supervisory authority | ✅ | `choices.rights` (added today) |
| 13.11 | Whether providing data is required | ⚠️ | Implied (account optional; email needed only to sign in). Lawyer: is a sentence needed? |
| 13.12 | Automated decisions / profiling | ✅ n/a | The plan generator is a rules engine the user runs on their own data, with no legal or similarly significant effect. Readiness advice is the same. ⚖️ Lawyer confirms Art. 22 doesn't apply |
| 12.1 | Plain language; timely reply (one month) | ✅ | Short sections; "we reply within one month" added today |
| 12.2 | Spanish copy (D3: launch in English and Spanish) | ⚠️ | `es.json` `legal.*` is a draft, marked "La traducción al español también es un borrador". A Spanish-speaking reviewer checks it. de/pt legal text is missing (DEBT-098), fine while they aren't launch languages |
| 14 | Data not obtained from the user | ✅ n/a | Nothing is collected about users from third parties |

### Arts. 15–22: data subject rights

| # | Right | Status | Evidence | Fix or question |
|---|---|---|---|---|
| 15 | Access | ✅ mostly | Self-service export: `buildUserDataExport`, `src/lib/dataExport.ts`, export version 3 | ⚠️ The export reads the **device**. A signed-in user on a fresh device gets what has been pulled so far, and `exercise_interactions` (server-only) is never in it. Art. 15 also needs the purposes, recipients and retention (the policy covers these). For a full copy, the email route must be able to produce a server-side dump. Lincoln: write a one-page SQL runbook (D-9) |
| 15b | Export completeness | ⚠️ | The `consent` block has `consentGivenAt`, `analytics`, `nutritionLookup`, but **not** `crashReports` (asked of Lane F in the Lane C Day 5 handoff, not done) | DEBT-150 (LOW, Lane F): add `crashReports: readLocalStorage(CRASH_REPORTS_CONSENT_STORAGE_KEY) === 'true'` |
| 16 | Rectification | ✅ | Users edit plans, logs, measurements and nutrition in the app. Email can't be changed in the app | ⚖️ Email change by request (support email) is acceptable; lawyer confirms |
| 17 | Erasure | ✅ in code | Item delete: content wiped server-side (`009_purge_tombstone_content.sql`, #97), and other devices remove it (`keyOfTombstone()`, #96). Account delete: `delete-account` function plus cascade (`supabase/tests/delete_account.test.sql`). Guest: Erase data on this device (`clearLocalUserData.ts`). By email: within 30 days | ⚠️ **009 isn't on production yet** (L2 step 5, after the client ships); the policy text carries `{{wipe}}` until then. ⚠️ `delete-account` isn't deployed (L10). Residuals the policy discloses: the deletion marker keeps the date of a deleted daily log, backups, and other devices' local copies after account deletion |
| 18 | Restriction | ⚖️ | No in-app control; by email | Acceptable for this size; the runbook (D-9) says how to pause sync for an account (e.g. revoke the session) |
| 20 | Portability | ✅ | JSON export, machine-readable (the policy now says so) | Server-side export gap as in 15 |
| 21 | Objection | ✅ | Only 6(1)(f) processing: rate limit (necessary), exercise views (D-12) | If exercise views are kept, objection is by email |
| 22 | Automated decisions | ✅ n/a | See 13.12 | — |
| 12.2 | How a user makes a request | ⚠️ | Support email, `[Lincoln confirms: public support email]`. The deletion email route already requires sending from the account's address | D-2: a public address, not a personal one |

### Art. 25: data protection by design and by default

| # | Item | Status | Evidence |
|---|---|---|---|
| 25.1 | Optional tools off by default | ✅ | All three toggles start unticked; crash reports started off for existing users too (#98) |
| 25.2 | No account needed | ✅ | Full app as a guest |
| 25.3 | Analytics minimised | ✅ | PostHog: EU host, `person_profiles: 'never'`, no `identify()`, no autocapture, no recordings, no surveys, no remote scripts, allow-listed properties, URLs reduced to route patterns, opt-out deletes the stored ID (`track.ts`) |
| 25.4 | Crash reports minimised | ✅ | `dataCollection` minimum, query strings removed, health keys and breadcrumbs dropped, consent re-checked in `beforeSend` |
| 25.5 | URL masking in Vercel Web Analytics | ⚠️ | No `beforeSend`, so with consent the full URL (plan IDs, `/join/<code>`) is sent. DEBT-149, Lane C Day 6 (in progress) |
| 25.6 | "Anonymous" wording | ⚖️ | The toggle says "anonymous usage statistics". PostHog events carry a random device ID, and PostHog sees the IP, so under the GDPR this is **pseudonymous**, not anonymous. Lawyer question 4 |
| 25.7 | Sign-out erases the device | ✅ | `src/lib/sync/signOut.ts` (#81) |

### Art. 28: processors and DPAs

| Vendor | Role | DPA | What Lincoln must do | Status |
|---|---|---|---|---|
| Supabase (Supabase Inc.; Supabase Pte. in some DPA versions) | Processor: auth, database, sign-in email | Self-service DPA at [supabase.com/legal/dpa](https://supabase.com/legal/dpa), with SCCs (2021/914) and a transfer impact assessment | Accept or download and sign the current DPA; note which entity signs; keep a copy | ⚠️ verify |
| Vercel (Vercel Inc.) | Processor: hosting, functions, logs, Web Analytics | [vercel.com/legal/dpa](https://vercel.com/legal/dpa), with SCCs and the UK Addendum | Check the DPA applies to this plan (on some plans it's part of the terms); keep a copy | ⚠️ verify |
| Sentry (Functional Software, Inc.) | Processor: crash reports | [In-app DPA](https://sentry.io/legal/dpa/in-app) (Settings → Legal & Compliance) | Accept in the org settings at L6; choose the **EU** region when creating the org (it can't be changed later) | ⚠️ verify at L6 |
| PostHog (PostHog Inc.) | Processor: usage events | [posthog.com/dpa](https://posthog.com/dpa), with SCCs | Generate and sign at L6; create the project in **EU Cloud**; turn on "Discard client IP data" | ⚠️ verify at L6 |
| Open Food Facts | Independent controller (the device calls it directly, only with consent) | None needed | — | ✅ ⚖️ lawyer confirms the role |
| wger | Independent controller for image requests (the user's IP); catalogue requests come from our servers | None needed | — | ✅ ⚖️ |
| API Ninjas | Receives search text from our server only; no personal data | None needed | — | ✅ |
| Apple, Google | Independent controllers (distribution) | Their developer terms | — | ✅ |

Also needed: each processor's **sub-processor list** (linked from its DPA) kept with the ROPA.

### Arts. 44–49: international transfers

| Vendor | Where data is stored | Transfer mechanism (per vendor pages, 2026-11-28) | Status |
|---|---|---|---|
| Supabase | The project's region: **unknown** (`{{region}}`). An EU region (e.g. Frankfurt) keeps stored data in the EU | SCCs in the DPA plus a TIA ([transfers FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq)). No DPF certification was found | ⚠️ D-3: confirm the region. If the project is in the US, the transfer runs on SCCs. A new EU project before launch is cheap now and expensive later |
| Vercel | Global edge network; function region not set in `vercel.json` | DPF certified ([Vercel changelog](https://vercel.com/changelog/vercel-is-now-certified-under-the-eu-us-data-privacy-framework-dpf)), plus SCCs in the DPA | ⚠️ verify on dataprivacyframework.gov. ⚖️ Consider setting the function region to an EU region (one line in `vercel.json`, Lane H) |
| Sentry | EU region = Frankfurt ([docs](https://docs.sentry.io/organization/data-storage-location/)); chosen when the org is created | DPF (EU-US, UK, Swiss) and the DPA ([International transfers PDF](https://sentry.io/astro-assets/trust/International-Data-Transfers-With-Sentry-2025-12-26.pdf)). US parent company | ⚠️ pick EU at L6 |
| PostHog | EU Cloud, AWS eu-central-1, Frankfurt ([PostHog EU](https://posthog.com/blog/posthog-cloud-eu)) | SCCs in the DPA; check sub-processors with US processing ([list](https://posthog.com/subprocessors)) | ⚠️ verify at L6 |
| Open Food Facts | France | None (EU) | ✅ |
| wger | Germany (not verified) | None (EU) | ✅ |
| API Ninjas | Unknown | No personal data sent | ✅ |

The policy text (`storage.transfers`) now says the US vendors are covered by SCCs or the DPF, as set out in each DPA, with `{{transfers}}` until Lincoln confirms.

### Art. 27: EU representative

| # | Item | Status | Detail |
|---|---|---|---|
| 27.1 | A controller outside the EU that offers the app to people in the EU must name an EU representative | ⚖️ **Lincoln or lawyer decides** | Lincoln is in Virginia, USA. Offering the app on the EU App Store and Play storefronts, and in Spanish, likely counts as "offering services" to people in the EU (Art. 3(2)(a)). The exemption in Art. 27(2)(a) is for occasional processing that **doesn't** include large-scale special-category data; health data is core here, so the exemption probably doesn't apply. The UK has the same rule under UK GDPR |
| | **Option A** | | Appoint an EU (and UK) representative service. Low annual cost; name them in the policy |
| | **Option B** | | **Geo-restrict:** don't distribute in the EEA, UK or Switzerland (store availability settings), and say so in the listing. The website stays reachable, but it isn't offered there. This also defers most of this document. Spanish still serves the US and Latin America |
| | **Recommended default (D-5)** | | **Option B for v1**, unless the lawyer advises otherwise, then Option A when EU launch is wanted. Reason: it removes the representative, the Art. 9 cross-border questions and EU complaints risk while the app is small. Note: the Art. 9 consent screen (9.3) is still worth building, because the US state laws below also want consent for health data |

### Art. 30: records of processing (minimal ROPA draft)

Controller: `[Lincoln confirms: name, address, contact]` · EU representative: `[D-5]` · DPO: none (13.2).

| # | Activity | Purpose | Data subjects | Data categories | Recipients | Transfer | Retention | Security |
|---|---|---|---|---|---|---|---|---|
| R1 | Accounts and sign-in | Provide the account | Signed-in users | Email, display name, timezone, session token | Supabase | Region TBC; SCCs | Until account deletion | RLS, HTTPS, token in app-private storage |
| R2 | Cloud sync | Back up and sync | Signed-in users | Plans, workout logs, PRs, nutrition profile and logs, body measurements, readiness, achievements, custom exercises, favourites (**health data**) | Supabase | Region TBC; SCCs | Until item or account deletion; item content wiped at once (009) | RLS per `user_id`; deletion cascade |
| R3 | Exercise views | Exercise stats | Signed-in users | Exercise ID, interaction type, time | Supabase | As R1 | Until account deletion | RLS |
| R4 | Crash reports | Fix errors | Users who opted in | Error, stack, app version, browser/OS, path; IP seen, not stored | Sentry | EU region; DPF/DPA | [90 days] | PII and health keys dropped |
| R5 | Usage statistics | Product decisions | Users who opted in | Event name, route pattern, 7 allowed properties, random device ID; IP seen, not stored | PostHog EU, Vercel Web Analytics | EU (PostHog); DPF/SCCs (Vercel) | [plan defaults] | Allow-list, no profiles, URL masking |
| R6 | Food lookup | Look up foods | Users who opted in | Barcode or search text, IP | Open Food Facts (own controller) | None (France) | OFF's policy | Consent gate |
| R7 | Hosting and rate limit | Run and protect the service | All visitors | IP, user agent, request path | Vercel | DPF/SCCs | IP in memory for the function's life; platform logs per Vercel | Origin allowlist, 60/min limit |
| R8 | Rights requests and breaches | Legal obligations | Requesters | Email, request content | Support mailbox provider `[Lincoln confirms]` | `[TBC]` | `[Lincoln confirms, e.g. 3 years]` | — |

### Arts. 33 and 34: breach notification (short procedure)

1. **Detect.** Sources: Supabase and Vercel security emails, Sentry alerts, user reports to the support email, Dependabot and `npm audit`.
2. **Contain** within hours. Rotate the Supabase service-role key and the anon key; revoke sessions; take the affected function down (Vercel); restore from backup if data was changed.
3. **Assess.** What data (health or not), how many people, which countries, is it encrypted or unreadable, likely risk to people.
4. **Notify the supervisory authority within 72 hours** of becoming aware, unless the breach is unlikely to result in a risk (Art. 33). With no EU establishment, notify the authority where affected users are, or the lead authority the representative advises (⚖️ lawyer question 7). Late? Give reasons.
5. **Tell users** without undue delay if the risk is **high** (Art. 34). Any leak of synced health data should be assumed high. Email from the support address, plus an in-app notice.
6. **US states.** Virginia's breach law (Va. Code § 18.2-186.6) and other states' laws have their own triggers and timing. ⚖️ Lawyer.
7. **Record every breach** (Art. 33(5)), even ones not notified: date, facts, effects, actions. Keep it with the ROPA.
8. **Processors** must tell Lincoln without undue delay (it's in each DPA). Lincoln makes sure the security contact on each vendor account is an address he reads.

### Art. 35: DPIA

| Item | Detail |
|---|---|
| Is a DPIA advisable? | ⚖️ **Likely yes.** Processing health data with new technology at scale is on most EU authorities' lists. Even at small scale it's cheap insurance, and it's the document a reviewer or store would ask for first |
| Outline | **1. Description:** activities R1–R7, data flows (device → Supabase; opt-in → Sentry/PostHog/Vercel/OFF), and the code references in this file. **2. Necessity and proportionality:** account optional, minimisation (5.3), retention table (5.5), legal bases (Art. 6), consent design (Art. 7). **3. Risks to people:** (a) health data exposed through an account takeover (email-only sign-in), (b) breach at Supabase, (c) health data leaking into analytics or crash reports, (d) data left on a shared device, (e) data kept after a user thinks it's deleted (backups, markers, other devices), (f) transfer to the US. **4. Measures:** RLS and its tests; short-lived 6-digit codes (L11); allow-lists and scrubbers with tests; sign-out erase; 009 wipe; account deletion; EU regions; DPAs. **5. Residual risk and sign-off:** Lincoln, with the reviewer's opinion. Revisit before turning on Circles or the coach portal, which would add sharing between users |

### ePrivacy (Art. 5(3) of the ePrivacy Directive): device storage

| Item | Storage | Needs consent? | Status |
|---|---|---|---|
| User data the user creates (plans, logs, nutrition…) | IndexedDB `fitwizard/kv` (web), app files (native) | No: strictly necessary for the service the user asked for | ✅ |
| Consent flags (`fitwizard_consent_v1`, `fitwizard_analytics_consent`, `fitwizard_crash_reports_consent`, `fitwizard_nutrition_lookup_consent`) | localStorage | No: storing the user's choice is necessary | ✅ |
| Session token (`sb-<project>-auth-token`) | localStorage / Preferences | No: needed for the sign-in the user requested | ✅ |
| Language, theme, About seen, install coach, anatomy view, motion permission, persistent-storage flag | localStorage | No: user-requested settings (functionality). ⚖️ The lawyer confirms these count as strictly necessary in the target countries | ✅ |
| Service worker precache and `exercise-data` Cache Storage; last-known-good exercise library and daily quote in localStorage | Cache Storage, localStorage | No: needed for offline use, no personal data | ✅ |
| PostHog ID (`ph_<key>_posthog`) and opt-out flag | localStorage | **Yes**, and it's only written after opt-in. The opt-out flag stores only the choice | ✅ |
| Vercel Web Analytics | No cookies or storage; daily request hash | Reading device information to make the hash may still be "access" under some readings; it's behind consent anyway | ✅ |
| Sentry | No storage by the app's config | Behind consent anyway | ✅ |
| Notification permission and reminder settings | Device storage (native only) | No: user-requested | ✅ |

Nothing on the device needs consent beyond what's already gated.

---

## B. US state law quick check

Applicability thresholds and gaps only. ⚖️ The lawyer confirms.

| Law | Applies when | Does it apply to FitWizard at launch? | Gaps if it applies |
|---|---|---|---|
| **Virginia VCDPA** (Lincoln's state) | A business in Virginia, or targeting Virginians, that in a year **controls or processes personal data of 100,000+ Virginia consumers**, or **25,000+ and makes over 50% of gross revenue from selling personal data** | **Probably not at launch** (free, no data sales, far below 100,000). Watch the number of Virginia accounts | Health data is **sensitive data**, which needs **opt-in consent** (the 9.3 screen covers this). It also needs a data protection assessment (the DPIA covers it), a way to appeal a refused request, and a 45-day reply. The policy's rights section would need "appeal" wording |
| **California CCPA/CPRA** | A for-profit business with **over $25 million** in annual gross revenue (inflation-adjusted, now somewhat higher; verify), **or** buys, sells or shares personal information of **100,000+** California consumers or households, **or** makes **50%+** of revenue from selling or sharing | **No at launch** (no revenue threshold met, no sale or "sharing" for cross-context advertising) | If it ever applies: a "Notice at collection", the right to limit use of sensitive personal information, a "Do Not Sell or Share" link (not needed if there is no sale or sharing), and a 45-day reply |
| Other notes | Several states have consumer **health** data laws with **no revenue threshold**, notably Washington's My Health My Data Act (and Nevada's similar law). They cover a consumer's "health data", including fitness tracking, and need separate consent and a separate health-data privacy policy | ⚖️ **Lawyer question 9.** This is the most likely US law to apply at small scale if the app is offered to Washington residents | Possibly: a separate consumer health data policy, consent before collecting, and a ban on selling without a signed authorisation |

---

## C. Questions for the lawyer

1. **Art. 9:** do workout logs and personal records count as health data when linked to an account, or only body measurements, readiness and the nutrition profile? Does the proposed consent screen (9.3) meet "explicit", or should it be a separate step from sign-in?
2. **Guest mode:** is data that stays on the user's device, which we can't access, processed by us as controller at all? If not, the policy could say so more plainly.
3. **Art. 27:** does distributing on EU storefronts and offering Spanish make Art. 3(2) apply? Is geo-restricting the stores enough while the website stays reachable?
4. **"Anonymous usage statistics":** with a random device ID and an IP the processor sees but doesn't store, must the label say "pseudonymous" (or drop "anonymous")?
5. **Art. 8:** is a self-declared "I'm 16 or older" sufficient, and is 16 the right single minimum for the EU and UK?
6. **Proposed legal bases:** confirm each row of the Art. 6 table, especially exercise views (6.4) and whether contract or consent fits on-device features.
7. **Breach notification:** with no EU establishment, which supervisory authority gets an Art. 33 notice?
8. **Terms:** governing law and venue for a Virginia-based individual developer offering a free app worldwide; whether the liability clause holds against EU consumer law (it already says "to the extent the law allows").
9. **Washington My Health My Data Act** (and similar state health-data laws): does it apply, and does the app need a separate consumer health data policy?
10. **Spanish copy:** must the Spanish policy be reviewed by a Spanish-qualified reviewer before it's shown, or can it ship marked as a translation with English controlling?
11. **Deletion residuals:** is keeping the deletion marker (with a daily log's date) until account deletion acceptable, given it's needed so other devices delete the item? Would a time limit (e.g. 90 days after the last device syncs) be expected?

## D. Decisions for Lincoln

Each has a recommended default. They apply if you don't answer, except where marked **needs your answer**.

| ID | Decision | Recommended default | Why |
|---|---|---|---|
| D-1 | Controller name and postal address in the policy | **Needs your answer.** Your name (or a business entity if you form one) and a postal address. A PO box or registered-agent address is common | Required by Art. 13(1)(a) and by both stores |
| D-2 | Public support email | **Needs your answer.** A new address on the app's domain (L3), not personal | Used for rights requests, deletion by email, breaches |
| D-3 | Supabase region | Create the **production** project in an **EU region** (e.g. Frankfurt) before L2, if the current one is in the US | Avoids a US transfer for health data. Cheap before launch, a migration after |
| D-4 | Minimum age | **16**, with "I'm 16 or older" on the sync-consent screen | Removes Art. 8 parental consent across the EU; simpler store answers |
| D-5 | EU representative or geo-restrict | **Geo-restrict EEA, UK and Switzerland for v1**; revisit with a representative later | See Art. 27. Lowest cost and risk at launch |
| D-6 | Build the Art. 9 consent screen (DEBT-155) | **Yes, before launch**, assigned to H (UI), E (sync gate) and F (migration 010 + export) | Needed for the EU, and for US health-data laws (VCDPA sensitive data, Washington) even if you geo-restrict |
| D-7 | Sentry and PostHog regions and settings at L6 | **Sentry EU org; PostHog EU Cloud with "Discard client IP data"; shortest retention that works** | Matches the policy text; regions can't be changed later |
| D-8 | Inactive-account deletion | **24 months without sign-in**, with an email warning 30 days before; built after launch | Storage limitation (5.5) |
| D-9 | Rights-request runbook | **Yes:** a one-page SQL runbook for a server-side export and for pausing an account, kept in `docs/` | The in-app export reads the device only (15) |
| D-10 | Accept the four DPAs | **Yes, at account setup** (Supabase and Vercel now; Sentry and PostHog at L6). Keep copies with the ROPA | Art. 28 |
| D-11 | Do a DPIA | **Yes**, short, from the outline in §A Art. 35 | Health data; the reviewer will ask |
| D-12 | Keep `exercise_interactions` (every exercise view, until account deletion) | **Stop recording** for v1 unless a shipped feature uses it, or limit it to 90 days | Minimisation; it's the one server-side collection with no clear user benefit |

## E. New issues

| ID | Severity | File | Description |
|---|---|---|---|
| DEBT-155 | HIGH | `src/components/auth/*`, `src/lib/sync/triggers.ts`, `supabase/migrations/` | No explicit consent before health data syncs to Supabase (Art. 9; VCDPA sensitive data). Fix: §A row 9.3 |
| DEBT-156 | LOW | `src/components/legal/ConsentModal.tsx`, `src/lib/consent.ts` | Consent records keep a timestamp only, not which policy or tray version was agreed to (Art. 7(1) proof) |
| DEBT-150 | LOW | `src/lib/dataExport.ts` | Export's `consent` block lacks `crashReports` (from the Lane C Day 5 handoff) |
| DEBT-149 | MEDIUM | `src/App.tsx` | Vercel Web Analytics sends full URLs with IDs and invite codes (Lane C Day 6, in progress) |
