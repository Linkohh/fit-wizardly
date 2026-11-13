# Quality-of-Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FitWizard faster to load, cleaner to run, and easier to use day to day, in four phases: measure, speed up, tidy, then add two nutrition features and harden offline saves.

**Architecture:** Measurement first, so speed work is driven by numbers. Speed work changes loading only (lazy routes and charts), never behavior. Feature work adds pure logic in `src/lib/` with tests, then thin UI on top. Offline work extends the queue that already exists in `preferencesStore`.

**Tech Stack:** React 19, TypeScript 5.8 (strict), Vite 7, Zustand 5 (persist), TanStack Query v5, React Router 7, i18next, Vitest + Testing Library, Zod 4.

**Spec:** `AUDIT_AND_IDEAS.md` §3.6 (Smart Meal Shortcuts) and §3.7 (Energy Balance Trend), plus the findings in the "Context" section below. Executors read both this plan and the spec.

## Context (verified 2026-11-13)

- Production build: largest chunks are `vendor-pdf` (619 KB, 184 KB gzip), `vendor-charts` (388 KB), `vendor-ui` (356 KB), `vendor-react` (257 KB). PDF is already loaded only on plan export (`src/pages/Plan.tsx:96`).
- Chart components that import `recharts` directly: `ReadinessTrend`, `VolumeChart`, `NutritionInsights`, `BodyTracker`, `StrengthCurve`, `VolumeHealth`, `Revenue`.
- `console.log` in non-test source: `analyticsStore.ts:115,117`, `ErrorBoundary.tsx:101`, `FoodLogger.tsx:144` (a stub), `lib/analytics.ts:42`, `lib/performance.ts:73`, `lib/planMigrations.ts:39`. `CircleLayout.tsx` is already DEV-gated.
- `nutritionStore.ts` already has `savedMeals` and an action that appends to it (around line 194). `FoodLogger.tsx:144` passes a stub `onSaveTemplate` that only logs, so template saving is half-built.
- `preferencesStore.ts` has an `offlineQueue` (line 27) with enqueue (line 197) and a flush path (line 268). Its use for nutrition and workout saves has not been verified.
- `src/lib/offlineSupport.ts` has `apiCache` (a TTL cache) and `useOnlineStatus`. The exercise service (`src/features/exercise-library/service.ts`) fetches with `cache: 'force-cache'` (line 205) and does not use `apiCache`.

## Global Constraints

- TypeScript strict. No `any`. Explicit return types on exported functions.
- Never modify `src/components/ui/`.
- No hardcoded colors; use existing design tokens.
- Every new user-visible string goes through i18next and is added to all four locales (`en`, `es`, `pt`, `de`). `src/locales/localeParity.test.ts` must stay green, and any newly missing key goes in `src/test/fixtures/localeGaps.json` only if it is a known gap.
- Any new stored data field must appear in `src/lib/dataExport.ts` (GDPR Art. 20) and in `Legal.tsx` if it is a new category.
- Persisted store changes must keep old saved state loadable (see Review Focus 5).
- Work on branch `preview_b` (or a branch cut from it, merged back by PR). Never commit to `main`.
- Before every commit: `npm run lint`, `npm run typecheck`, and the tests for the touched area. Before the final task: `npm run test:run` and `npm run build`.
- One commit per task, message prefix `perf:`, `refactor:`, `feat:` or `fix:`.

## Review Focus

1. **Offline save during a dropped connection:** a meal or workout logged while offline is queued, not lost, and is sent exactly once when the connection returns (no duplicates on repeated flush).
2. **Copy-from-yesterday on a day with no meals:** the action is disabled or shows an empty state, and never creates an empty meal entry.
3. **Energy balance with gaps:** days with food logged but no weigh-in, or weigh-ins with no food, must not produce `NaN`, `Infinity` or a misleading trend line.
4. **Exercise search with an empty, very long, or special-character query:** returns an empty list or a clear message, never throws, and does not cache a failed response.
5. **Old persisted state after adding fields:** a user whose `localStorage` predates the new fields loads without a crash and gets sensible defaults.

