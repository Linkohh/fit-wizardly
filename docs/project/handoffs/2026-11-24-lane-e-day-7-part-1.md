# Handoff: Lane E, Day 7 (part 1: safe sign-out), 2026-11-24

> Run in the coordinating session on `claude/fitzwizardly-preview-b-analysis-96ptn8`, from `preview_b` @ `bdd59f5`.

## Status
- **PR:** `[Lane E · Day 7a] Safe sign-out: sync first, warn, then erase this device`. The number is in the session log.
- **Result:** Part 1 of Day 7 is done. Part 2 (plans onto the sync engine) is a separate PR.
- **Checks:**
  - lint: 0 errors, 4 warnings (the existing ones)
  - typecheck: pass
  - tests: **1126/1126** in 185 files
  - build: pass
  - Playwright chromium: **10 passed**

## What changed
- **There was no visible way to sign out on a phone.** The only "Sign Out" was in the ⌘K command palette. `Profile.tsx` imported a sign-out icon but never rendered a button. The Profile **Cloud backup** card (Lane E's block) now has a **Sign out** button.
- **Safe sign-out** (`src/lib/sync/signOut.ts`, `src/components/sync/SignOutDialog.tsx`), used by the Profile button and the command palette:
  1. `prepareSignOut()` syncs one last time (skipped while offline) and counts the changes that are still unsent.
  2. If any are unsent, a dialog explains that signing out removes the training from this device and those changes would be lost. The choices are **Stay signed in** or **Sign out anyway**.
  3. `completeSignOut()` stops the sync triggers, waits for any sync in progress, signs out quietly, then **erases this device's training data** (`clearLocalUserData()`). That closes **DEBT-045**: shared phones and computers no longer show the previous account's training.
  4. Then a toast: "Signed out. Your training is saved in your account and removed from this device."
- **Order matters:** erasing marks every record as deleted in the outbox. Sync is stopped and drained first, so those deletions are never pushed to the account. A test pins this order and fails if `stopSync()` is removed (checked).
- New helpers: `stopSync()` (`triggers.ts`) and `waitForRunningSync()` (`engine.ts`).
- `wizardStore` default `sessionDuration` changed from 60 to **45**, to match Lane B's 3 × 45 first-plan default.
- **Command palette** (`CommandPalette.tsx`, Lane C's file): the Sign Out command now uses the same safe flow. This is a two-line allowed exception, needed so there's only one sign-out path.
- **Locales:** 7 new `sync.*` keys in en and es, added as text. The de and pt gaps are recorded.

## How it was verified
- `signOut.test.ts` (4 tests):
  - syncs, then counts what's unsent
  - offline: no sync attempt, still counts
  - the order stop → drain → sign out → erase
  - an erase failure after sign-out is still reported as success
- `SyncStatusRow.test.tsx` (2 new tests): with nothing unsent it signs out straight away. With 3 unsent it shows the warning; Stay signed in cancels and Sign out anyway proceeds.
- The full suite and the Playwright lifter loop pass.

## Not done (and why)
- **Sessions that end on their own** (token expired, or the account was deleted on another device) still keep device data, with the "data stays on this device" toast. Erasing on any `SIGNED_OUT` event could wipe a guest's data after a token problem, so it's left as is on purpose. After an account is deleted on device A, device B's next refresh fails, B is signed out, and its local copy stays until the user erases it from Profile. Logged as DEBT-111, LOW.
- **Plans onto the sync engine**, and the hard deletes in `supabasePlansRepo`: Day 7 part 2, next PR.
- DEBT-101 (a finished workout possibly lost on an instant tab close) is accepted as a known limitation. The only full fix would keep user data in localStorage, which ADR 11 rules out.

## For other lanes
- **Lane C:** the command palette's Sign Out now calls `useSafeSignOut().requestSignOut()`, and the dialog renders next to `CommandDialog`. Keep both if you edit the file.
- **Lane A:** the inventory and policy should say that signing out removes training data from the device, after a final sync; the account keeps it. Also note the new Profile **Sign out** button.

## New issues found
| ID | Severity | File | Description |
|---|---|---|---|
| DEBT-111 | LOW | `src/stores/authStore.ts` | A session that ends on its own (expired token, or the account deleted on another device) keeps the device's training data. The user can erase it from Profile. Deliberately not automatic. |
