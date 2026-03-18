---
name: test_baseline
description: Established test baseline after auth hardening audit (March 2026)
type: project
---

After PR #23 merged, the passing baseline is:

- Frontend (Vitest): **184/184** across 40 test files
- Server (node:test): **13/13** in `server/test/index.test.ts`

**Why:** Two pre-existing failures were fixed — a duplicate exercise ID (`plyo_push_up`) in the migration-generated database, and a `suggestSplitAdjustment` function using `new Date()` directly (making tests fail once fixture dates aged past the 28-day lookback window). The function now accepts an optional `referenceDate` parameter.

**How to apply:** If `npm run test:run` shows fewer than 184 passing, something regressed. The two previously-failing tests (`exercises.test.ts` uniqueness check, `progressionEngine.phase3.test.ts` split suggestion) should now always be green.
