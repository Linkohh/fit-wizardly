# FitWizard Launch Project: how it runs

This folder turns [`docs/LAUNCH_ROADMAP.md`](../LAUNCH_ROADMAP.md) into a schedule that several AI agents can work through **at the same time** without overwriting each other.

| File | Purpose |
|---|---|
| [`CHECKLIST.md`](CHECKLIST.md) | The running quick view: done, in progress, next up, remaining |
| [`BOARD.md`](BOARD.md) | Day-by-day schedule, task checkboxes, gate checklists. Only Lane A edits it |
| [`CONTRACTS.md`](CONTRACTS.md) | Interfaces shared between lanes. Code against these, even before the provider merges |
| [`lanes/`](lanes/) | One brief per lane, with step-by-step tasks and a definition of done for each day |
| [`handoffs/`](handoffs/) | One note per lane per day. [`TEMPLATE.md`](handoffs/TEMPLATE.md) shows the format |

## Terms

- **Lane:** a stream of work done by one AI agent. Each lane owns a fixed set of files and has its own task list.
- **Day:** one agent working session, ending in **one** pull request into `preview_b`. That is about 3 to 6 hours of agent time, not a calendar day.
- **Wave:** a group of days. Every lane merges before the next wave starts, and then the merged result is tested at a **gate**.

## Lanes

| Lane | Name | Mission | Active | Brief |
|---|---|---|---|---|
| **A** | Docs & Release | Accurate docs, legal and store paperwork, changelog and versions, folding handoffs into the board and log | Days 1–10 | [LANE-A](lanes/LANE-A.md) |
| **B** | Honesty & First-Run | Remove false claims and fake content, fix the language picker, add empty states, shorten the path to a first plan | Days 1–5 | [LANE-B](lanes/LANE-B.md) |
| **C** | App Shell & Observability | Feature flags and routing, then crash reporting, analytics and consent | Days 1–6 | [LANE-C](lanes/LANE-C.md) |
| **D** | Assets, Cleanup & QA | Shrink images, remove dead code, fix PDF export, add end-to-end tests, accessibility, CI gates | Days 1–9 | [LANE-D](lanes/LANE-D.md) |
| **E** | Data | Device storage, persisted stores, achievement counters, sync engine | Days 1–9 | [LANE-E](lanes/LANE-E.md) |
| **F** | Database & Accounts | Supabase CLI, migrations 007 and 008, account deletion, retiring Express | Days 1–7 | [LANE-F](lanes/LANE-F.md) |
| **H** | Native | App name, iOS and Android projects, fonts, API base, email-code sign-in, sessions, plugins, device fixes, Android CI, desktop | Days 1–12 | [LANE-H](lanes/LANE-H.md) |
| **J1, J2** | Translation | Move hardcoded text into i18n and complete Spanish, split by folder | Days 8–10 | [LANE-J](lanes/LANE-J.md) |
| **L** | Lincoln (human) | Accounts, dashboards, decisions, reviewing and merging, device testing, store uploads | Throughout | [LANE-L](lanes/LANE-L.md) |

There is no Lane G or Lane I. Those letters were folded into E and C during planning.

### Running fewer agents

Review is the real bottleneck: seven lanes produce about seven PRs a day for one reviewer. **The recommendation is 4 agents.** Combine lanes and run each combined agent's days back to back, in lane order:

| Agents | Grouping |
|---|---|
| 4 (recommended) | A+B · C+D · E+F · H |
| 3 | A+B+D · C+H · E+F |

With fewer agents, coding takes about 2 to 2.5 times as many days. The gates stay the same.

---

## Rules for every agent

1. **Read first:** `CLAUDE.md`, the "Common Gotchas" section of `docs/SESSION_LOG.md`, this file, `CONTRACTS.md`, and your lane brief. Until Lane A's Day 1 lands, treat the older lens docs (`ENGINEERING.md`, `SECURITY.md`, `ORCHESTRATION.md` and the others) as unreliable. The README and the roadmap are accurate.
2. **Setup:** Node 22, then `npm ci`. Cloud sessions do not come with dependencies installed.
3. **Green before PR:** `npm run lint` (0 errors), `npm run typecheck`, `npm run test:run`. New logic gets a Vitest test beside it.
4. **UI text** goes through `t('key', 'English fallback')`. Add every new key to `en.json` and `es.json`. The ratchet in `src/test/fixtures/localeGaps.json` may shrink but must never grow.
5. **Styling:** use semantic tokens only (`bg-muted`, `text-foreground`). Tokens live in the `@theme` block of `src/index.css`. Never edit `src/components/ui/*`.
6. **Privacy (ADR 10):** new stored data or a new third party must be disclosed in `Legal.tsx` and included in `dataExport.ts`, and it needs a consent gate if data leaves the device. Lane A owns `Legal.tsx` from Wave 2, so put the disclosure text in your handoff.
7. **Never edit** `docs/SESSION_LOG.md` or `BOARD.md`. Lane A folds your handoff into them.
8. **Stay in your lane.** Edit only the files your lane owns in the current wave (table below). If you find a bug in someone else's file, write it in your handoff and don't fix it.
9. **No secrets in code or docs.** Keys go in Vercel or Supabase settings. Anything prefixed `VITE_` is public.

