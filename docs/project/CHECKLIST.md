# Running checklist

> A quick view of what's done, in progress and still left. It's updated after every step.
> `BOARD.md` has the full day-by-day grid and the gate checklists; this is the short version.
> **Last updated:** 2026-11-17, after Lane E Day 3, with all six Wave 1 / Day 1 lane PRs open.

## Done

| # | What | Where |
|---|---|---|
| 1 | Full review of the app: code, docs, database, native projects, CI | `docs/LAUNCH_ROADMAP.md` §1 |
| 2 | README rewritten to explain what FitWizard is and how it's used | `README.md` |
| 3 | Launch plan split into parallel lanes, days and waves, with one brief per lane | `docs/project/` |
| 4 | Feature flags that hide Circles and the coach portal (off by default) | `src/lib/featureFlags.ts` |
| 5 | **PR #44 merged** (Day 0) | `79b6ebb` |
| 6 | Decisions D1–D6 acknowledged with their defaults; store enrolment (L4) deferred by Lincoln | `BOARD.md` |
| 7 | **PR #45 merged:** Lane E Day 1 (device storage and loading gate) | `5984b86` |
| 8 | **PR #46 merged:** Lane E Day 2. Plans, workouts, PRs, an in-progress workout and measurements now survive restarts; streak, weekly goal and badges work; resume/discard prompt for an unfinished workout | `803842e` |
| 9 | **Wave 1 / Day 1 started for lanes A, B, C, D, F and H** as six parallel agent sessions; all six finished and opened PRs | PRs #47–#52 |
| 10 | Lane E Day 3 written: nutrition, readiness, achievements and custom exercises are saved on the device; erase-all function; sign-out keeps data until cloud sync exists; ADR 11 | PR #53 |
| 11 | **Trial integration:** all seven open PRs merged together locally in the planned order. 887/887 tests, lint, typecheck and build all pass. Checked in a browser: no AI wording, Circles hidden, coach pages show 404, new logo, `public/` down from 11 MB to 4.1 MB | This session |

## In progress: waiting for Lincoln's review

All seven pass CI and have no review findings. Each merges cleanly on its own.

| PR | Lane · Day | What it does | Notes |
|---|---|---|---|
| #50 | F · 1 | Supabase CLI, local Postgres test harness, migration 007 (cloud tables for logs, nutrition, measurements, readiness) | The lane says to run `supabase migration repair` before the first `db push` (see its handoff) |
| #53 | E · 3 | Nutrition, readiness and achievements saved on the device; `clearLocalUserData`; sign-out keeps data; ADR 11 | CI passed. The automated reviewer found 2 real bugs, both now fixed and tested: a damaged save could freeze plan generation, and erasing could be undone. 861/861 tests. Merge after #50 |
| #49 | C · 1 | Circles and coach routes and links hidden behind the flags | Two of the lane's questions have defaults |
| #48 | H · 1 | App name FitWizard; iOS and Android release config; privacy manifest | Native builds are unverified; they need your Mac and Android Studio |
| #51 | B · 1 | AI claims removed; fake exercise badges and blocked meal images removed | **Conflicts with #53 in three translation files** (both added keys at the end). It's a simple keep-both fix, tested in the trial. Whichever merges second needs it |
| #52 | D · 1 | Compressed icons, WebP logo, exercise data cached on first use | App icons are about 70 KB against a 60 KB target. The lane left that call to you |
| #47 | A · 1 | CLAUDE.md fixed, AGENTS.md deleted, out-of-date banners added | Left two links for the coordinator to fix |

**Merge order:** F (#50) → E (#53) → C (#49) → H (#48) → B (#51, after the translation fix) → D (#52) → A (#47).

## Next up, in order

1. **Lincoln reviews and merges the seven PRs above.** I can merge them once you say so, and fix the Lane B translation conflict first.
2. **Day 2 for every lane** (Wave 1 continues):
   - A: iOS docs and data inventory
   - B: language picker
   - C: coach toggles and onboarding
   - D: dead code
   - E: already ahead (Day 3 done)
   - F: migration 008 access-rule fixes
   - H: self-hosted fonts and API hardening
3. **Day 3 for every lane** except E, then **Gate 1** (beta smoke test, and migrations 007/008 on a staging Supabase project).

## Still remaining

### Wave 1: Foundations (Days 1–3)
- [x] E1 Device storage layer
- [x] E2 Plans, logs, PRs, in-progress workout and measurements saved; counters fixed
- [x] E3 Nutrition, readiness, achievements and custom exercises saved; erase-all; sign-out behaviour; ADR 11 (PR #53 open)
- [x] A1 Fix misleading docs (PR #47 open)
- [x] B1 Remove the AI claim and fake content (PR #51 open)
- [x] C1 Hide Circles and coach routes and links (PR #49 open)
- [x] D1 Shrink assets, offline cache (PR #52 open)
- [x] F1 Supabase tooling, test harness, migration 007 (PR #50 open)
- [x] H1 App name, native release config (PR #48 open)
- [ ] A2–A3 iOS docs; data inventory; Wave 1 bookkeeping
- [ ] B2–B3 Language picker; empty states
- [ ] C2–C3 Coach mode off everywhere; crash reporting
- [ ] D2–D3 Dead code (including the unused `favorites-store.ts`); PDF export fixes
- [ ] F2–F3 Access-rule fixes (migration 008); delete-account function
- [ ] H2–H3 Self-hosted fonts and API hardening; sign in with an email code
- [ ] **Gate 1:** beta smoke test; staging database

### Wave 2: Sync, accounts, native, observability (Days 4–7)
- [ ] Cloud sync engine (Lane E, Days 4–7). After this, account sign-out can clear device data
- [ ] Account deletion in the app (Lane F)
- [ ] Sessions that last, native plugins, notifications (Lane H)
- [ ] Analytics and consent (Lane C); end-to-end test and accessibility (Lane D)
- [ ] Privacy policy, store forms, listing copy (Lane A)
- [ ] **Gate 2:** production database, v1.1.0 to `main`, first store test builds (needs L4)

### Wave 3: Devices, translation, submission prep (Days 8–10)
- [ ] Real-device testing and fixes (Lane H, Lincoln)
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
| Review and merge PRs (L12) | ⏳ Seven waiting (#47–#53) |
| L4 Apple and Google developer enrolment | ⏸ Deferred. Start at least a week before Gate 2, because the first store uploads and the 14-day Play test need it |
| L10 Staging Supabase project | ⬜ Needed for Gate 1, to apply migrations 007 and 008 |
| L11 Email code in the Supabase template | ⬜ Needed when Lane H Day 3 lands |
| L1 Revoke the old Supabase key | ⬜ |
| L3 Domain | ⬜ |
| L5 Name and trademark search | ⬜ |
| L6 Sentry and PostHog accounts | ⬜ |
| L2 Production database migrations | ⬜ Before Gate 2 |
| L7 Devices for testing | ⬜ Day 8 |
| L8 Android testers | ⬜ Before Gate 2 |
| L9 Legal review | ⬜ Days 8–10 |

## Open questions for Lincoln
1. Should weekly progress count **finished workouts**, with the goal set from your plan's days per week? (Default: yes. From Lane E Day 2.)
2. Should **signing out keep training data on the device** until cloud sync exists (around Wave 2)? The alternative deletes workouts that exist nowhere else. (Default: yes. From Lane E Day 3.)
3. The lane PRs list their own questions in their handoff notes, and each has a default.
