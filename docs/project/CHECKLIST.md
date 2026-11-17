# Running checklist

> **The quick view:** what's done, what's in progress, and what's left. Updated after every step.
> `BOARD.md` has the full day-by-day grid and gate checklists. This page is the short version.
> **Last updated:** 2026-11-17, after Lane E Day 2.

## Done

| # | When | What | Where |
|---|---|---|---|
| 1 | 2026-11-17 | Full review of the app: code, docs, database, native projects, CI | `docs/LAUNCH_ROADMAP.md` §1 |
| 2 | 2026-11-17 | README rewritten (what FitWizard is, how it's used, honest feature status) | `README.md` |
| 3 | 2026-11-17 | Launch plan split into parallel lanes, days and waves, with one brief per lane | `docs/project/` |
| 4 | 2026-11-17 | Feature flags so Circles and the coach portal can be hidden (off by default) | `src/lib/featureFlags.ts` |
| 5 | 2026-11-17 | **PR #44 merged** (Day 0) | `79b6ebb` |
| 6 | 2026-11-17 | Decisions D1–D6 acknowledged (defaults apply); store enrolment (L4) deferred by Lincoln | `BOARD.md` |
| 7 | 2026-11-17 | Lane E Day 1: device storage layer and loading gate | PR #45 |
| 8 | 2026-11-17 | **PR #45 merged** (Lane E Day 1) | `5984b86` |
| 9 | 2026-11-17 | Lane E Day 2: **plans, workout logs, personal records, in-progress workouts and body measurements now survive closing the app**; streak, weekly goal and badges now work | PR (see session log) |

## In progress

| What | Status | Waiting on |
|---|---|---|
| Lane E Day 2 PR | Open, all checks green | Lincoln's review and merge |

## Next up (in order)

1. **Review and merge the Lane E Day 2 PR.**
2. **Lane E Day 3:** save nutrition, readiness check-ins, achievements, custom exercises and favourites on the device too; set what sign-out does to device data; write ADR 11.
3. **Start the other Wave 1 lanes.** Each has a task card ready (A, B, C, D, F, H). Lane B must start only after the Day 2 PR merges, because its brief changed again.

## Still remaining

### Wave 1: Foundations (Days 1–3)
- [x] E1 Device storage layer
- [x] E2 Plans, logs, PRs, in-progress workout, measurements saved; counters fixed
- [ ] E3 Remaining stores saved; sign-out behaviour; ADR 11
- [ ] A1–A3 Fix misleading docs; iOS docs; data inventory; Wave 1 bookkeeping
- [ ] B1–B3 Remove AI claim and fake content; language picker; empty states
- [ ] C1–C3 Hide Circles and coach routes; coach mode off; crash reporting
- [ ] D1–D3 Shrink assets; remove dead code; PDF export fixes
- [ ] F1–F3 Supabase tooling and migration 007; access-rule fixes (008); delete-account function
- [ ] H1–H3 App name and native fixes; self-hosted fonts and API hardening; sign in with an email code
- [ ] **Gate 1:** smoke test on the beta site

### Wave 2: Sync, accounts, native, observability (Days 4–7)
- [ ] Cloud sync engine (Lane E, Days 4–7)
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
| L4 Apple and Google developer enrolment | ⏸ Deferred. Start at least a week before Gate 2, because the first store uploads and the 14-day Play test need it |
| L1 Revoke the old Supabase key | ⬜ |
| L3 Domain | ⬜ |
| L5 Name and trademark search | ⬜ |
| L6 Sentry and PostHog accounts | ⬜ |
| L10 Staging Supabase project | ⬜ |
| L11 Email code in the Supabase template | ⬜ |
| L2 Production database migrations | ⬜ before Gate 2 |
| L7 Devices for testing | ⬜ Day 8 |
| L8 Android testers | ⬜ before Gate 2 |
| L9 Legal review | ⬜ Days 8–10 |

## Open questions for Lincoln
1. Keep weekly progress counting **finished workouts**, with the goal set from your plan's days per week? (Default: yes. From Lane E Day 2.)

Resolved: the Lane E Day 1 contract change (hook moved to `src/hooks/`) was accepted when PR #45 merged.
