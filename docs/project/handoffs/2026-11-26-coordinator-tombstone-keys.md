# Handoff: Coordinator (Lane E), deleted items with wiped content, 2026-11-26

## Why
- **Lincoln's decision on DEBT-097:** wipe the content of deleted items, so a user can delete their data without deleting their account.
- **Lane F's part:** migration 009, a database trigger that empties a row's content columns when it's marked deleted.
- **This change:** makes the app ready for those emptied rows. **It must ship before 009 is applied to production.**

## The problem it fixes
- When pulling, the sync engine (`src/lib/sync/engine.ts`) read every row's content with `fromRow`, deleted rows included.
- An emptied row makes `fromRow` throw. The engine then skips the row, so the delete would never reach the user's other devices, and the item would stay there.

## What changed
- **`engine.ts`:** a deleted row is now matched by its key alone, through the new `keyOfTombstone()`. Its content is never read.
  - Keyed tables use the key column: `id` or `day`.
  - One-row-per-user tables (`nutrition_settings`, `user_state`) use the single local item's key.
  - Live rows are read exactly as before.
- **No collection or contract shape changed.** `SyncCollection` is the same.

## Tests (`src/lib/sync/engine.test.ts`)
- **New:** "removes an item deleted elsewhere even when the server has wiped its content (DEBT-097)".
- **New:** "removes a one-row-per-user item deleted elsewhere with its content wiped".
- **Test collection made realistic:** its `fromRow` now throws on missing content, as the real collections do through `required(...)`.
- **Mutation check:** with the old `engine.ts`, both new tests **fail**. With this change they pass.

## Checks
- lint: 0 errors
- typecheck: pass
- tests: **1244/1244**
- build: pass
- Playwright chromium: 13 passed

## Order for production (Gate 2 / L2)
1. Ship this client change.
2. Then apply Lane F's 009.

Applied the other way round, older app versions would keep deleted items on other devices until they update. Lane F's `docs/SUPABASE_MIGRATIONS.md` steps state this order.

## For Lane A
- Once 009 is merged, the Google Data Safety answer for "delete data without deleting the account" can become **Yes**.
- The privacy policy should say deleted items are wiped right away, and only the deletion marker remains so other devices remove them.