## File ownership

You may edit **only** files your lane owns in the current wave, plus the listed exceptions. Where a lane brief's "Owns" list names a specific file or day exception (for example Lane H writing `docs/RELEASE_MOBILE.md`, or Lane F rewriting `docs/SECURITY.md`), the brief is the authority for that file. Some files are split between two lanes; those lanes edit separate, non-overlapping parts, which Git merges cleanly.

| Area / file | Wave 1 (Days 1–3) | Wave 2 (Days 4–7) | Wave 3+ (Days 8–12) |
|---|---|---|---|
| `src/App.tsx` | C. E does not edit it; `HydrationGate` goes in `main.tsx` | C. Exceptions: E may edit the sign-in sync effect (around lines 345–349); D may add `MotionConfig`; H mounts `useStatusBarTheme()` (one line, Day 5) | D |
| `src/main.tsx` | E on Day 1, then C on Day 3 (Sentry init). Exception: H adds one font import line on Day 2 | C | — |
| `src/stores/*`, `src/lib/storage/*`, `src/lib/sync/*`, `src/lib/offlineSave.ts`, `src/lib/plans/*` | E. Exceptions: C owns `trainerStore.ts` and `onboardingStore.ts` (E leaves both alone) | E (F edits `plansClient.ts` on Day 5 only, for Express removal) | E |
| `src/stores/authStore.ts` | H: sign-in actions (around line 228 onward). E: `clearSensitiveStorage` only (lines 58–70) | H. F may add one deletion call | H |
| `src/lib/supabase.ts`, `capacitor.config.ts`, `ios/`, `android/`, `api/`, `resources/` | H | H | H |
| `index.html` | B: meta tags (Day 1). H: fonts block (Day 2) | H | H |
| `src/pages/Wizard.tsx` | E: counter call only | B: step reductions (Day 4). D: Enter key (Day 6) | — |
| `src/pages/Profile.tsx` | B: language, units and theme block. C: coach toggle | F: account block. E: sync indicator. H: reminders block | J |
| `src/components/Header.tsx`, `src/components/header/*`, `CommandPalette.tsx`, `NotFound.tsx`, `UserGuide.tsx`, `src/contexts/navigation-direction-context.tsx` | C. Exceptions: D changes the logo `src` (around line 558); B edits AI wording in `UserGuide.tsx` on Day 1 | C | J |
| `src/components/auth/*` | H | H | H |
| `src/components/account/*`, `src/lib/account/*` | — | F (new on Day 4, #73) | F |
| `vite.config.ts`, `public/` | D | F removes the dev proxy (Day 5) | — |
| `vercel.json` | H (Day 2, fonts CSP), then C (Day 3, Sentry) | C | — |
| `supabase/**`, `src/types/supabase.ts` | F | F | F |
| `server/`, `.github/workflows/*` | Nobody | F removes server steps (Day 5). D adds jobs (Days 4, 7). H adds the Android job (Day 7) | H, D |
| `src/pages/Legal.tsx`, `README.md`, `CLAUDE.md`, `.claude/*.md` (from Day 3), `docs/**` (except `DECISIONS.md`) | A. Exception: B edits AI wording in `Legal.tsx` on Day 1 | A | A |
| `docs/DECISIONS.md` | Append only (E adds ADR 11) | Append only (H adds ADR 12) | Append only |
| `src/lib/dataExport.ts` | — | F | — |
| `src/components/legal/ConsentModal.tsx` | B: AI wording on line 126 only (Day 1) | C | — |
| `src/lib/pdfExport.ts` | D (Day 3) | — | — |
| `src/components/logging/*` | D: `SetLogger.tsx` touch targets (Wave 2) | D: `SetLogger.tsx`. H: `RestTimer.tsx` and `WorkoutSummary.tsx` share block | J1 |
| `src/features/mcl/*` | — | D: accessibility items | J2 |
| `src/locales/*.json` | Anyone, **inside their own key namespace only**. B owns `tagline` | Same | J1 and J2, by namespace |
| `package.json` and lockfile | Anyone may add dependencies (see conflict rule 1). H owns `name` and `scripts` | Same | Same |
| `.env.example` | Add your variables in a labelled block | Same | Same |

## Conflict rules

1. **Lockfile:** never hand-merge `package-lock.json`. On conflict, take `preview_b`'s version, then run `npm install <your packages>` again and commit.
2. **Locales:** add keys only inside your own namespace object (for example `featureFlags.*`, `sync.*`). On conflict, keep both sides. **Never rewrite a locale file through a JSON parser** (Python `json`, `JSON.parse` + `JSON.stringify`). `pt.json` has a duplicate `"wizard"` key, and parsers silently drop the first copy. Edit the text directly and check that `git diff` shows only your lines.
3. **New locale namespaces:** add a new top-level namespace (for example `"pdfExport": { … }`) **in alphabetical order among the top-level keys** of each locale file, never appended at the end. Appending at the end makes every lane's PR conflict on the same closing lines (four PRs collided there in Wave 1 / Day 3). Keys inside an existing namespace keep their current order. The parser rule above still applies: insert the block as text.
4. **`.env.example`:** add variables in your own labelled block. On conflict, keep both.
5. **Rebase** onto `origin/preview_b` just before opening the PR, and again if Lincoln asks after an earlier merge.
6. **One PR per lane per day.** Title: `[Lane X · Day N] short summary`. Link the handoff note in the body.
7. **Missing contract:** if a contract you need hasn't merged yet, code against the shape in `CONTRACTS.md` with a local stub, and say so in your handoff. Don't wait, and don't redefine it.
8. **Changing a published contract** needs a handoff note and Lincoln's OK before merge.
9. **Finished early?** Write up next-day prep in your handoff. Do not start another lane's work.

## Daily cycle

1. Lincoln starts each lane session with the kickoff prompt below, or from its task card.
2. The agent creates its branch and installs dependencies:

   ```sh
   git fetch origin preview_b
   git checkout -b lane-x/day-n origin/preview_b
   npm ci
   ```

3. The agent does that day's tasks from its lane brief and gets lint, typecheck and tests green.
4. The agent writes `docs/project/handoffs/YYYY-MM-DD-lane-x-day-n.md` from the template, pushes, and opens the PR.
5. Lincoln reviews and merges in **merge order: F → E → C → H → B → D → J → A**. The database goes first so data code builds on it; docs go last so they describe what actually merged. If a PR conflicts after an earlier merge, its agent rebases.
6. Lane A's last PR of the day folds that day's handoffs into `docs/SESSION_LOG.md` and `BOARD.md`.

## Kickoff prompt

Copy this into a new Claude Code session. Replace `{X}`, `{N}` and `{x}`.

```text
You are the Lane {X} agent for FitWizard, working on Day {N} of the launch project.

1. Read CLAUDE.md, docs/project/README.md, docs/project/CONTRACTS.md and
   docs/project/lanes/LANE-{X}.md. The README and docs/LAUNCH_ROADMAP.md are
   accurate; older lens docs may be out of date.
2. Run: git fetch origin preview_b && git checkout -b lane-{x}/day-{N} origin/preview_b && npm ci
3. Do only the Day {N} tasks in your lane brief. Edit only files your lane owns
   in this wave (see the ownership table in docs/project/README.md).
4. npm run lint (0 errors), npm run typecheck and npm run test:run must pass.
5. Write docs/project/handoffs/<today>-lane-{x}-day-{N}.md from
   docs/project/handoffs/TEMPLATE.md.
6. Push and open a pull request into preview_b titled
   "[Lane {X} · Day {N}] <summary>", linking the handoff note.

If something blocks you, stub against the contract, record it in the handoff,
and finish the rest of the day's work. Do not edit docs/SESSION_LOG.md or
docs/project/BOARD.md.
```

## Gates

The checklists are in [`BOARD.md`](BOARD.md).

| Gate | When | Purpose |
|---|---|---|
| Gate 1 | End of Day 3 | Foundations merged; beta smoke test; migrations on staging |
| Gate 2 | End of Day 7 | Sync and accounts done; production migrations; v1.1.0 to `main`; first store test builds (this starts the 14-day Play clock) |
| Gate 3 | End of Day 10 | Device checklist passed; readiness rubric at 70% or higher; submit |
