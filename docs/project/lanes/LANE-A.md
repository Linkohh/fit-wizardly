# Lane A: Docs & Release

**Mission:** Make every document tell the truth. Produce the legal and store paperwork. Keep the board and session log current. Prepare each release.

**Active:** Days 1–10. Lane A is also the **bookkeeper**: its last PR each day folds the other lanes' handoff notes into `docs/SESSION_LOG.md` and `docs/project/BOARD.md`.

## Read first
- `docs/project/README.md` (rules, ownership, merge order)
- `docs/LAUNCH_ROADMAP.md` (analysis §1.4 lists the doc problems)
- `docs/SESSION_LOG.md` (the format of session entries and Known Issues)
- `docs/ABOUT_PAGE.md` (the release steps)

## Owns
- `README.md`, `CLAUDE.md`, `AGENTS.md`, `IOS_XCODE_COMPATIBILITY.md`
- `docs/**` except `docs/DECISIONS.md` (append-only for everyone) and `docs/project/handoffs/*` (written by each lane)
- `docs/SESSION_LOG.md`, `docs/project/BOARD.md`. Only Lane A edits these two.
- `src/pages/Legal.tsx` from Wave 2 onward. In Wave 1, Lane B edits only the AI wording in it.
- `docs/store/*` (new)
- Release-only exception on Day 7 and Day 10: version fields in `package.json`, `ios/App/App.xcodeproj/project.pbxproj` (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`), `android/app/build.gradle` (`versionName`, `versionCode`), and `src/data/changelog.ts`

## Must not touch
Application code other than `Legal.tsx` and the release-only files above.

## Contracts
Lane A consumes none. When it writes the privacy text, it relies on what each lane's handoff says that lane stores or sends.

---

## Day 1: Fix the docs that mislead agents (roadmap 0.9)

### Steps
1. Edit `CLAUDE.md`:
   1. Stack block. Change Tailwind CSS 3.4 to **4** (CSS-first; tokens in the `@theme` block of `src/index.css`), TypeScript 5.8 to 5.9, and Vitest to 4. Keep React 19, Vite 7, Zustand 5, TanStack Query 5, React Router 7 and Framer Motion 12. Note that `server/` uses Zod 3.
   2. Change I18n from `en, es, fr, de` to `en, es, de, pt`.
   3. Directory tree. Remove `server/src/routes` and `server/src/middleware` (they don't exist; the server is a single `server/src/index.ts`). Add `src/features/`, `api/`, `supabase/migrations/` and `docs/project/`.
   4. Delete the "Active Tasks" section that links to `.gemini/antigravity/...task.md`. Replace it with a link to `docs/project/BOARD.md`.
   5. **Decision D6:**
      - Default (no answer from Lincoln): delete the whole "context-mode — MANDATORY routing rules" block, because those tools aren't installed in this repo's sessions and the rules can't be followed.
      - If Lincoln says he uses context-mode locally, keep the block but add one line above it: "Applies only where the context-mode MCP server is installed."
   6. Add a "Start here" line near the top that points to `README.md`, `docs/LAUNCH_ROADMAP.md` and `docs/project/README.md`.
   7. In "Dark Mode", remove the example `bg-white dark:bg-gray-900` and replace it with semantic tokens (`bg-background text-foreground`). This matches the session-log rule against hardcoding white or black.
2. `AGENTS.md`: apply D6 the same way. Default is to delete the file.
3. Add this banner at the top of each of these files: `docs/ENGINEERING.md`, `SECURITY.md`, `ORCHESTRATION.md`, `API_REFERENCE.md`, `SCHEMAS.md`, `TESTING.md`, `TROUBLESHOOTING.md`, `MIGRATION.md`, `AI_GUIDELINES.md`, `DESIGN_SYSTEM.md`, `DECISIONS.md`.

   ```markdown
   > **Partly out of date (2026-11-17).** Some files, versions and variables named here don't exist.
   > The accurate sources are `README.md` and `docs/LAUNCH_ROADMAP.md`. This doc is corrected when its area is worked on.
   ```

   Don't rewrite these docs today. In `DECISIONS.md`, add the banner only; other lanes append ADRs below.
4. Fix the two broken references the docs audit found:
   - `docs/SESSION_LOG.md` points to `docs/codex-auth-handoff.md`; the real name is `docs/codex-auth-hardening-handoff.md`.
   - `SESSION_LOG` DEBT-004 points to `src/__tests__/`, which doesn't exist; drop the path.
5. Run a link check: every relative Markdown link in `README.md`, `CLAUDE.md` and `docs/**/*.md` resolves. A short Node script in your scratchpad is fine; don't commit it.

### Done when
- [ ] `grep -n "3.4\|\.gemini\| fr" CLAUDE.md` finds no stale stack, `.gemini` or locale references.
- [ ] Every banner is in place.
- [ ] No broken relative links remain in `README.md`, `CLAUDE.md` or `docs/`.
- [ ] Handoff written.

---

## Day 2: iOS docs and the data inventory

> **Carried over from Day 1 handoffs (added 2026-11-17 by the coordinator).** Do these too:
> - Audit `.claude/rules.md`, `.claude/context.md` and `.claude/ignore.md` (linked from `CLAUDE.md`) for the old stack, such as Tailwind 3 and the `fr` locale. DEBT-056.
> - In `docs/IOS_DEVELOPMENT.md`, change the name to FitWizard and state that the app is **iPhone-only and portrait-only** (Lane H Day 1).
> - `DATA_INVENTORY.md`: include the rows from the Lane E Day 2 and Day 3 handoffs and the `exercise-data` Cache Storage entry from Lane D Day 1 (public catalogue, no personal data). Match Lane H's privacy manifest: email (linked), fitness (linked), crash data (not linked, opt-in), product interaction (not linked, opt-in).


### Steps
1. Merge `IOS_XCODE_COMPATIBILITY.md` into `docs/IOS_DEVELOPMENT.md`, then delete the root file:
   - Commands must match `package.json`: `ios:dev` is a bundled build (`npx cap run ios`), `ios:live` runs `scripts/dev-ios-live.mjs`, `ios:live:cap` uses `--host=localhost`, and `ios:open` and `ios:sync` are as named.
   - The project uses **Swift Package Manager** (`ios/App/CapApp-SPM`). Remove every CocoaPods instruction.
   - Replace the all-caps style with normal sentence case.
2. Create `docs/store/DATA_INVENTORY.md`, the single source for the privacy policy and both store forms. Build it from the code (grep each store and each `fetch`), not from memory:

   | Data | Example fields | Where stored | Sent to | Why | Retention | In export? |
   |---|---|---|---|---|---|---|
   | Workout logs | sets, reps, weight, RIR | device; Supabase when signed in (after Wave 2) | Supabase | core feature | until deleted | yes |
   | … | | | | | | |

   Cover all of these:
   - plans, workout logs, personal records, nutrition logs and settings, body measurements, readiness check-ins, achievements, custom exercises, favourites, preferences
   - account email, profile (display name, timezone)
   - consent flags
   - barcode lookups (Open Food Facts)
   - exercise catalogue requests (wger, API Ninjas through Vercel functions)
   - Vercel Analytics page views
   - Google Fonts (until Lane H's Day 2 lands, then remove)
   - planned additions: Sentry (crash reports), PostHog (product analytics), local notifications (on-device only)

   Mark each row **Now** or **After wave N**.
3. Add a "Third parties" table: name, purpose, data sent, region if known, privacy policy link.

### Done when
- [ ] `IOS_XCODE_COMPATIBILITY.md` is gone and nothing links to it (grep).
- [ ] Every command in `docs/IOS_DEVELOPMENT.md` exists in `package.json`.
- [ ] `DATA_INVENTORY.md` has a row for every persisted store in `src/stores/` and every outbound host in `vercel.json`'s `connect-src`.

---

## Day 3: Wave 1 bookkeeping and Gate 1

> **Carried over from Day 2 handoffs and review (added 2026-11-18 by the coordinator).** Do these too:
> - `.claude/*.md` is now Lane A's (default for your Day 2 question; Lincoln can change it). `docs/project/README.md` ownership table: add it.
> - `DATA_INVENTORY.md`: delete the Google Fonts row (fonts are self-hosted since Lane H Day 2, #60). Add the two sync keys from Lane E Day 4: `fitwizard-sync-outbox` (which items changed, with times; no content) and `fitwizard-sync-cursor` (pull positions). Both are erased by erase-on-device.
> - `DATA_INVENTORY.md`: erase-on-device now does clear `fitwizard-wizard` and `fitwizard-onboarding` (fixed in #59 after the review on #56), so the line the reviewer flagged is now true. Re-read it once against `src/lib/storage/clearLocalUserData.ts`.
> - `DATA_INVENTORY.md` third parties: add the `/api/*` origin allowlist and per-IP rate limit (Lane H Day 2). The rate limit keeps IPs in memory for one minute; say so.
> - `CLAUDE.md` golden paths: `src/lib/validation/fitness.ts` is unused (DEBT-069). Replace it with a schema file that is used, for example `src/stores/planStore.persistence.ts`.
> - Supabase region: still unanswered by Lincoln. Keep "Lincoln to provide".


### Steps
1. Read every `docs/project/handoffs/*-day-1.md`, `*-day-2.md` and `*-day-3.md`.
2. Update `docs/project/BOARD.md`: set each task's status, record decision answers in the decisions table, and add newly found issues under the right wave as buffer tasks.
3. Add one combined `docs/SESSION_LOG.md` entry for Wave 1, in the existing format. Add any new DEBT or SEC IDs to Known Issues.
4. Update `README.md` → Features: when Lane E's persistence has merged, change the "Saving workout logs…" row to ✅ and remove the warning.
5. Draft `docs/store/RELEASE_NOTES_1.1.0.md` from the merged work, in user language.
6. Copy the Gate 1 checklist into the PR description so Lincoln can tick it off.

### Done when
- [ ] The board matches the merged state of `preview_b`.
- [ ] The session-log entry exists.
- [ ] No handoff is left unread (list them in the PR body).

---

## Day 4: Privacy policy and terms (roadmap 4.1)

> This is a draft for a qualified reviewer (task L9). It is not legal advice; say so in the PR body.

### Steps
1. Rewrite the privacy section of `src/pages/Legal.tsx` and `docs/privacy-policy.md` from `DATA_INVENTORY.md`. Use plain language and short sections:
   - what we collect
   - where it is stored (device; Supabase project region, which Lincoln provides)
   - who receives it (each third party)
   - why
   - how long it is kept
   - your choices (consent toggles, export, delete)
   - children (not directed at under-13s; Lincoln to confirm the age policy)
   - contact address (Lincoln provides a public support email; **do not use a personal address**)
   - changes
   - effective date
2. Add a **"Delete your account"** section with a stable anchor (`/legal?tab=privacy#delete-account`). It should explain in-app deletion, guest erasure, and how to request deletion without the app (by email). Google Play requires this page.
3. Terms tab: no medical advice, user responsibility, acceptable use, no warranty, governing law placeholder (Lincoln to fill in).
4. Keep every string in i18n. Use the `legal.*` keys in `en.json` and `es.json`. A Spanish draft is fine; mark it for review.
5. Remove the `{TODAY}` and placeholder-email problems from `docs/privacy-policy.md`.

### Done when
- [ ] Every row of `DATA_INVENTORY.md` (Now and Wave 2) appears in the policy.
- [ ] `/legal?tab=privacy#delete-account` scrolls to the section.
- [ ] The existing `src/pages/Legal.test.tsx` passes; add one test for the anchor.

---

## Day 5: Store form answer sheets (roadmap 4.2)

Create `docs/store/APPLE_PRIVACY.md` and `docs/store/GOOGLE_DATA_SAFETY.md`. Each should have question-by-question answers derived from `DATA_INVENTORY.md`, with a short justification and the code location for each answer.

Also create `docs/store/COMPLIANCE.md` covering:
- Age rating questionnaire answers
- The health-app declaration (Google)
- Where the medical disclaimer appears (in-app path and listing text)
- Account-deletion paths (in app, and the web URL)
- Encryption export compliance (HTTPS only, so the standard exemption applies; Lincoln confirms)

**Verify each answer against the current official form wording at the time you write it.** The questions change. Flag anything you can't verify.

**Done when:** every question in both forms has an answer with a source, or is marked "Lincoln to confirm".

---

## Day 6: Listing copy and screenshot script (roadmap 4.3)

1. Write `docs/store/LISTING.md`:
   - app name (FitWizard)
   - subtitle (Apple, 30 characters) and short description (Google, 80 characters)
   - full description (about 4,000 characters, no medical claims, no "AI")
   - keywords (Apple, 100 characters)
   - category (Health & Fitness)
   - support URL and privacy URL
   - "What's new" text
2. Write `scripts/store-screenshots.mjs`. It uses Playwright against `npm run build && npm run preview` to capture, at the required device sizes, the home screen, the wizard muscle step, a generated plan, the workout logger mid-set, history and analytics. Output goes to `docs/store/screenshots/` (git-ignored). The script needs seeded demo data: reuse the fixtures from Lane D's Playwright test if they have merged, or seed through `localStorage`/IndexedDB in the script.
   - **Check the current required screenshot sizes** for both stores and list them in the script header.
   - `scripts/` is shared. This new file is Lane A's.

**Done when:** the script runs locally and writes all screenshots, and the copy fits every character limit (add a check to the script).

---

## Day 7: Release v1.1.0 (roadmap 1.8) and Gate 2

1. Bump `package.json` `version` to `1.1.0`.
2. Add the matching entry at the top of `src/data/changelog.ts`, built from `RELEASE_NOTES_1.1.0.md` plus the Wave 2 handoffs. `src/data/changelog.test.ts` enforces that the two match.
3. Bump the native versions: Xcode `MARKETING_VERSION = 1.1.0` with `CURRENT_PROJECT_VERSION` incremented, and Android `versionName "1.1.0"` with `versionCode` incremented.
4. Bookkeeping for Wave 2: the same as Day 3.
5. Put the Gate 2 checklist in the PR body. After Lincoln merges and promotes to `main`, he tags `v1.1.0`.

**Done when:** `changelog.test.ts` passes and all three version sources agree.

---

## Days 8–10: Submission prep

- **Day 8:** finalise the privacy text with any Wave 2–3 changes (Sentry, PostHog, sync, notifications). Produce a clean copy for the reviewer (L9) as `docs/store/PRIVACY_FOR_REVIEW.md`.
- **Day 9:** run the screenshot script on the final build. Finalise `LISTING.md`.
- **Day 10:**
  1. Fill in `docs/readiness-rubric.md` honestly, with evidence for every score (roadmap 4.6). The release threshold is 70% or higher.
  2. Write `docs/store/SUBMISSION_CHECKLIST.md`: every step to upload and submit, per store, including the remaining Lincoln-only items.
  3. Write the v1.2.0 notes, bump `package.json` to `1.2.0`, and add the matching `src/data/changelog.ts` entry. Lane H bumps the native versions on its Day 10. Both PRs must merge together, so say so in the PR body.

**Done when:** the rubric is filled in with evidence and the submission checklist has no unexplained gaps.