---

### Task 1: Bundle and performance measurement

**Files:**
- Create: `scripts/bundle-report.mjs`
- Create: `scripts/bundle-report.test.ts`
- Modify: `package.json` (add `"bundle:report": "node scripts/bundle-report.mjs"`)
- Create: `docs/PERFORMANCE_BASELINE.md`

**Interfaces:**
- Produces: `parseInitialChunks(indexHtml: string): string[]` (exported from `bundle-report.mjs` so it can be tested). Returns the `/assets/*.js` and `/assets/*.css` paths referenced by `<script type="module">`, `<link rel="modulepreload">` and `<link rel="stylesheet">` in `dist/index.html`.

- [ ] **Step 1: Write the failing test** in `scripts/bundle-report.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { parseInitialChunks } from './bundle-report.mjs';

describe('parseInitialChunks', () => {
  it('returns script, modulepreload and stylesheet asset paths in order', () => {
    const html = `<script type="module" src="/assets/index-a.js"></script>
      <link rel="modulepreload" href="/assets/vendor-react-b.js">
      <link rel="stylesheet" href="/assets/index-c.css">`;
    expect(parseInitialChunks(html)).toEqual([
      '/assets/index-a.js',
      '/assets/vendor-react-b.js',
      '/assets/index-c.css',
    ]);
  });

  it('ignores non-asset links', () => {
    expect(parseInitialChunks('<link rel="icon" href="/favicon.ico">')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/bundle-report.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `scripts/bundle-report.mjs`**

Export `parseInitialChunks` using a regex over `src="…"` and `href="…"` that keeps only `/assets/` paths ending in `.js` or `.css`, deduplicated, in document order. When run directly (`process.argv[1]` matches the file), read `dist/index.html`, print each initial chunk with its raw and gzip size (`zlib.gzipSync`), and print the total. Exit non-zero if `dist/index.html` is missing.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/bundle-report.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Produce the baseline**

Run: `npm run build && npm run bundle:report`
Record the output in `docs/PERFORMANCE_BASELINE.md` with the date, commit SHA, and the initial-chunk total. Then run a Lighthouse mobile audit on the beta URL (`fitswizardbeta.vercel.app`) and record Performance score, LCP, TBT and JS transferred. The audit is a manual step, so mark it in the doc as "pending: run by owner" if it cannot be run from the environment.

- [ ] **Step 6: Commit**

```bash
git add scripts/bundle-report.mjs scripts/bundle-report.test.ts package.json docs/PERFORMANCE_BASELINE.md
git commit -m "perf: add bundle report and record baseline"
```

---

### Task 2: Remove debug logging from production paths

**Files:**
- Modify: `src/stores/analyticsStore.ts:115,117`
- Modify: `src/lib/analytics.ts:42`
- Modify: `src/lib/performance.ts:73`
- Modify: `src/lib/planMigrations.ts:39`
- Modify: `src/components/ErrorBoundary.tsx:101`
- Test: `src/lib/logging.test.ts` (new)

**Interfaces:**
- Produces: `devLog(...args: unknown[]): void` in `src/lib/devLog.ts`. It calls `console.log` only when `import.meta.env.DEV` is true. Every file above uses `devLog` instead of `console.log`.
- ErrorBoundary keeps a `console.error` in all builds, because real crashes need to be visible in production.

- [ ] **Step 1: Write the failing test** in `src/lib/logging.test.ts`

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { devLog } from './devLog';

describe('devLog', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not call console.log when DEV is false', () => {
    vi.stubEnv('DEV', false);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog('[Analytics] test');
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('calls console.log when DEV is true', () => {
    vi.stubEnv('DEV', true);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    devLog('[Analytics] test');
    expect(spy).toHaveBeenCalledWith('[Analytics] test');
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/logging.test.ts`
Expected: FAIL, module `./devLog` not found.

- [ ] **Step 3: Implement `src/lib/devLog.ts`** and replace the `console.log` calls listed above with `devLog`. Do not change the message text.

