# Lane E: Data

**Mission:** Users never lose their training data. Everything is saved on the device the moment it happens. When the user is signed in, it syncs to the cloud and follows them to any device. This is the critical path of the whole project.

**Active:** Days 1–9. With 4 agents, this lane is paired with Lane F.

## Read first
- `docs/project/README.md`
- `docs/project/CONTRACTS.md` #2, #3, #5
- `docs/LAUNCH_ROADMAP.md` §1.2 (why this matters) and items 0.3, 1.1, 1.2, 1.4
- `src/stores/planStore.ts`, `src/stores/nutritionStore.ts`, `src/stores/authStore.ts` (lines 16–70)
- `src/lib/plans/planSyncService.ts`, `src/lib/plans/supabasePlansRepo.ts`
- `src/lib/offlineSave.ts`

## Background you need

Commit `26e3534` (2026-04-11) deliberately stopped writing workout, nutrition and trainer data to `localStorage`, so an injected script couldn't read health data. The side effect is that the data is now **lost on every reload**:
- `planStore` persists only `currentWeek` and `preferredWeightUnit` (`planStore.ts:59-64`).
- `nutritionStore` persists only `selectedDate`.
- `measurementsStore` has no `persist` at all.

**ADR 11** (you write it on Day 3) reverses this for user data. The protection against injected scripts is the strict CSP in `vercel.json` with no third-party scripts, not refusing to store data.

## Owns
- `src/stores/*`, **except** `trainerStore.ts` and `onboardingStore.ts` (Lane C).
- `src/lib/storage/*`, `src/lib/sync/*`, `src/lib/offlineSave.ts`, `src/lib/plans/*` (Lane F edits `plansClient.ts` on Day 5), `src/components/HydrationGate.tsx`.
- In `src/stores/authStore.ts`, only `SENSITIVE_*_KEYS` and `clearSensitiveStorage` (lines 16–70).
- In `src/main.tsx`, Day 1 only (wrapping `<App/>` in `<HydrationGate>`).
- In `src/pages/Wizard.tsx`, Day 2 only (one counter call).
- The sync-indicator block in `src/pages/Profile.tsx` (Day 6).
- The sign-in sync effect in `src/App.tsx` (lines 345–349, Day 6).
- Appending ADR 11 to `docs/DECISIONS.md`.
- Locale keys: `sync.*`, `storage.*`.

