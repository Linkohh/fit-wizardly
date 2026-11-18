# Running checklist

> The quick view: what's done, what's in progress, and what's left. It's updated after every step.
> `BOARD.md` has the full day-by-day grid and the gate checklists; this page is the short version.
> **Last updated:** 2026-11-18, after #62 and #64 merged and Lane E Day 6 (sync turned on), with Wave 1 / Day 3 running.

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
| 34 | Lane E Day 6: sync turned on for signed-in users (sign-in, back online, back in the app, 2 s after a change); first sign-in backs up this device's data; Profile shows Synced / Saving / Offline / Problem. 1015/1015 tests | Day 6 PR |

## In progress

| What | Status |
|---|---|
| Wave 1 / Day 3, lanes B, C, D, F | Running in fresh sessions (the old blocked ones can be ignored) |
| Lane A Day 3 (#63) | Open; merges last, after it folds in the other Day 3 handoffs |
| Lane E Day 6: sync turned on | PR open; merge after CI and review |

## Next up, in order

1. **Day 3 for each lane** (running)
   - A: fold handoffs into the log and board; Gate 1 checklist
   - B: empty states; `<html lang>`
   - C: crash reporting (Sentry, needs L6 for a real key)
   - D: PDF export fixes; dev proxy error text
   - F: delete-account function
   - H: sign in with a 6-digit email code (needs L11)
2. **Lane E Day 7:** sync before sign-out with an unsent-changes warning, then clear the device; move plans onto the sync engine.
3. **Review and merge each Day 3 PR as it arrives**, then **Gate 1**: a beta smoke test, plus migrations 007 and 008 on a staging Supabase project (L10).

## Still remaining

### Wave 1: Foundations (Days 1–3)
- [x] Day 1 for all lanes (A, B, C, D, E, F, H), all merged
- [x] E2 and E3 (Lane E is running ahead)
- [x] A2 iOS docs; data inventory
- [ ] A3 Wave 1 bookkeeping
- [x] B2 Language picker
- [ ] B3 Empty states
- [x] C2 Coach mode off everywhere
- [ ] C3 Crash reporting
- [x] D2 Dead code
- [ ] D3 PDF export fixes
- [x] F2 Access-rule fixes (migration 008)
- [ ] F3 Delete-account function
- [x] H2 Self-hosted fonts and API hardening
- [x] H3 Sign in with an email code
- [ ] **Gate 1:** beta smoke test; staging database

### Wave 2: Sync, accounts, native, observability (Days 4–7)
- [x] Sync engine core (Lane E Day 4)
- [x] Sync collections (Lane E Day 5)
- [ ] Sync triggers, plans on the engine (Lane E, Days 6–7); after this, account sign-out can clear device data
- [ ] Account deletion in the app (Lane F)
- [ ] Sessions that last; native plugins and notifications (Lane H)
- [ ] Analytics and consent (Lane C); end-to-end test and accessibility (Lane D)
- [ ] Privacy policy, store forms, listing copy (Lane A)
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
| L12 Review and merge PRs | ✅ Wave 1 / Days 1–2 merged (#44–#60) |
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
2. **Signing out keeps training data on the device** until cloud sync exists. (Default: yes.)
3. Lane D's icons are about 70 KB against a 60 KB target, because going smaller visibly bands the gradient. (Default: keep them.)
4. Lane H asks whether to lock Android to portrait as well, to match iOS. (Default: yes. **Done** in #60.)
5. **Which region is your Supabase project in?** It goes in the privacy policy. (No default; Lane A leaves a placeholder.)
6. `.claude/*.md` is now owned by Lane A. (Default: yes; applied.)
7. The `/api` rate limit is 60 requests a minute per IP. (Default: keep 60.)
8. People who share a circle can see each other's whole profile row (goal, experience, timezone). (Default: yes; revisit when Circles turns on.)
9. When a circle's creator deletes their account, the circle stays for its other members. (Default: yes.)
10. Coach mode switched on before the flag existed is switched off and isn't restored if coach is turned on later. (Default: acceptable.)
