# Lane D: Assets, Cleanup & QA

**Mission:** Make the app lighter, remove dead weight, fix the PDF export, and build the safety net: end-to-end tests, accessibility, and CI gates.

**Active:** Days 1–9. With 4 agents, this lane is paired with Lane C.

## Read first
- `docs/project/README.md`
- `docs/LAUNCH_ROADMAP.md` items 0.7, 0.8, 3.4, 3.5, 3.6b, 4.5
- `vite.config.ts`
- `playwright.config.ts`
- the existing specs in `playwright/`

## Owns

**Wave 1**
- `public/`, `vite.config.ts`, `eslint.config.js`
- The logo `src` attribute in `src/components/Header.tsx` (around line 558; nothing else in that file)
- `src/lib/pdfExport.ts` and its test
- Deleting files that `knip` confirms are unused. **Never** delete a file another lane owns this wave (see the list on Day 2)
- `.lovable/`, `apps/`, and the root `*.pdf` files

**Wave 2**
- `playwright/**`, `playwright.config.ts`
- New jobs in `.github/workflows/ci.yml` (add jobs; don't edit existing steps)
- `.github/dependabot.yml`
- `src/components/logging/SetLogger.tsx`
- `src/features/mcl/components/MuscleSelector/ui/*`
- `src/features/mcl/hooks/useTheme*`
- Adding `<MotionConfig>` in `src/App.tsx` (one wrapper; allowed exception)
- The Enter-key handler in `src/pages/Wizard.tsx` (Day 6)

**Waves 3+**
- `src/App.tsx`, plus regression specs

## Must not touch
Stores, the sync engine, native files, `supabase/`, and docs other than your handoff.

## Contracts
- Uses #2 (`useStoresHydrated`) in E2E waits.
- Uses #1 (flags) when writing E2E for flags off.

---

## Day 1: Asset diet (0.7)

### Steps
1. Measure first: run `du -sh public public/*` and `npm run bundle:report`. Write both into your handoff.
2. Icons. The source is `resources/icon.png` (1024 px). Generate these, PNG-compressed (use `sharp` from a scratch script, not committed; or `npx @capacitor/assets` for the web set only):
   - `public/favicon.png`: 48 px
   - `public/apple-touch-icon.png`: 180 px
   - `public/app-icon-192.png`, `app-icon-384.png`, `app-icon-512.png`
   - `public/app-icon.png`: 512 px. `index.html` references it, so keep the filename.
   - Target: under 60 KB each.
   - **Don't** touch `ios/` or `android/` icons; those belong to Lane H.
3. Header logo:
   - `public/lovable-uploads/85daa486-….png` is 1.7 MB.
   - Find its rendered size in `Header.tsx` around line 558, export a WebP at twice that size to `public/brand/logo-header.webp`, and change only the `src`. Add `width`/`height` attributes if they're missing, to avoid layout shift.
   - Delete the old file and `public/lovable-uploads/` if it's now empty.
   - Shrink `public/logo.png` (766 KB) the same way if anything references it (grep). Delete it if nothing does.
4. PWA (`vite.config.ts`, around lines 151–190):
   - Remove `exercise-data/legacy-exercises.v1.json` and `exercise-data/wger-snapshot.v1.json` from `includeAssets`.
   - Add a `workbox.runtimeCaching` entry: `urlPattern: ({url}) => url.pathname.startsWith('/exercise-data/')`, `handler: 'StaleWhileRevalidate'`, `options: { cacheName: 'exercise-data', expiration: { maxEntries: 4 } }`.
   - Change the manifest `description` (line 167) from "Your AI-powered workout companion" to "Science-based workout plans, built around you." (roadmap 0.1, this file only).
   - Leave `orientation: 'portrait'` as is.
5. Check that `creator-avatar.jpg` is a sensible size; compress it if it's over 200 KB.
6. Build (`npm run build`), then `npm run preview`. Load the app, go offline in DevTools, reload, and open the exercise library. It should load from the runtime cache after the first online visit. Record the result.

### Done when
- [ ] `public/` is under 5 MB (exercise data included). Before and after sizes are in the handoff.
- [ ] No reference points at a deleted file (grep `src`, `index.html` and `vite.config.ts`).
- [ ] The offline check passes.
- [ ] Tests are green.

---

## Day 2: Dead code (0.8)

### Steps
1. `npm install -D knip`. Add a minimal `knip.json`:
   - entries: `src/main.tsx`, `src/**/*.test.{ts,tsx}`, `api/*.ts`, `scripts/*.mjs`, `playwright/**/*.ts`, `vite.config.ts`, `vitest.config.ts`
   - ignore `src/components/ui/**`, because shadcn primitives stay even when unused
   
   Run `npx knip`.
2. **Do not delete**, even if `knip` lists them:
   - `src/lib/offlineSave.ts` and `src/lib/planMigrations.ts` (Lane E uses them)
   - anything under `src/components/circles/`, `src/components/trainer/`, `src/pages/Clients*`, `src/pages/Revenue.tsx`, `src/pages/TemplateLibrary.tsx` (flagged off, kept for later)
   - `src/stores/*`, except `favorites-store.ts`, which is listed under the expected deletions
   - `src/components/nutrition/NutritionSkeleton.tsx` and `src/components/plan/PlanSkeleton.tsx` (Lane B uses them on Day 3)
   - anything another lane's Day 2 task names
3. **Expected deletions**, if `knip` confirms they're unused:
   - pages and review cards: `src/pages/exercises/*`, the six `src/components/wizard/review/Review*Card.tsx`
   - components: `QuickActions`, `WeeklyProgressReview`, `ProgressionRecommendations`, `ReadinessModal`, `SplitRecommender`, `VolumeChart`, `InteractiveQuote`, `NavLink`, `ExercisesBrowser`, `ExerciseMuscleHighlight`, `MotivationalQuote`, `AnalyticsProvider`
   - libraries and hooks: `src/lib/fitnessUtils.ts`, `src/lib/performance.ts`, `src/lib/exerciseVersioning.ts`, `useNetworkStatus`
   - stores: `src/stores/favorites-store.ts` (confirmed unused on Lane E Day 3; exercise favourites live in `preferencesStore`)
   - Delete each one's test too.
4. Other removals:
   - `lovable-tagger`: remove it from `package.json` devDependencies and from `vite.config.ts` (its `componentTagger()` plugin)
   - the root `FitWizard_*.pdf` files, `.lovable/`, the empty `apps/`
   - `AUDIT_AND_IDEAS.md`, `report.md` and `security_best_practices_report.md` stay. Lane A decides on them later.
5. `eslint.config.js`: add `ios/DerivedData/**`, `ios/**/.build/**` and `android/**/build/**` to `ignores` (DEBT-022).
6. Run lint, typecheck, tests and `npm run build`. Every check must pass.

### Done when
- [ ] `npx knip` reports no unused files outside the keep-list above.
- [ ] The build is green.
- [ ] The handoff lists every deleted file.

---

## Day 3: PDF export fixes (3.6b)

Three bugs are visible in the sample exports that used to sit at the repo root:

1. **"DAY 1: DAY 1:" duplicated.** `pdfExport.ts` around line 153 prints `DAY ${index + 1}: ${day.name}`, and `day.name` often already starts with "Day 1:". Strip a leading `/^day\s*\d+\s*[:\-–]\s*/i` from the name before printing.
2. **Column headers wrap mid-word** (INTENSITY, REST). Set explicit `columnStyles` widths in the autotable call, or shorten the headers ("RIR", "Rest"). Keep the headers translatable.
3. **Garbled emoji** ("Ø=Üª"). jsPDF's standard fonts can't render emoji. Strip emoji from PDF strings, using a helper that removes `\p{Extended_Pictographic}`, or replace them with text.

Then:
- Add tests in `src/lib/pdfExport.test.ts` for each of the three.
- Generate a sample PDF through the app (Plan → Export) and eyeball it. Don't commit the PDF.

**Done when:** all three tests pass and the sample shows clean headers and no garbled characters.

---

## Day 4: End-to-end lifter loop (3.5)

1. New spec `playwright/lifter-loop.spec.ts`, using the `chromium` project only:
   1. Fresh context, so storage is empty. Go through onboarding.
   2. Wizard: choose a goal, pick muscles (use the muscle search or a preset, not pixel clicks), and generate the plan.
   3. Plan page shows day 1. Start the workout.
   4. Log two sets (weight, reps, RIR), then finish the workout and rate it.
   5. **Reload the page.** History shows the workout, and Plan still shows the plan.
   6. Close the context and open a new page on the same storage state. The data is still there.
   
   Use roles and labels (`getByRole`, `getByLabel`). If an element has no accessible name, give it one (a label in the component owner's file goes in your handoff; in `SetLogger.tsx` you can add it yourself).
2. CI: add a `e2e` job to `.github/workflows/ci.yml` (Node 22, `npm ci`, `npx playwright install --with-deps chromium`, `npx playwright test --project=chromium --trace off`). Depend on the existing `test` job. Don't change existing steps.
3. Until Lane E's persistence has merged, step 5 fails. Mark it `test.fixme` with a comment linking contract #2, and remove the `fixme` once it passes. Say which applies in the handoff.

**Done when:** the spec passes locally and in CI (or step 5 is `fixme` with a reason), and its runtime is under 2 minutes.

---

## Day 5: Accessibility, part 1 (3.4)

1. `SetLogger.tsx`:
   - RIR (reps in reserve) levels are shown by colour only. Add the `getRIRLabel()` text visibly next to the number, or as `aria-label` plus a visible short label.
   - Keep the 44 px minimum touch targets (`min-h-[44px] min-w-[44px]`).
2. MCL touch targets (DEBT-020): `SculptSlider.tsx` (thumb 20 px) and `LayerToggle.tsx` (36–44 px) need hit areas of at least 44 px. Use padding or an invisible hit area; the visuals can stay the same.
3. Reduced motion: wrap the app in `<MotionConfig reducedMotion="user">` in `src/App.tsx`, as a single wrapper around the existing tree.
4. DEBT-021 (theme doesn't reach the muscle selector without a reload; selected rows nearly invisible in light theme):
   - Make `src/features/mcl/hooks/useTheme*` subscribe to `themeStore` or the `class` on `<html>`.
   - Fix the selected-row colours in `SelectionSidebar.tsx` with semantic tokens.
5. Tests: the RIR label is present, the theme switch updates the MCL without a reload, and the hit-area size is checked (assert the class or style).

**Done when:** an axe pass (`@axe-core/playwright`, added to the lifter-loop spec) shows no serious or critical violations on Wizard, Plan, Workout and History, or the remaining ones are listed with owners.

---

## Day 6: Wizard Enter key (DEBT-025)

- **Problem:** pressing Enter on a focused muscle in the anatomy step selects it **and** advances the wizard. The window-level shortcut in `src/pages/Wizard.tsx` sees the event after the SVG control has already handled it.
- **Fix:** in the window `keydown` handler, ignore events where `event.defaultPrevented` is true, or whose target is inside the muscle canvas or any `[role="button"]`, `input`, `textarea` or `select`. Make sure the MCL control calls `preventDefault()` when it handles Enter.
- **Test:** focus a muscle, press Enter. The muscle is selected and the step does not change. Pressing Enter on the page background still advances.

**Done when:** that test passes and nothing else in the wizard tests changes.

---

## Day 7: CI gates (4.5)

1. Add an `audit` job to `ci.yml` that runs `npm audit --audit-level=high` for the root, and for `server/` only if `server/` still exists after Lane F's Day 5.
2. Add `.github/dependabot.yml`: weekly npm updates for `/` (and `/server` if it exists), grouped by minor and patch versions, with a PR limit of 5. Add weekly `github-actions` updates.
3. Make sure the Playwright job is required. Write the branch-protection settings for Lincoln in your handoff; you can't change repo settings.

**Done when:** both jobs run on the PR. If audit fails because of existing advisories, list them in the handoff. Don't silence them.

---

## Days 8–9: Device triage and regressions

- **Day 8:** take the bug list from Lincoln's device test (Lane H's checklist). Reproduce each bug in Playwright mobile emulation (`devices['iPhone 13']`, `devices['Pixel 7']`) where you can. Fix the ones in your files and hand the rest to their owners.
- **Day 9:** add a regression spec for every bug fixed in Wave 3.