## Must not touch
Routing, nav, native project files, `supabase/` (that's Lane F; you consume its tables through contract #3).

## Contracts
- **Provides:** #2 device storage (Day 1), #5 sync engine (Day 4).
- **Uses:** #1 flags (Day 2), #3 tables (from Day 4; mock until merged).

## Environment
- Cloud sessions have no Supabase. Test the sync engine against a **fake client**: an in-memory table map that implements `from(table).select/upsert/eq/gt`.
- Real round trips are checked by Lincoln at Gate 2.

---

## Day 1: Storage layer (1.1)

### Steps
1. Install the packages:
   ```sh
   npm install idb-keyval @capacitor/filesystem
   ```
   Do **not** run `npx cap sync`; Lane H does native syncs.
2. Create `src/lib/storage/appStorage.ts` (contract #2):
   - **Web:** `get`/`set`/`del` from `idb-keyval`, using a custom store `createStore('fitwizard', 'kv')`.
   - **Native** (`isNativeApp()` from `src/lib/platform.ts`): `Filesystem.readFile` / `writeFile` / `deleteFile` with `directory: Directory.Data`, `encoding: Encoding.UTF8`, path `stores/<name>.json`, `recursive: true` on write. Treat a missing file as `null`.
   - Load `@capacitor/filesystem` lazily (`await import(...)`) so the web bundle doesn't grow.
   - **Fallback:** if IndexedDB is unavailable (some private browsing modes), fall back to an in-memory `Map` and log once through `devLog`.
   - `dateReviver(key, value)` turns ISO strings back into `Date` for the keys `startedAt`, `completedAt`, `achievedAt`, `createdAt`, `updatedAt`. Follow `normalizePlanDates` in `supabasePlansRepo.ts:7`.
   - `requestPersistentStorage()` calls `navigator.storage?.persist?.()` once per install and remembers this under the key `fitwizard-storage-persist-requested`.
3. Create `src/components/HydrationGate.tsx`:
   - Keep a registry of persisted stores. Each store calls `registerHydration(name)` and, from `onRehydrateStorage`, `markHydrated(name)`.
   - `useStoresHydrated()` returns true once every registered store is hydrated, **or after 3 seconds** as a safety valve (log if this happens).
   - The gate renders the existing `LoadingScreen` component (find it in `App.tsx`; export it if needed by moving it to `src/components/LoadingScreen.tsx`, and leave a re-export in `App.tsx` so Lane C's file is untouched in substance).
4. In `src/main.tsx`, wrap `<App />` with `<HydrationGate>`. Nothing else changes.
5. Tests, in `src/lib/storage/appStorage.test.ts`:
   - Round-trip via `fake-indexeddb` (`npm i -D fake-indexeddb`; import `fake-indexeddb/auto` in the test).
   - Native branch with `@capacitor/filesystem` mocked.
   - Fallback to memory.
   - `dateReviver` restores dates.
   - `HydrationGate`: shows the loading screen, then the children.

### Done when
- [ ] The contract #2 exports exist exactly as written.
- [ ] Tests are green.
- [ ] The bundle-report diff for the web initial chunk is under +3 KB gzipped (`npm run bundle:report`).

---

## Day 2: Persist plans and measurements, wire the counters (1.2 part 1, 0.3)

### Steps
1. `planStore.ts`:
   1. Switch `persist` to `storage: createJSONStorage(() => appStorage, { reviver: dateReviver })`.
   2. Widen `PersistedPlanState` (around line 59) and `sanitizePlanPersistedState` (around line 61) to include `currentPlan`, `planHistory`, `workoutLogs`, `personalRecords`, `activeWorkout`, `currentWeek` and `preferredWeightUnit`.
      - Validate shapes defensively. Drop malformed entries instead of throwing: a corrupt log must never brick the app.
   3. Add `version: 2` and a `migrate` function. Version 1 data only has `currentWeek` and the weight unit, so keep those and default the rest.
   4. Raise the caps: workout logs from 100 to **1000** (line 412), PRs from 50 to **500** (line 414).
   5. Register with `HydrationGate`.
   6. In `completeWorkout`, after `set(...)`:
      - Call `useAchievementStore.getState().updateStreak()` and `.incrementWeeklyProgress()`.
      - For any badge ids returned, surface them the way `readinessStore.ts:74` does.
      - Wrap the `postWorkoutToCircles` and `postPRToCircles` calls in `if (isFeatureEnabled('circles'))`.
2. `achievementStore.ts`:
   - Check whether anything resets weekly progress at week rollover. If not, store `weekStart` (the ISO Monday) and reset `weeklyProgress` inside `updateStreak` when the week has changed.
   - Keep its current persistence for now; it moves to `appStorage` tomorrow.
3. `src/pages/Wizard.tsx` (around lines 135–137): after `savePlanToHistory(plan)`, call `useAchievementStore.getState().incrementPlansGenerated()`. Make no other edits in this file.
4. `measurementsStore.ts`: wrap it in `persist` with the name `fitwizard-measurements`, using `appStorage`, `version: 1` and hydration registration.
5. Tests:
   - planStore round-trip: generate a plan, log a workout, complete it, rehydrate a new store instance from the same fake storage. Plan, log and PRs are all there, and dates are `Date` objects.
   - Migrating version 1 to 2 keeps `currentWeek`.
   - A malformed log is dropped and the others are kept.
   - Completing a workout increments the streak and weekly progress. With circles off, `postWorkoutToCircles` is not called.
   - Measurements survive rehydration.
   - Update any existing `planStore` tests that assumed nothing persists.

### Done when
- [ ] In `npm run dev`: create a plan, log a workout, reload. Everything is still there, including History.
- [ ] Home shows streak 1 and plans generated 1.

---

## Day 3: Persist everything else, sign-out behaviour, ADR 11 (1.2 part 2)

### Steps
1. Move these stores to `appStorage`, each with `version`, `migrate` and hydration registration:
   - `nutritionStore`: persist `profile`, `targets`, `history`, `customFoods`, `favorites`, `savedMeals`, `selectedDate`. Widen `PersistedNutritionState` and `sanitizeNutritionPersistedState`. Validate every day log.
   - `readinessStore` (`readiness-storage`), `achievementStore`, `customExerciseStore`, `favorites-store`: these currently persist to `localStorage`.
2. **One-time copy from localStorage** (already built on Day 2: `createUserDataStorage()` in `appStorage.ts` does the copy, so a store just uses it as its `storage`):
   - In each store's `migrate`, or in a small `src/lib/storage/migrateFromLocalStorage.ts` run before hydration:
     - If `appStorage` has no value for the key but `localStorage` does, copy it over, then remove the `localStorage` key.
   - Test this.
3. Create `src/lib/storage/clearLocalUserData.ts` (contract #2). It removes every user-data store key from `appStorage` and resets each of those stores to its initial state in memory. Lane F calls it for account deletion and guest erase. Test it.
4. `authStore.ts`, `clearSensitiveStorage` (lines 58–70):
   - **Signed-in account signs out:** clear the device copies of user data with `clearLocalUserData()` (the data is in the cloud once Wave 2 lands).
   - **Guest:** never clear anything. Guests have no cloud copy.
   - Update `SENSITIVE_LOCAL_STORAGE_KEYS`. It currently lists `measurements-storage`, which is now `fitwizard-measurements`.
   - Before Wave 2 sync exists, signing out would delete un-synced data. So **until Day 6**, sign-out only clears data if the sync engine reports nothing pending. Before the engine exists, sign-out clears nothing and shows a toast: "Your data stays on this device." Remove this guard on Day 6.
5. ADR 11: append to `docs/DECISIONS.md` under the banner:

   ```markdown
   ## 11. Local-first user data (2026-11)
   - **Decision**: All user data is saved on the device (IndexedDB on web, app files on native) immediately, and synced to Supabase when signed in.
   - **Why**: The April 2026 hardening stopped persisting health data to avoid script access, which made the app forget every workout on reload. The defence against injected scripts is the strict CSP with no third-party scripts.
   - **Consequences**: Sign-out of an account clears device copies; guests keep their data; account deletion erases both.
   ```

6. In the handoff, give Lane A the data-inventory rows: what is now stored on the device, under which names.

### Done when
- [ ] Every store listed above survives a reload.
- [ ] Existing users' localStorage data is migrated once.
- [ ] Guest sign-out never loses data.
- [ ] Tests are green.

---

## Day 4: Sync engine core (1.4 part 1)

> **Carried over from Day 1 handoffs (added 2026-11-17 by the coordinator).** Do these too:
> - The three "Wisdom AI" achievements in `achievementStore.ts` (around lines 214–236) can't be earned, because the Wisdom chat isn't shown, and their text mentions AI. Remove them from `BADGES`. The load check already drops unknown badge ids from saved data. DEBT-046.
> - Type `planToRow()` in `src/lib/plans/supabasePlansRepo.ts` as `Database['public']['Tables']['plans']['Insert']`, so Lane F can make `plans.Row.deleted_at` required (Lane F Day 1). This can also wait until Day 7.


Build `src/lib/sync/` exactly to contract #5.

### Steps
1. `types.ts`: copy the interfaces from `CONTRACTS.md`.
2. `registry.ts`: `registerCollection` stores collections by table.
3. `engine.ts`, `syncAll(userId)`:
   1. **Pull:** for each collection, select the rows for this user with `updated_at > lastPulledAt[table]`, where `lastPulledAt` is persisted in `appStorage` under `fitwizard-sync-cursor`.
   2. **Merge:** for each remote row, compare it with the local item by `key`:
      - Remote newer, or a tombstone newer than the local copy: take remote (a tombstone removes the local item).
      - Local newer: keep local and mark it dirty.
   3. **Push:** upsert the dirty items (`onConflict` on the primary key). A local delete is pushed as `deleted_at = now()`, never a hard delete.
   4. Return `{ pulled, pushed, failed }`. Errors per collection don't stop the other collections.
4. Outbox:
   - Rework `src/lib/offlineSave.ts` into the dirty-set store: `markDirty(table, key)`, persisted in `appStorage` under `fitwizard-sync-outbox`. It is currently memory-only; read its header comment.
   - Keep the idempotency idea from the existing code (acknowledged keys are not re-sent).
5. `status.ts`: `useSyncStatus()` returns `signed-out` when there's no user, `offline` when `!navigator.onLine`, `saving` while a sync is running, `error` on the last failure, and otherwise `synced`.
6. Tests, with a fake Supabase client:
   - first pull into empty local
   - local-only push
   - both sides edited, newer wins (both directions)
   - remote tombstone removes the local item
   - local delete pushes a tombstone
   - a failed push stays in the outbox and succeeds on the next run
   - one collection failing doesn't stop the others
   - the cursor advances only after a successful pull

### Done when
- [ ] All of the above tests pass.
- [ ] `syncAll` is not yet called anywhere.

---

## Day 5: Collections (1.4 part 2)

> **Carried over from Day 2 handoffs and review (added 2026-11-18 by the coordinator).** Do these too:
> - `wizardStore` sanitiser: with the coach flag off, load `selections.isTrainer` as `false` (DEBT-065; Lane C Day 2 handoff has the one-line fix).
> - Remove the `setContext` call in `src/pages/Plan.tsx` (the only use of `wisdomStore`), then delete `src/stores/wisdomStore.ts` and its test (DEBT-067). `Plan.tsx` isn't a Lane E file, so this is a small allowed exception; note it in the handoff.
> - Review findings fixed on #59 (read before writing collections): `markDirty` before the first sync now merges the saved outbox, and one-row tables (`nutrition_settings`, `user_state`) push deletes filtered on `user_id`. Use `keyColumn: null` for those two.


> **Notes from Day 4 (coordinator):**
> - The engine is in `src/lib/sync/`; import from `@/lib/sync`.
> - Each collection also needs `keyColumn` (`'id'`, `'day'`, or `null` for `nutrition_settings` and `user_state`) and `onConflict` (`'user_id,id'`, `'user_id,day'` or `'user_id'`).
> - Deletes call `markDirty(table, key, { deleted: true })`.
> - Test collections with the `FakeServer` in `src/lib/sync/engine.test.ts`. Move it to a shared test helper if two test files need it.

Implement and register one `SyncCollection` per table in contract #3. Each lives in `src/lib/sync/collections/<name>.ts`.

| Collection | Store | Key | Notes |
|---|---|---|---|
| `workout_logs` | `planStore.workoutLogs` | `log.id` | `completed_at`, `total_volume`, `plan_id` from the log |
| `personal_records` | `planStore.personalRecords` | `pr.id` | |
| `nutrition_days` | `nutritionStore.history` | the `YYYY-MM-DD` key | One row per day |
| `nutrition_settings` | `nutritionStore` profile, targets, custom foods, favourites, saved meals | `'settings'` (one row per user) | |
| `body_measurements` | `measurementsStore` | `m.id` | `measured_on` = `m.date` |
| `readiness_entries` | `readinessStore` | the entry date | |
| `user_state` | achievements, custom exercises, favourites | `'state'` | One row per user |

Each item needs an `updatedAt`:
- Add `updatedAt?: string` to each stored item type, set on every write in the store actions.
- Missing values (old data) are treated as the epoch, so the remote copy wins on first conflict.

Then:
- Every store action that writes calls `markDirty(table, key)`.
- Deletes call `markDirty` with a tombstone flag.

**Done when:** each collection has a `toRow`/`fromRow` round-trip test, and each store action marks the item dirty (test with a spy).

---

## Day 6: Triggers, first sign-in, indicator (1.4 part 3)

> **Notes from Day 5 (coordinator):**
> - Call `startSyncCollections()` from `@/lib/sync/collections` once at startup, before any trigger. Load it lazily so the stores stay out of the engine's import path.
> - **Correction to step 2:** local items are **not** all dirty already. Records saved before tracking started (or before Day 5 shipped) have no outbox entry. On the first sign-in on a device, call `markAllCollectionsDirty()` before the first `syncAll`. Its return value is the count for the toast.
> - Record "this device has done its first upload for this account" per user id, so it doesn't re-upload on every sign-in.

### Steps
1. Triggers, in `src/lib/sync/triggers.ts`, started once from `src/App.tsx` (lines 345–349, the existing `syncWithBackend(user.id)` effect; add `startSync(user.id)` next to it):
   - On sign-in.
   - On the `online` event.
   - On app resume: `@capacitor/app` `appStateChange` with `isActive` on native, `visibilitychange` on web.
   - 2 seconds after the last `markDirty` (debounced).
   - Never run two syncs at once; queue one follow-up.
2. **First sign-in with guest data:**
   - All local items are already dirty, because they've never been acknowledged, so the first `syncAll` uploads them.
   - Show a toast: "Saved 12 workouts to your account." Count from the result.
   - If anything fails, reuse the `failedMigrationCount` toast pattern from `planStore.ts:194`.
3. Profile sync indicator:
   - A small row with an icon and text from `useSyncStatus()`: Synced, Saving…, Offline (changes will sync), Sync problem with a **Retry** button.
   - Signed-out users see "Sign in to back up your training."
4. Remove the Day 3 sign-out guard. Sign-out now:
   1. Runs `syncAll`.
   2. If anything is still dirty, warns: "3 changes haven't synced. Sign out anyway?"
   3. Then clears the device copies.
5. Add the analytics calls Lane C handed you (`workout_started`, `workout_completed`, `meal_logged`), if contract #9 has merged.
6. Tests:
   - The debounce triggers once.
   - Concurrent triggers don't overlap.
   - First sign-in uploads everything.
   - Sign-out with pending changes shows the warning.

**Done when:** these tests pass. Lincoln checks the real two-device behaviour at Gate 2.

---

## Day 7: Move plans onto the engine (1.4 part 4)

Start this only after Lane F's Day 5 (Express retirement) has merged, so `plansClient.ts` is in its final shape. Rebase first.

1. Add a `plans` collection backed by the existing `plans` table (migration 004: `(user_id, id)`, `plan jsonb`, `schema_version`). Migration 007 adds `deleted_at` to `plans` (contract #3), so plans use the same tombstone rule as everything else.
2. Point `planStore.syncWithBackend` at `syncAll`, then delete the special-case code:
   - `syncPlanStateWithRemote`, `mergePlanHistory` and `resolveCurrentPlan` in `planSyncService.ts`, unless something still uses them
   - the remote calls in `plansClient.ts`
3. Keep `planMigrations.ts` for `schema_version` upgrades.
4. Update the plan sync tests.

**Done when:** plans sync through the same engine as everything else, and the old plan-sync code is gone.

---

## Days 8–9: Fixes from device testing
Fix sync and storage bugs from the Gate 2 and Day 8 device tests. Add a test for each bug before fixing it.
