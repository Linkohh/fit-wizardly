# Handoff: Lane E, Day 7 (part 2: plans on the sync engine; review fixes), 2026-11-24

> Same branch and PR as part 1 (#81). Part 1's handoff: `2026-11-24-lane-e-day-7-part-1.md`.

## Status
- **Result:** Day 7 is done. Lane E's Wave 2 work is complete.
- **Checks:**
  - lint: 0 errors, 4 warnings (the existing ones)
  - typecheck: pass
  - tests: **1124/1124** (lower than part 1 because the old plans-client tests were deleted with the code)
  - build: pass
  - Playwright chromium: **10 passed**

## What changed
- **Plans now sync through the same engine as everything else** (`plansCollection` in `src/lib/sync/collections/training.ts`, table `plans`, `deleted_at` from migration 007).
  - **Deleting a plan** writes a tombstone, so it's removed on the user's other devices too. Before, a plan deleted on one device could come back from another.
  - **The 20-plan history cap never deletes anything from the account.** The device keeps the newest 20, and a plan dropping off that list is not a delete. The plans collection uses a new `trackDeletions: false` option, and `deletePlanFromHistory()` marks real deletes itself.
  - **After a pull, the current plan follows the merged copy.** It's cleared if the plan was deleted elsewhere, and a device with no current plan takes the newest.
  - Rows go through the same checks as the device copy (`sanitizePlan`).
- **Plan edits** (exercise prescription, exercise swap, progression) now update plan history as well as the current plan, so the change is synced. Before, a guest's edits only reached the current plan.
- **Removed:**
  - `src/lib/plans/plansClient.ts` and its test
  - the hard-delete and list functions in `supabasePlansRepo.ts` (the `rowToPlan`/`planToRow` converters are kept)
  - `syncPlanStateWithRemote`, `mergePlanHistory` and `resolveCurrentPlan` in `planSyncService.ts`
  - `planStore.syncWithBackend`, and its two effects in `App.tsx` (sign-in and `online`; the sync engine's triggers cover both)
  - the direct server saves in `planStore`

## Review findings on #81, fixed
1. **Sign-out could erase changes without warning.** Plans had their own save path, and exercise favourites have their own offline queue (`preferencesStore.offlineQueue`).
   - Plans now go through the engine, so they're counted.
   - `prepareSignOut()` also sends the favourites queue (`syncToCloud()`), and includes any still unsent in the warning count.
   - Test: `signOut.test.ts`, "also sends and counts queued exercise-favourite changes".
2. **A late load could restore the signed-out account's data after the erase.**
   - The old plan load is gone.
   - `preferencesStore.loadFromCloud()` and `syncToCloud()` now drop their result if the user changed while the request was in flight.
   - Test: `useUserPreferences.test.ts`, "ignores a cloud load that finishes after the user signed out". It fails without the fix (checked).

## How it was verified
- **Plan tests** (`collections.test.ts`):
  - a plan made on phone A reaches phone B and becomes its current plan (dates come back as `Date`)
  - deleting it on B leaves a tombstone, not a hard delete
  - 21 saved plans: none marked deleted. This test fails if `trackDeletions` is set to true for plans (checked).
  - the round trip of every collection, plans included (compared without the server's `userId`/`updatedAt`/`schemaVersion`)
- The sync tests passed twice in a row; the full suite and the Playwright lifter loop pass.

## Contracts
- **#5:** plans are a collection now, and `createStoreCollection` gains `trackDeletions`. `CONTRACTS.md` is updated.

## For other lanes
- **Lane A:** the inventory's Workout plans row says plans sync through the same engine, and deletes reach other devices. `plansClient` and `deletePlanSupabase` no longer exist; update any doc that names them.
- **Lane F (Day 6, Circles queries):** nothing in `src/lib/plans` calls Supabase directly any more.

## Unverified
- Not run against real Supabase (needs L10). At Gate 1: create a plan on one device and see it on a second; delete it and see it go.
