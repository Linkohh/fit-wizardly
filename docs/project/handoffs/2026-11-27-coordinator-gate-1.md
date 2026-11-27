# Handoff: Coordinator, Gate 1 checks and Lincoln's decisions, 2026-11-27

## Lincoln's decisions (2026-11-27)
| Item | Decision |
|---|---|
| D3 launch languages | **English + Spanish** for v1. The language picker stays able to add more languages later (de and pt are partly translated). J1 and J2 stay in the plan |
| DEBT-142 home headline | Left to the coordinator: **replace** with "Science-based workout plans, built around you." Given to Lane B (Day 6 buffer), together with DEBT-140 |
| L4 Apple / Google enrolment | **Deferred** (side burner) |
| L7 phone and Mac testing | **Deferred** until everything else is ready |
| L9 legal review | **Go:** privacy policy and terms, checked against GDPR (and the US state laws that apply). Lane A Day 8 prepares the pre-review pack. A qualified person still signs it off |
| Store review / submission (Gate 3) | **Wait** |
| Focus now | Finish Gate 1, then finish Wave 2 |

## Gate 1: what was checked, on `preview_b` at 8c97252
### Code checks
- lint: 0 errors (4 old warnings)
- typecheck: pass
- unit tests: **1266/1266** (202 files)
- `npm run test:db`: all database checks pass (007, 008, 009, plans tombstones)
- build: pass

### Browser checks (production build, `vite preview`, headless Chromium)
A fresh visitor accepted consent and finished onboarding, then:

| Gate 1 item | Result |
|---|---|
| No AI wording anywhere | ✅ None on `/`, `/about`, `/legal`, `/wizard`, `/exercises`, `/plan`, `/history`, `/analytics`, `/nutrition`, `/profile` (page text, title and meta tags) |
| Circles and coach portal can't be reached | ✅ `/circles`, `/circles/join/…`, `/circles/:id`, `/clients`, `/clients/:id`, `/templates`, `/revenue` all show 404; an unknown route also shows 404 (control); no Circles link on the page |
| A guest's plan and workout survive a reload | ✅ `lifter-loop.spec.ts`: plan, log, reload partway, finish, everything kept in a new page. Full chromium suite: 13 passed, 2 skipped (WebKit-only) |
| A guest's meal survives a reload | ✅ Checked by hand with a script. A custom meal (432 kcal), 500 ml of water and the nutrition setup are all still there after a reload and in a new tab. Saved in on-device storage; **nothing in localStorage** (ADR 11) |
| The site loads offline after the first visit | ✅ `/` and `/history` load with the network off, and the offline banner shows |

### Not checked yet (needs Lincoln)
| Gate 1 item | Why it's blocked |
|---|---|
| Apply 007 and 008 to a **staging** Supabase project | L10: the staging project doesn't exist yet. The database tests run on local Postgres with a stub `auth` schema, never on real Supabase |
| Email-code sign-in works | Needs a Supabase project and L11 (`{{ .Token }}` in the email template). Signing in on the beta site is still off-limits until staging exists |

## Notes for lanes
- **J2:** `src/components/nutrition/FoodLogger.tsx` still has hard-coded English ("Third-party food search is off.", "Food Name", "Save & Log Food", and the tab names). This is already in J2's Day 8 scope.
- **Lane A:** fold this note into `BOARD.md` and `SESSION_LOG.md`. Gate 1 should show as "app checks done; database checks waiting on L10/L11".
