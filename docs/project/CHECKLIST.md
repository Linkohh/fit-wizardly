# Running checklist

> The quick view: what's done, what's in progress, and what's left. It's updated after every step.
> `BOARD.md` has the full day-by-day grid and the gate checklists; this page is the short version.
> **Last updated:** 2026-11-17, after Wave 1 / Day 1 merged (#47–#53).

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
| 17 | **Merged #53** Lane E Day 3: nutrition, readiness, achievements and custom exercises saved on the device; erase-all; sign-out keeps data; ADR 11; 2 review findings fixed | (this PR) |
| 18 | Final combined check: 891/891 tests, lint, typecheck and build. Browser checks pass: no AI wording, Circles hidden, coach pages 404, plan and achievements survive reload, nothing stored in localStorage | This session |
| 19 | Each lane's carry-over items written into its next brief; new issues DEBT-046 to DEBT-057 logged | Lane briefs, `SESSION_LOG.md` |

## In progress

| What | Status |
|---|---|
| Wave 1 / Day 2 for lanes A, B, C, D, F, H | Starting next, as six parallel sessions |
| Lane E Day 4: sync engine core | Starting next, in this session |

## Next up, in order

1. **Day 2 for each lane**
   - A: iOS docs, data inventory, `.claude/` audit
   - B: language picker, auth-modal wording
   - C: coach mode off everywhere, onboarding, broken command-palette links
   - D: dead code, including the Wisdom UI and the unused favourites store
   - F: migration 008 access-rule fixes
   - H: self-hosted fonts, API hardening, wger through the proxy, `test:db` script
2. **Lane E Day 4:** sync engine core, and remove the 3 "Wisdom AI" badges no one can earn.
3. **Day 3 for each lane**, then **Gate 1**: a beta smoke test, plus migrations 007 and 008 on a staging Supabase project.

## Still remaining

### Wave 1: Foundations (Days 1–3)
- [x] Day 1 for all lanes (A, B, C, D, E, F, H), all merged
- [x] E2 and E3 (Lane E is running ahead)
- [ ] A2–A3 iOS docs; data inventory; Wave 1 bookkeeping
- [ ] B2–B3 Language picker; empty states
- [ ] C2–C3 Coach mode off everywhere; crash reporting
- [ ] D2–D3 Dead code; PDF export fixes
- [ ] F2–F3 Access-rule fixes (migration 008); delete-account function
- [ ] H2–H3 Self-hosted fonts and API hardening; sign in with an email code
- [ ] **Gate 1:** beta smoke test; staging database

### Wave 2: Sync, accounts, native, observability (Days 4–7)
- [ ] Cloud sync engine (Lane E, Days 4–7); after this, account sign-out can clear device data
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
| L12 Review and merge PRs | ✅ Wave 1 / Day 1 merged (#44–#53) |
| L4 Apple and Google developer enrollment | ⏸ Deferred. Start at least a week before Gate 2, because the first store uploads and the 14-day Play test need it |
| L10 Staging Supabase project | ⬜ Needed for Gate 1. **Before the first `supabase db push`, run `supabase migration repair --status applied 001 … 006`** (DEBT-053; steps in `docs/SUPABASE_MIGRATIONS.md`) |
| L11 Email code in the Supabase email template | ⬜ Needed when Lane H Day 3 lands |
| First native build on a Mac and in Android Studio | ⬜ Checks Lane H's release settings: code shrinking, signing, privacy manifest |
| L1 Revoke the old Supabase key | ⬜ |
| L3 Domain | ⬜ |
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
4. Lane H asks whether to lock Android to portrait as well, to match iOS. (Default: yes, on Lane H Day 2.)
