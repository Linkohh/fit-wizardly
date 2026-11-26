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
| **A** | ✅ PR #47 · 0.9 Fix `CLAUDE.md`; add stale-doc banners; handle `AGENTS.md` (D6) | ✅ PR #56 · 0.9 Merge iOS docs; draft `docs/store/DATA_INVENTORY.md` | ✅ PR #63 (`f983e20`) · Inventory, golden path, README, 1.1.0 notes draft; Gate 1 checklist; all Wave 1 handoffs folded in |
| **B** | ✅ PR #51 · 0.1 AI claim (except `vite.config.ts`); 0.5 fake content | ✅ PR #55 · 0.4 Language picker; `pt.json` duplicate key; Profile labels | ✅ PR #68 (`421a453`) · 3.6a Empty states (History, Analytics, Nutrition); `<html lang>` (DEBT-063); DEBT-062 |
| **C** | ✅ PR #49 · 0.2 part 1: routes, every nav entry point, flag tests | ✅ PR #58 · 0.2 part 2: coach toggles, onboarding skip, `trainerStore`, badge filter | ✅ PR #69 (`57e92ac`) · 3.1 Sentry (`monitoring.ts`, `main.tsx`, `ErrorBoundary`, per-route boundaries, CSP); consent-order fix |
| **D** | ✅ PR #52 · 0.7 Icons, logo, PWA runtime caching, manifest text | ✅ PR #54 · 0.8 knip cleanup, deletions, ESLint ignores | ✅ PR #67 (`3d95fed`) · 3.6b PDF export fixes (doubled day titles, wrapped headers, emoji); DEBT-074; bundle baseline (DEBT-078) |
| **E** | ✅ 1.1 `appStorage`, `HydrationGate`, date reviver (trial lane; PR #45, `5984b86`) | ✅ 1.2 part 1: plan and measurement stores; 0.3 counters; circles gate (PR #46, `803842e`) | ✅ 1.2 part 2: other stores, localStorage copy, `clearSensitiveStorage`, ADR 11 (PR #53, `7ef77e5`) |
| **F** | ✅ PR #50 · Supabase CLI, local Postgres harness, naming check; 1.3 migration 007 and types | ✅ PR #57 · 1.6 migration 008 and policy tests | ✅ PR #65 (`521be87`) · 1.5 part 1: `delete-account` function (contract #4), cascade check, `SECURITY.md` rewrite |
| **H** | ✅ PR #48 · 0.6 name; 2.5/2.6 native project fixes | ✅ PR #60 · 2.5 self-hosted fonts and CSP; 2.3 `apiBase` and API hardening | ✅ PR #62 (`4b3bb21`) · 2.1 Email-code sign-in (contract #7); iPhone live reload (DEBT-058) |


### Gate 1 checklist (Lincoln, end of Day 3)
- [x] All Wave 1 PRs merged (#44–#69, plus docs #70). Verified 2026-11-20: every lane's Day 1–3 deliverable is present in the code
- [x] CI green on `preview_b` (`aed5017`: 1056/1056 tests, lint 0 errors, typecheck, build, DB harness)
- [ ] Migrations 007 and 008 applied to the **staging** Supabase project (L10)
- [ ] Beta site: the words "AI-powered" appear nowhere (page title, install prompt, About, Guide). *Passed on a local production build; Lincoln confirms on the beta URL*
- [ ] Beta site: no menu, command palette or URL reaches Circles, Clients, Templates or Revenue. *Passed locally: all four URLs show 404*
- [ ] Beta site as a guest: build a plan, log one workout, log one meal, close the tab, reopen. All three are still there
- [ ] Beta site: sign in with the 6-digit email code (after L11)
- [ ] Beta site: load once, go offline, reload. The app opens. *Passed locally*
- [ ] Bugs found are filed as buffer tasks for the relevant lanes

---

## Wave 2: Sync, accounts, native, observability (Days 4–7)

| Lane | Day 4 | Day 5 | Day 6 | Day 7 |
|---|---|---|---|---|
| **A** | ✅ PR #77 (`7a04c58`) · 4.1 Privacy policy and terms rewritten from the inventory, web deletion section `#delete-account`; draft for L9 | ✅ PR #88 (`5a5b678`) · 4.2 Store form answer sheets (`APPLE_PRIVACY.md`, `GOOGLE_DATA_SAFETY.md`, `COMPLIANCE.md`); Days 5–6 handoffs folded in | 🔵 PR #___ · 4.3 Listing copy (`docs/store/LISTING.md`); `scripts/store-screenshots.mjs` (24 screenshots, 4 sizes, copy check); Day 7 of D and H and #93 folded in | ⬜ 1.8 v1.1.0 changelog and version bumps; Gate 2 checklist |
| **B** | ✅ PR #76 (`6c63b2a`) · 3.6c Fewer taps to the first plan (14 → 11) | ✅ PR #82 (`354edc6`) · Buffer: plan card numbers, logger strings, no empty Full Body day and fair session volume, Start Over i18n, stepper names (DEBT-105, 106, 108, 102 closed) | ➖ | ➖ |
| **C** | 🔵 PR #75 · 3.2 `track()` and PostHog EU adapter; wire events. **Held for Lincoln's OK on the contract #9 `$pageview` change** | ⬜ Consent entries; disclosure text to Lane A (after #75) | ⬜ Error-boundary tests; source maps (if L6 done) | ➖ |
| **D** | ✅ PR #78 (`5acbeac`) · 3.5 Playwright lifter loop with reload; `e2e` and `edge-functions` CI jobs; finish-workout and set-logger fixes; `vendor-sentry` chunk (DEBT-091) | ✅ PR #84 (`9d23b1b`) · 3.4 part 1: named sliders, RIR contrast, 44 px targets, `MotionConfig`, MCL theme (DEBT-020 targets, DEBT-021, DEBT-107 closed); axe scan in the E2E | ✅ PR #90 (`e88c727`) · 3.4 Wizard Enter key (DEBT-025 closed); `useKeyboard()` in SetLogger; stepper allow-list entry removed | ✅ PR #91 (`b7dc219`) · 4.5 `audit` CI job (`npm audit --audit-level=high`, passing after #93); Dependabot (weekly npm and Actions); DEBT-129 closed |
| **E** | ✅ PR #59 (`0513fd0`) · 1.4 part 1: sync engine, outbox, tests; 3 review findings fixed | ✅ PR #64 (`a621a4f`) · 1.4 part 2: seven collections and change tracking | ✅ PR #66 (`12fbcbb`) · 1.4 part 3: triggers, first sign-in upload, indicator; 2 review findings fixed | ✅ PR #81 (`2b4d190`) · 1.4 part 4: safe sign-out (sync, warn, erase; DEBT-045 closed); plans on the engine; 2 review findings fixed. **Lane E's Wave 2 is done** |
| **F** | ✅ PR #73 (`1708d12`) · 1.5 part 2: deletion UI, guest erase, export v3 (DEBT-059 closed) | ✅ PR #80 (`bea0fb7`) · 1.7 Express retired (D1): `server/`, `apiClient`, CI server steps and dev proxy removed | ✅ PR #87 (`cb93576`) · Circle query shapes and plans tombstones tested under 008; no 009 needed | ➖ Buffer |
| **H** | ✅ PR #74 (`d2a49ae`) · 2.2 Session storage adapter; ADR 12; DEBT-079, DEBT-085 | ✅ PR #83 (`8a92b6a`) · 2.4 part 1: status bar, splash, keyboard and share helpers (contract #10); native unverified on devices | ✅ PR #89 (`0ce6a64`) · 2.4 part 2: local notifications (rest timer, workout reminders); native unverified on devices | ✅ PR #92 (`2d63859`) · 4.5 `android` CI job (release `.aab`, signed when the 4 secrets exist); `docs/RELEASE_MOBILE.md`; privacy manifest (DEBT-126) and `ITSAppUsesNonExemptEncryption` (DEBT-128) closed; Android compile fix |

**Also merged in Wave 2:** coordinator PR #85 (`35a52f1`), the Light / System / Dark crossfade restored (`src/lib/themeFade.ts`); #86 (`aaa63b7`), Day 6 briefs with the Day 5 carry-overs for D, F and H; and #93 (`fe4789f`), the 3 critical and 11 high npm advisories fixed (Capacitor ^8.6.3, react-router-dom ^7.18.7, transitive packages re-resolved with npm 10) so #91's audit gate passes.

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
| L9 | Legal review of privacy policy and terms | Days 8–10 | ⬜ Draft ready (Lane A Day 4): [`docs/privacy-policy.md`](../privacy-policy.md). First fill in its placeholders table |
| L12 | Review and merge PRs daily, in merge order | Daily | 🟡 Wave 1 / Day 1 (#47–#53) and Day 2 (#54–#60) merged on Lincoln's instruction |

## Open decisions

| ID | Decision | Default | Needed by | Answer |
|---|---|---|---|---|
| D1 | Retire the Express server? | Yes | Day 5 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D2 | Keep users signed in across restarts? | Yes | Day 4 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D3 | Launch languages | English and Spanish | Day 2 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D4 | iPhone only (no iPad) for v1? | Yes | Day 1 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D5 | Analytics tool | PostHog EU | Day 4 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
| D6 | Keep `AGENTS.md` / context-mode? | No, delete it | Day 1 | Default applies (acknowledged 2026-11-17, not individually confirmed) |
