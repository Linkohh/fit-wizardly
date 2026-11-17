# Project Board

> **Only Lane A edits this file.** Other lanes report through handoff notes.
> Status key: ⬜ not started · 🟡 in progress · 🔵 PR open · ✅ merged · ⛔ blocked · ⏸ deferred · ➖ off or buffer
> **Short version:** [`CHECKLIST.md`](CHECKLIST.md) has the running done / in progress / remaining list.
> Item IDs (for example `0.2`) refer to [`docs/LAUNCH_ROADMAP.md`](../LAUNCH_ROADMAP.md) §3. Step-by-step instructions are in [`lanes/`](lanes/).

## Day 0: Setup (this session)

| Task | Status |
|---|---|
| README rewrite, launch roadmap, project folder (board, contracts, lane briefs, handoff template) | ✅ PR #44, merged 2026-11-17 (`79b6ebb`) |
| Feature-flag contract `src/lib/featureFlags.ts` with tests, plus `.env.example` flags | ✅ PR #44 |
| Baseline recorded: lint 0 errors / 4 warnings, typecheck clean, 795/795 client tests in 149 files, 14/14 server tests | ✅ |
| L0: Lincoln merges the Day 0 PR into `preview_b` | ✅ 2026-11-17 (merged on Lincoln's instruction after CI and the automated review passed) |

---

## Wave 1: Foundations (Days 1–3)

All seven lanes run in parallel. There are no dependencies between them.

| Lane | Day 1 | Day 2 | Day 3 |
|---|---|---|---|
| **A** | 🔵 PR #47 · 0.9 Fix `CLAUDE.md`; add stale-doc banners; handle `AGENTS.md` (D6) | ⬜ 0.9 Merge iOS docs; draft `docs/store/DATA_INVENTORY.md` | ⬜ Fold Wave 1 handoffs into the log and board; Gate 1 checklist |
| **B** | 🔵 PR #51 · 0.1 AI claim (except `vite.config.ts`); 0.5 fake content | ⬜ 0.4 Language picker; `pt.json` duplicate key; Profile labels | ⬜ 3.6a Empty states (History, Analytics, Nutrition) |
| **C** | 🔵 PR #49 · 0.2 part 1: routes, every nav entry point, flag tests | ⬜ 0.2 part 2: coach toggles, onboarding skip, `trainerStore`, badge filter | ⬜ 3.1 Sentry (`monitoring.ts`, `main.tsx`, `ErrorBoundary`, per-route boundaries, CSP) |
| **D** | 🔵 PR #52 · 0.7 Icons, logo, PWA runtime caching, manifest text | ⬜ 0.8 knip cleanup, deletions, ESLint ignores | ⬜ 3.6b PDF export fixes |
| **E** | ✅ 1.1 `appStorage`, `HydrationGate`, date reviver (trial lane; PR #45, `5984b86`) | ✅ 1.2 part 1: plan and measurement stores; 0.3 counters; circles gate (PR #46, `803842e`) | 🔵 1.2 part 2: other stores, localStorage copy, `clearSensitiveStorage`, ADR 11 (Day 3 PR) |
| **F** | 🔵 PR #50 · Supabase CLI, local Postgres harness, naming check; 1.3 migration 007 and types | ⬜ 1.6 migration 008 and policy tests | ⬜ 1.5 part 1: `delete-account` function, cascade check, docs |
| **H** | 🔵 PR #48 · 0.6 name; 2.5/2.6 native project fixes | ⬜ 2.5 self-hosted fonts and CSP; 2.3 `apiBase` and API hardening | ⬜ 2.1 Email-code sign-in |

### Gate 1 checklist (Lincoln, end of Day 3)
- [ ] All Wave 1 PRs merged in merge order (F → E → C → H → B → D → A)
- [ ] CI green on `preview_b`
- [ ] Migrations 007 and 008 applied to the **staging** Supabase project (L10)
- [ ] Beta site: the words "AI-powered" appear nowhere (page title, install prompt, About, Guide)
- [ ] Beta site: no menu, command palette or URL reaches Circles, Clients, Templates or Revenue
- [ ] Beta site as a guest: build a plan, log one workout, log one meal, close the tab, reopen. All three are still there
- [ ] Beta site: sign in with the 6-digit email code (after L11)
- [ ] Beta site: load once, go offline, reload. The app opens
- [ ] Bugs found are filed as buffer tasks for the relevant lanes

---

## Wave 2: Sync, accounts, native, observability (Days 4–7)

| Lane | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|
| **A** | ⬜ 4.1 Privacy policy and terms rewrite, including web deletion section | ⬜ 4.2 Store form answer sheets | ⬜ 4.3 Listing copy; screenshot script | ⬜ 1.8 v1.1.0 changelog and version bumps; Gate 2 checklist |
| **B** | ⬜ 3.6c Fewer taps to the first plan | ⬜ Buffer: Gate 1 bugs | ➖ | ➖ |
| **C** | ⬜ 3.2 `track()` and PostHog adapter; wire events | ⬜ Consent entries; disclosure text to Lane A | ⬜ Error-boundary tests; source maps (if L6 done) | ➖ |
| **D** | ⬜ 3.5 Playwright lifter loop with reload; CI job | ⬜ 3.4 RIR labels, 44 px targets, `MotionConfig`, DEBT-021 | ⬜ 3.4 Wizard Enter key (DEBT-025) | ⬜ 4.5 `npm audit` gate; Dependabot |
| **E** | ⬜ 1.4 part 1: sync engine, outbox, tests | ⬜ 1.4 part 2: six collections | ⬜ 1.4 part 3: triggers, first sign-in upload, indicator | ⬜ 1.4 part 4: plans move onto the engine |
| **F** | ⬜ 1.5 part 2: deletion UI, guest erase, export v3 | ⬜ 1.7 Retire Express (D1) | ⬜ Circles queries checked against migration 008 | ➖ Buffer |
| **H** | ⬜ 2.2 Session storage adapter; ADR 12 | ⬜ 2.4 part 1: preferences, status bar, splash, keyboard, share | ⬜ 2.4 part 2: local notifications | ⬜ 4.5 Android CI job; iOS archive guide |

### Gate 2 checklist (Lincoln, end of Day 7)
- [ ] All Wave 2 PRs merged in merge order; CI green, including the Playwright job
- [ ] Production migrations checked and applied (L2), including 007 and 008
- [ ] Two devices, same account: log a workout on phone A and it appears on phone B
- [ ] Offline: log a workout in airplane mode, reconnect, and it uploads
- [ ] Delete a test account; the Supabase table editor shows no rows for that user in any table
- [ ] Still signed in after closing and reopening the app
- [ ] `preview_b` merged into `main`; tagged `v1.1.0`
- [ ] Android build uploaded to the **Play closed test** (the 14-day clock starts) and iOS to **TestFlight internal**

---

## Wave 3: Devices, translation, submission prep (Days 8–10)

| Lane | Day 8 | Day 9 | Day 10 |
|---|---|---|---|
| **A** | ⬜ Final privacy text; send for review (L9) | ⬜ Screenshots and listing | ⬜ 4.6 Readiness rubric; v1.2.0 notes; submission checklist |
| **D** | ⬜ Device-test triage with H; Playwright regressions | ⬜ Regressions | ➖ |
| **E** | ⬜ Sync fixes from device testing | ⬜ Buffer | ➖ |
| **H** | ⬜ 2.7 Device checklist with Lincoln; fixes | ⬜ Device fixes | ⬜ Release build docs; v1.2.0 native version bump |
| **J1** | ⬜ 3.3 `components/logging`, `components/analytics` moved to `t()` | ⬜ Spanish for those keys | ⬜ Locale-parity ratchet update |
| **J2** | ⬜ 3.3 `components/nutrition` and untranslated pages moved to `t()` | ⬜ `features/mcl` UI (DEBT-019) | ⬜ Spanish for those keys |

### Gate 3 checklist (Lincoln, end of Day 10)
- [ ] Readiness rubric (`docs/readiness-rubric.md`) at 70% or higher
- [ ] Every item on the device checklist (LANE-H, Day 8) passes on a real iPhone and Android phone
- [ ] The app is fully usable in Spanish on the lifter screens
- [ ] Privacy policy reviewed (L9) and live at `/legal`
- [ ] iOS submitted for review
- [ ] Android production submission scheduled for when the 14-day closed test ends

---

## Wave 4: Desktop (Days 11–12)

| Lane | Day 11 | Day 12 |
|---|---|---|
| **H** | ⬜ Desktop PWA pass (1280 px and wider, keyboard); PWABuilder Microsoft Store package | ⬜ Tauri 2 wrapper; Tauri branch in `appStorage`; docs |

---

## Lincoln's tasks

Full detail is in [`lanes/LANE-L.md`](lanes/LANE-L.md).

| ID | Task | Due | Status |
|---|---|---|---|
| L0 | Merge Day 0 PR; start Wave 1 lanes | Day 0 | ✅ PR #44 merged. Lane E started first as a trial; other lanes wait until the trial is reviewed |
| D1–D6 | Answer the open decisions (defaults apply otherwise) | Days 1–5 | ✅ Acknowledged 2026-11-17: defaults apply unless Lincoln changes one |
| L1 | Revoke the legacy Supabase key (SEC-001) | Day 1 | ⬜ |
| L4 | Apple Developer and Google Play Console enrolment; create app records | Deferred | ⏸ Deferred by Lincoln (2026-11-17) until store work is near. **Effect:** Gate 2's TestFlight and Play uploads, and the 14-day Play test, can't start until enrolment is approved, so Android launch moves back by however long enrolment is deferred |
| L3 | Domain for the app | Day 2 | ⬜ |
| L5 | Name and trademark search | Day 3 | ⬜ |
| L6 | Sentry and PostHog accounts; keys in Vercel | Day 3 | ⬜ |
| L10 | Staging Supabase project | Day 3 | ⬜ |
| L11 | Supabase email template with `{{ .Token }}` | Day 3 | ⬜ |
| L8 | Recruit 12 or more Android testers | Day 7 | ⬜ |
| L2 | Production migrations | Gate 2 | ⬜ |
| L7 | iPhone, Android phone, and a Mac with Xcode available | Day 8 | ⬜ |
| L9 | Legal review of privacy policy and terms | Days 8–10 | ⬜ |
| L12 | Review and merge PRs daily, in merge order | Daily | ⬜ |

## Open decisions

| ID | Decision | Default | Needed by | Answer |
|---|---|---|---|---|
| D1 | Retire the Express server? | Yes | Day 5 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D2 | Keep users signed in across restarts? | Yes | Day 4 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D3 | Launch languages | English and Spanish | Day 2 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D4 | iPhone only (no iPad) for v1? | Yes | Day 1 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D5 | Analytics tool | PostHog EU | Day 4 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D6 | Keep `AGENTS.md` / context-mode? | No, delete it | Day 1 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
