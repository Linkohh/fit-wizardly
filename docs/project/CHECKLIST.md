# Running checklist

> The quick view: what's done, what's in progress, and what's left. It's updated after every step.
> `BOARD.md` has the full day-by-day grid and the gate checklists; this page is the short version.
> **Last updated:** 2026-11-25. **Wave 1 is complete** (all PRs through #69 merged); Gate 1 is waiting on Lincoln's L10 and L11. **Wave 2 Day 5 is merged** (#80–#86), and Day 6 for D, F and H (#87, #89, #90), except Lane C's #75, which waits on your `$pageview` decision.

## Done

| # | What | Where |
|---|---|---|
| 1 | Full review of the app (code, docs, database, native projects, CI) | `docs/LAUNCH_ROADMAP.md` §1 |
| 2 | README rewritten: what FitWizard is and how people use it | `README.md` |
| 3 | Launch plan split into parallel lanes, days and waves, with one brief per lane | `docs/project/` |
| 4 | Feature flags that hide Circles and the coach portal (off by default) | `src/lib/featureFlags.ts` |
| 5 | **Merged #44** (Day 0 plan) | `79b6ebb` |
| 6 | Decisions D1–D6 acknowledged with their defaults; store enrollment (L4) deferred by Lincoln | `BOARD.md` |
| 7 | **Merged #45**, Lane E Day 1: storage on the device, plus a loading gate | `5984b86` |
| 8 | **Merged #46**, Lane E Day 2: plans, workouts, PRs, the in-progress workout and measurements survive restarts; streak, weekly goal and badges work; resume/discard prompt for an unfinished workout | `803842e` |
| 9 | Started six parallel agent sessions for Wave 1 / Day 1 (lanes A, B, C, D, F, H) | 6 sessions |
| 10 | Reviewed all seven Wave 1 / Day 1 PRs: every diff and handoff, file ownership, secrets, migration access rules | This session |
| 11 | **Merged #50** Lane F: Supabase CLI, test harness, migration 007 (cloud tables, owner-only access) | `54fcae8` |
| 12 | **Merged #49** Lane C: Circles and coach routes and links hidden | `1a715ef` |
| 13 | **Merged #48** Lane H: app name FitWizard; iOS/Android release settings; privacy manifest | `6a31fd2` |
| 14 | **Merged #51** Lane B: AI claims, fake exercise badges and blocked meal images removed | `e69675a` |
| 15 | **Merged #52** Lane D: icons and logo compressed; exercise data cached on first use; `public/` 11 MB → 4 MB | `8524a3c` |
| 16 | **Merged #47** Lane A: CLAUDE.md fixed, AGENTS.md deleted, warning banners on outdated docs | `4ff74e6` |
| 17 | **Merged #53** Lane E Day 3: nutrition, readiness, achievements and custom exercises saved on the device; erase-all; sign-out keeps data; ADR 11; 2 review findings fixed | `7ef77e5` |
| 18 | Final combined check: 891/891 tests, lint, typecheck and build. Browser checks pass: no AI wording, Circles hidden, coach pages 404, plan and achievements survive reload, nothing stored in localStorage | This session |
| 19 | Each lane's carry-over items written into its next brief; new issues DEBT-046 to DEBT-057 logged | Lane briefs, `SESSION_LOG.md` |
| 20 | Wave 1 / Day 2 started for A, B, C, D, F, H. The first attempt hit the usage limit before any work was done (no branches were pushed), so all six were restarted once the limit reset | 6 sessions |
| 21 | **Merged #59**, Lane E Day 4: cloud sync engine core (pull, merge, push, outbox, status) and the 3 unearnable "Wisdom AI" badges removed. 3 review findings fixed first, each with a test that fails without the fix | `0513fd0` |
| 22 | Reviewed all seven Day 2 PRs: every diff and handoff, file ownership, secrets, migration 008 line by line, DB harness re-run here, trial merge (974/974 tests), browser checks | This session |
| 23 | **Merged #57** Lane F: migration 008 fixes the Circles policy loop, stops forged streaks/badges/scores, makes profiles private, and lets accounts be deleted | `886d34b` |
| 24 | **Merged #58** Lane C: coach mode off everywhere, onboarding skips the role step, palette links fixed | `6abc06f` |
| 25 | **Merged #60** Lane H: fonts self-hosted (nothing goes to Google), `/api` origin allowlist and rate limit, exercise data always through our proxy, Android portrait | `cb64f9f` |
| 26 | **Merged #55** Lane B: language picker offers English and Spanish and remembers the choice; Profile labels translated | `59c2d05` |
| 27 | **Merged #54** Lane D: 36 dead files and the leftover Lovable tooling removed | `761c8e0` |
| 28 | **Merged #56** Lane A: iOS guide merged, data inventory written, `.claude/` audited | `ac525a5` |
| 29 | Carry-overs written into each lane's next brief; DEBT-058 to DEBT-075 logged; 12 old issues closed | Lane briefs, `SESSION_LOG.md` |
| 30 | **Merged #61**: the docs above | `172c428` |
| 31 | Lane E Day 5: workouts, PRs, meals, nutrition settings, measurements, check-ins and achievements can now sync. Every change is tracked automatically. Two-device test passes. Also: the browser is now asked not to evict saved data (missed on Day 1). One review finding fixed. 984/984 tests | **Merged #64** `a621a4f` |
| 32 | **Merged #62** Lane H Day 3: sign in with a 6-digit email code (needs L11 to work for real); iPhone live reload | `4b3bb21` |
| 33 | Fresh Day 3 sessions for B, C, D, F, started at your "keep it going", and resumed after the usage limit | 4 sessions |
| 34 | Lane E Day 6: sync turned on for signed-in users (sign-in, back online, back in the app, 2 s after a change); first sign-in backs up this device's data; Profile shows Synced / Saving / Offline / Problem. Two review findings (data-loss risks) fixed first. 1017/1017 tests | **Merged #66** `12fbcbb` |
| 35 | **Merged #65** Lane F Day 3: delete-account function (not yet deployed; needs L10). Re-ran its database and function tests here | `521be87` |
| 36 | **Merged #67** Lane D Day 3: PDF export fixes (no doubled day numbers, one-line headers, no garbled emoji); dev proxy error text | `3d95fed` |
| 37 | **Merged #69** Lane C Day 3: crash reporting, opt-in and off until L6; per-page error screens. Consent-order bug fixed first | `57e92ac` |
| 38 | **Merged #68** Lane B Day 3: empty states for History, Analytics and Nutrition; `<html lang>` follows the language | `421a453` |
| 39 | **Merged #63** Lane A Day 3: data inventory, release-notes draft, Gate 1 checklist, locale-placement rule | `f983e20` |
| 40 | Final Wave 1 check on `preview_b`: 1056/1056 tests, lint, typecheck, build. Browser: no AI wording, Circles and coach pages 404, empty states show, no training data in localStorage, opens offline, no errors | This session |
| 41 | **Merged #73** Lane F Day 4: Delete account and guest Erase data on this device on Profile → Details; export v3 covers everything stored | `1708d12` |
| 42 | **Merged #74** Lane H Day 4: you stay signed in after closing the app or browser (ADR 12); translated sign-in errors | `d2a49ae` |
| 43 | **Merged #76** Lane B Day 4: 14 → 11 taps to the first plan | `6c63b2a` |
| 44 | **Merged #78** Lane D Day 4: lifter-loop end-to-end test in CI; every set loggable; finish and rate a workout | `5acbeac` |
| 45 | **Merged #77** Lane A Day 4: privacy policy and terms rewritten from the data inventory; web deletion section | `7a04c58` |
| 46 | **Merged #80** Lane F Day 5: the unused Express server is gone; plans go only to your Supabase account | `bea0fb7` |
| 47 | **Merged #81** Lane E Day 7: Sign out button on Profile; sign-out syncs, warns about unsent changes, then clears this device; plans on the sync engine. Lane E's Wave 2 is done | `2b4d190` |
| 48 | **Merged #83** Lane H Day 5: status bar follows the theme, splash waits for your data, keyboard keeps the field in view, native share sheet (unverified on devices) | `8a92b6a` |
| 49 | **Merged #82** Lane B Day 5: real numbers on plan cards, logger labels, no empty Full Body day, Start Over translated, stepper names for screen readers | `354edc6` |
| 50 | **Merged #84** Lane D Day 5: named sliders, readable RIR colours, 44 px targets, Reduce Motion, muscle selector follows the theme; accessibility scan in the E2E | `9d23b1b` |
| 51 | **Merged #85** Coordinator: the Light / System / Dark crossfade is back | `35a52f1` |
| 52 | **Merged #86** Coordinator: Day 6 briefs with Day 5 carry-overs for D, F, H | `aaa63b7` |
| 53 | **Merged #87** Lane F Day 6: circle queries and plan deletions tested against the access rules; no new migration needed | `cb93576` |
| 54 | **Merged #89** Lane H Day 6: rest-over notification and workout reminders on your training days (phones only; unverified on devices) | `0ce6a64` |
| 55 | **Merged #90** Lane D Day 6: Enter in the plan builder no longer skips a step; the keyboard no longer hides Complete Set | `e88c727` |
| 56 | Lane A Day 5: Apple and Google privacy form answers and the compliance sheet (age rating, health declaration, disclaimer, deletion, encryption) | `docs/store/` (#88) |

## In progress

| What | Status |
|---|---|
| Gate 1 | **Waiting on you:** L10 (staging Supabase) and L11 (email-code template). Everything else for Gate 1 is merged |
| Lane C Day 4 (#75) | **Waiting on you:** OK the contract #9 `$pageview` change |
| Store forms | **Waiting on you:** the questions in `docs/store/APPLE_PRIVACY.md`, `GOOGLE_DATA_SAFETY.md` and `COMPLIANCE.md` (Health, minimum age, L6 keys, domain, support email). Google's wording couldn't be checked from here |

## Next up, in order

0. **Day 6 left:** listing copy and screenshots (Lane A). Then Day 7: v1.1.0 (A), audit gate (D), Android CI (H).
1. **Gate 1 (you):** create the staging Supabase project and apply migrations 001–008 (repair 001–006 first; steps in `docs/SUPABASE_MIGRATIONS.md`), add the email-code template (`docs/IOS_DEVELOPMENT.md`, "Auth email"), deploy `delete-account` (its README), then run the checklist in `BOARD.md`.
2. **Wave 2 / Day 4 for each lane** after Gate 1: privacy policy (A), fewer taps to a first plan (B), analytics (C), end-to-end test (D), deletion UI and export v3 (F), lasting sessions (H).
3. **Lane E Day 7:** sync before sign-out with an unsent-changes warning, then clear the device; move plans onto the sync engine.

## Still remaining

### Wave 1: Foundations (Days 1–3)
- [x] Day 1 for all lanes (A, B, C, D, E, F, H), all merged
- [x] E2 and E3 (Lane E is running ahead)
- [x] A2 iOS docs; data inventory
- [x] A3 Wave 1 bookkeeping
- [x] B2 Language picker
- [x] B3 Empty states
- [x] C2 Coach mode off everywhere
- [x] C3 Crash reporting
- [x] D2 Dead code
- [x] D3 PDF export fixes
- [x] F2 Access-rule fixes (migration 008)
- [x] F3 Delete-account function
- [x] H2 Self-hosted fonts and API hardening
- [x] H3 Sign in with an email code
- [ ] **Gate 1:** beta smoke test; staging database (code side checked; needs L10, L11)

### Wave 2: Sync, accounts, native, observability (Days 4–7)
- [x] Sync engine core (Lane E Day 4)
- [x] Sync collections (Lane E Day 5)
- [x] Sync triggers, first upload, Profile indicator (Lane E Day 6)
- [x] Sync on sign-out, plans on the engine (Lane E Day 7, #81); sign-out now clears device data
- [x] Account deletion in the app (Lane F, #73; the function is deployed at L10)
- [ ] Sessions that last (✅ #74); native plugins (✅ #83); notifications (✅ #89)
- [ ] Analytics and consent (Lane C, #75 open); end-to-end test (✅ #78) and accessibility part 1 (✅ #84)
- [ ] Privacy policy (✅ #77), store forms (#88), listing copy (Lane A Day 6)
- [x] Express retired (Lane F Day 5, #80)
- [ ] **Gate 2:** production database, v1.1.0 to `main`, first store test builds (needs L4)

### Wave 3: Devices, translation, submission prep (Days 8–10)
- [ ] Real-device testing and fixes (Lane H with Lincoln)
- [ ] Spanish translation of the lifter screens (Lanes J1, J2)
- [ ] Readiness rubric, screenshots, submission checklist (Lane A)
- [ ] **Gate 3:** submit to the stores

### Wave 4: Desktop (Days 11–12)
- [ ] Desktop PWA pass, Microsoft Store package, macOS wrapper (Lane H)

## Lincoln's items

| Item | Status |
|---|---|
| L0 Merge Day 0 | ✅ Done |
| D1–D6 Decisions | ✅ Acknowledged; defaults apply |
| L12 Review and merge PRs | ✅ Wave 1 merged (#44–#69), reviewed and merged on your instruction |
| L4 Apple and Google developer enrollment | ⏸ Deferred. Start at least a week before Gate 2, because the first store uploads and the 14-day Play test need it |
| L10 Staging Supabase project | ⬜ Needed for Gate 1. **Before the first `supabase db push`, run `supabase migration repair --status applied 001 … 006`** (DEBT-053; steps in `docs/SUPABASE_MIGRATIONS.md`) |
| L11 Email code in the Supabase email template | ⬜ Needed when Lane H Day 3 lands |
| First native build on a Mac and in Android Studio | ⬜ Checks Lane H's release settings: code shrinking, signing, privacy manifest |
| L1 Revoke the old Supabase key | ⬜ |
| L3 Domain | ⬜ When it's set up, add it to `ALLOWED_ORIGINS` in Vercel, or `/api` calls from it are refused (DEBT-075) |
| L5 Name and trademark search | ⬜ |
| L6 Sentry and PostHog accounts | ⬜ |
| L2 Production database migrations | ⬜ Before Gate 2 |
| L7 Test devices | ⬜ Day 8 |
| L8 Android testers | ⬜ Before Gate 2 |
| L9 Legal review | ⬜ Days 8–10 |

## Open questions for Lincoln
Each has a default that applies unless you change it.
1. Weekly progress counts **finished workouts**, with the goal set from your plan's days per week. (Default: yes.)
2. ~~Signing out keeps training data on the device until cloud sync exists.~~ **Superseded by #81:** sign-out now syncs first, warns about unsent changes, then clears the device.
3. Lane D's icons are about 70 KB against a 60 KB target, because going smaller visibly bands the gradient. (Default: keep them.)
4. Lane H asks whether to lock Android to portrait as well, to match iOS. (Default: yes. **Done** in #60.)
5. **Which region is your Supabase project in?** It goes in the privacy policy. (No default; Lane A leaves a placeholder.)
6. `.claude/*.md` is now owned by Lane A. (Default: yes; applied.)
7. The `/api` rate limit is 60 requests a minute per IP. (Default: keep 60.)
8. People who share a circle can see each other's whole profile row (goal, experience, timezone). (Default: yes; revisit when Circles turns on.)
9. When a circle's creator deletes their account, the circle stays for its other members. (Default: yes.)
10. Coach mode switched on before the flag existed is switched off and isn't restored if coach is turned on later. (Default: acceptable.)
11. **Store forms:** declare body measurements, nutrition and readiness as **Health** as well as Fitness? (Default: yes; then Lane H updates the iOS privacy manifest.)
12. **Minimum age:** 13? (No default; the policy says "13 [Lincoln to confirm]".)
13. **Support email** for the privacy policy and Play's deletion page. (No default; must not be a personal address.)