- [ ] **Step 4: Run the test and the area tests**

Run: `npx vitest run src/lib/logging.test.ts src/stores src/lib`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/devLog.ts src/lib/logging.test.ts src/stores/analyticsStore.ts src/lib/analytics.ts src/lib/performance.ts src/lib/planMigrations.ts src/components/ErrorBoundary.tsx
git commit -m "refactor: gate debug logging behind DEV"
```

The `FoodLogger.tsx:144` stub is replaced in Task 6, not here.

---

### Task 3: Lazy-load chart-heavy pages (conditional on Task 1)

**Run this task only if Task 1's baseline shows `vendor-charts` in the initial chunk list.** If it does not, mark this task skipped in the baseline doc and continue.

**Files:**
- Modify: `src/App.tsx` (route imports for pages that render charts)
- Create: `src/components/charts/lazyCharts.tsx`
- Test: `src/components/charts/lazyCharts.test.tsx`

**Interfaces:**
- Produces: `LazyVolumeChart`, `LazyStrengthCurve`, `LazyReadinessTrend`, each a `React.lazy` wrapper with a `Suspense` fallback that renders a fixed-height skeleton (same height as the chart, so the page does not shift).

- [ ] **Step 1: Write the failing test** asserting that each lazy wrapper renders its skeleton before the chart resolves and the chart after (mock the underlying module with `vi.mock`).
- [ ] **Step 2: Run it, expect FAIL** (module missing).
- [ ] **Step 3: Implement** `lazyCharts.tsx` and switch the matching imports in `App.tsx` and the pages that render those charts to the lazy wrappers. Do not change chart props.
- [ ] **Step 4: Run the test, then `npm run build && npm run bundle:report`.** Expected: `vendor-charts` is no longer in the initial chunk list for `/` (the dashboard). Record the new total in `docs/PERFORMANCE_BASELINE.md`.
- [ ] **Step 5: Commit** with message `perf: lazy-load chart components`.

---

### Task 4: Smart Meal Shortcuts (copy yesterday, save as template)

**Files:**
- Create: `src/lib/mealShortcuts.ts`
- Create: `src/lib/mealShortcuts.test.ts`
- Modify: `src/stores/nutritionStore.ts` (add `copyMealsFromDate` action; reuse the existing `savedMeals` append action)
- Modify: `src/components/nutrition/FoodLogger.tsx:142-146` (replace the stub `onSaveTemplate` with the store action)
- Modify: `src/locales/en.json`, `es.json`, `pt.json`, `de.json` (new keys under `nutrition.shortcuts.*`)

**Interfaces:**
- Produces in `mealShortcuts.ts`:
  - `copyableMeals(history: Record<string, DailyLog>, sourceDate: string): MealEntry[]` returns a copy of the meals on `sourceDate` with new ids and `timestamp` set to now. Returns `[]` if the day has no meals.
  - `templateFromMeal(meal: MealEntry, name: string): MealTemplate`. Trims the name; throws `Error('Template name is required')` if empty after trim.
- Produces in `nutritionStore`: `copyMealsFromDate(sourceDate: string): number` returns how many meals were added to `selectedDate`. Uses `copyableMeals` and `logMeal`.

- [ ] **Step 1: Write the failing tests** in `src/lib/mealShortcuts.test.ts`:
  - copying a day with two meals returns two meals with new ids and the same `name`, `calories`, `protein`, `carbs`, `fat`.
  - copying an empty or missing day returns `[]`.
  - `templateFromMeal` with `'  '` throws `Template name is required`.
  - the copied meals do not share object identity with the source (mutating the copy leaves the source unchanged).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `mealShortcuts.ts`. Generate ids with the same helper the store already uses for meal ids (check `nutritionStore.ts` `logMeal` callers for the helper name; do not add a new id scheme).
- [ ] **Step 4: Add the store action and wire the UI.** The "Copy yesterday" button is disabled when `copyableMeals` returns `[]`. The `onSaveTemplate` stub becomes a call to the existing `savedMeals` action with `templateFromMeal(meal, name)`, where `name` comes from a single text input in the existing dialog. No new dialog component.
- [ ] **Step 5: Add i18n keys** to all four locale files, then run `npx vitest run src/locales`. Expected: PASS (parity holds).
- [ ] **Step 6: Run the nutrition tests**: `npx vitest run src/components/nutrition src/stores/nutritionStore src/lib/mealShortcuts`. Expected: PASS.
- [ ] **Step 7: Commit** with message `feat: smart meal shortcuts (copy yesterday, save template)`.

---

### Task 5: Energy Balance Trend (calories vs weight)

**Files:**
- Create: `src/lib/energyBalance.ts`
- Create: `src/lib/energyBalance.test.ts`
- Create: `src/components/nutrition/EnergyBalanceChart.tsx`
- Modify: `src/components/nutrition/NutritionInsights.tsx` (mount the new chart in the existing insights area)
- Modify: `src/locales/*.json` (keys under `nutrition.energyBalance.*`)

**Interfaces:**
- Produces in `energyBalance.ts`:
  - `type EnergyBalancePoint = { date: string; intake: number | null; weight: number | null; rollingWeightDelta: number | null }`
  - `computeEnergyBalance(history: Record<string, DailyLog>, weights: { date: string; kg: number }[], windowDays: 7 | 14 | 28): EnergyBalancePoint[]`. Returns one point per date in the window, ordered oldest to newest. `intake` is `null` when no meal was logged that day. `weight` is `null` when no weigh-in exists that day. `rollingWeightDelta` is the change between the first and last available weigh-ins inside the window, or `null` if fewer than two exist.
- The chart renders only points where `intake !== null` for the intake series and only `weight !== null` for the weight series. Gaps render as gaps, never as zero.

- [ ] **Step 1: Write the failing tests** in `energyBalance.test.ts`:
  - a 7-day window with intake on every day and weight on days 1 and 7 gives `rollingWeightDelta` equal to `weight[7] - weight[1]` on every point with both ends present.
  - a day with no meals gives `intake: null`, not `0`.
  - weights with a single entry gives `rollingWeightDelta: null` on every point.
  - an empty history and empty weights returns 7 points, all nulls, no `NaN` anywhere (assert `Number.isNaN` is false for every numeric field).
  - `windowDays` other than 7, 14, 28 is a type error (covered by the union type).
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `computeEnergyBalance` as a pure function. Dates are `YYYY-MM-DD` strings; compare as strings, do not construct `Date` objects for ordering.
- [ ] **Step 4: Implement `EnergyBalanceChart.tsx`** using the same chart library as `NutritionInsights` (`recharts`, already a dependency). Two series on one x-axis, intake (left axis) and weight (right axis). Use `connectNulls={false}` so gaps show. Add a 7/14/28 segmented control. Colors from existing theme tokens only.
- [ ] **Step 5: Mount it** in `NutritionInsights.tsx` below the existing score bar. Add the i18n keys to all four locales and run `npx vitest run src/locales`.
- [ ] **Step 6: Run** `npx vitest run src/lib/energyBalance src/components/nutrition`. Expected: PASS.
- [ ] **Step 7: Commit** with message `feat: energy balance trend chart`.

---

### Task 6: Offline-tolerant saves

**Files:**
- Modify: `src/stores/preferencesStore.ts` (queue flush path, around lines 197 and 268)
- Modify: `src/stores/nutritionStore.ts` (enqueue on `logMeal` when offline)
- Modify: `src/stores/workoutStore.ts` or the equivalent store that saves a logged workout (verify the name first)
- Create: `src/lib/offlineSave.test.ts`

**Interfaces:**
- Produces: `enqueueIfOffline<T extends { id: string }>(action: QueuedActionInput<T>, isOnline: boolean): boolean` returns `true` if the action was queued (and the caller should skip the network write). Each queued action carries a stable `id` so a flush can be idempotent.
- Flush: on the `online` event, `preferencesStore` sends each queued action in order, removes it only after a successful response, and skips any action whose `id` was already acknowledged.

- [ ] **Step 1: Write the failing tests** in `offlineSave.test.ts`:
  - when `isOnline` is false, `enqueueIfOffline` returns `true` and the queue grows by one.
  - when `isOnline` is true, it returns `false` and the queue does not change.
  - flushing a queue with the same action id twice sends it once (mock the sender and count calls).
  - a flush that fails on the second of three actions leaves the second and third queued and does not re-send the first.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Confirm first (read `preferencesStore.ts` around lines 190–280) whether the flush already sends per-item or in bulk and whether it clears on failure. Fix whichever of the four behaviors above it does not already meet. Do not replace the queue; extend it.
- [ ] **Step 4: Wire the save paths.** Nutrition `logMeal` and the workout save call `enqueueIfOffline` before the network write, and show a "Saved offline, will sync" toast (new i18n key in all four locales).
- [ ] **Step 5: Manual offline check on the beta.** In Chrome DevTools, set Network to Offline, log one meal and one workout, set back to Online, and confirm both appear once in Supabase or the server (owner verifies, since the Supabase dashboard is user-only). Record the result in the PR description.
- [ ] **Step 6: Run** `npx vitest run src/lib/offlineSave src/stores`. Expected: PASS.
- [ ] **Step 7: Commit** with message `fix: queue meal and workout saves while offline`.

---

### Task 7: Exercise search cache

**Files:**
- Modify: `src/features/exercise-library/service.ts` (wrap the search read in `apiCache`)
- Modify: `src/lib/offlineSupport.ts` only if `apiCache` needs a `has`/`delete` method (check first)
- Create: `src/features/exercise-library/searchCache.test.ts`

**Interfaces:**
- Produces: `cachedExerciseSearch(query: string): Promise<Exercise[]>`. Normalizes the query (trim, lowercase, collapse spaces), returns a cached result for 10 minutes, and never caches a rejected promise or an error result. An empty normalized query returns `[]` without calling the network.

- [ ] **Step 1: Write the failing tests:**
  - two identical queries that differ only in case and spacing trigger one underlying fetch.
  - a failed fetch is not cached; the next call fetches again.
  - an empty or whitespace query returns `[]` and triggers no fetch.
  - a 600-character query is truncated to 200 characters before the fetch.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** `cachedExerciseSearch` and point the existing search call site at it.
- [ ] **Step 4: Measure before claiming a win:** note the number of requests in the Network panel for the same search twice, before and after. Record both numbers in the commit message body.
- [ ] **Step 5: Run** `npx vitest run src/features/exercise-library`. Expected: PASS.
- [ ] **Step 6: Commit** with message `perf: cache exercise search results for 10 minutes`.

---

### Task 8: Final verification and documentation

**Files:**
- Modify: `docs/SESSION_LOG.md` (new dated entry; mark items done in the Backlog section)
- Modify: `docs/PERFORMANCE_BASELINE.md` (before and after numbers)
- Modify: `AUDIT_AND_IDEAS.md` (mark §3.6 and §3.7 done)

- [ ] **Step 1: Full suite.** Run `npm run lint && npm run typecheck && npm run test:run && npm run build`. Expected: all pass. Paste the summary line of each into the PR description.
- [ ] **Step 2: Server suite**, as CI does: `cd server && npm test && npm run build`. Expected: pass.
- [ ] **Step 3: Beta smoke test** on the preview: onboarding, log a meal, copy yesterday, save a template, open insights and check the energy balance chart with a day missing weigh-in, toggle offline and log, exercise search twice with different casing.
- [ ] **Step 4: Update docs** as listed above, then commit with message `docs: record quality-of-life pass results`.
- [ ] **Step 5: Open a PR** from the branch into `preview_b`. Do not merge to `main`.

---

## Out of scope (explicitly deferred)
- Replacing the chart library, or redesigning the dashboard.
- Server-side caching or a CDN for the API.
- Push notifications.
- Any change to `main`, Supabase schema, or RLS policies. If a task seems to need one, stop and ask.
