# Handoff: Lane {X}, Day {N}, {YYYY-MM-DD}

> Save as `docs/project/handoffs/{YYYY-MM-DD}-lane-{x}-day-{N}.md`. Keep it short and factual. Lane A copies it into the board and session log.

## Status
- **PR:** #___ `[Lane {X} · Day {N}] …`
- **Result:** Done / Partly done / Blocked
- **Checks:** lint ___ errors, ___ warnings · typecheck pass/fail · tests ___/___ passing · other checks (Playwright, database harness): ___

## What changed
- Bullet list of user-visible and technical changes, with file paths.

## Not done (and why)
- Item: reason. Where it should go next (same lane tomorrow, a buffer day, or another lane).

## Contracts
- Provided or changed: name, and whether it matches `CONTRACTS.md` exactly. Any deviation needs Lincoln's OK.
- Stubbed while waiting on: contract #, provider lane.

## For other lanes
- **To Lane {Y}:** exact one-line changes they need to make in files they own (for example a `track()` call), with the file and line.

## For Lane A (docs, legal, board)
- Disclosure text for `Legal.tsx` (new stored data or third parties).
- Rows to add to `docs/store/DATA_INVENTORY.md`.
- Doc corrections found.

## New issues found
| ID (proposed) | Severity | File | Description |
|---|---|---|---|
| DEBT-0xx | LOW/MEDIUM/HIGH | path | one line |

## Unverified
- Anything you couldn't run for real in this environment (native builds, Supabase, devices, third-party dashboards), and how Lincoln can check it.

## Questions for Lincoln
- Numbered questions. Each one states the default you'll use if there's no answer.
