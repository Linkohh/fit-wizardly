---
name: auth_hardening_status
description: Status and outcomes of the Codex auth hardening work and follow-up audit (March 2026)
type: project
---

Auth hardening was completed in two phases: Codex (PR base) then Claude audit (PR #23).

**Why:** The app's `RequireAuth` component had a `strict` prop defaulting to permissive, making most "protected" routes actually guest-accessible. Product direction is demo-first pre-beta, so routes were explicitly split into public/demo vs auth-backed.

**Current state (post PR #23):**
- Public/demo routes: `/`, `/wizard`, `/plan`, `/workout/:planId/:dayIndex`, `/nutrition`, `/history`, `/analytics`, `/profile`, `/exercises`, `/circles`, `/circles/join/:inviteCode`, `/mcl`, `/legal`, `/guide`
- Auth-backed: `/circles/:circleId/*`
- Auth + trainer mode: `/clients`, `/clients/:clientId`, `/templates`, `/revenue`
- `AuthModal` is at app level (not circles-local)
- `authSubscription` module-level reference prevents duplicate listeners
- Server (`server/src/index.ts`) uses `createApp`/`createRouteHandlers`/`startServer` pattern for testability

**How to apply:** When adding new routes, be explicit about which tier they belong to. Do not wrap in `<RequireAuth>` unless the feature is genuinely account-backed. Trainer routes always need both `<RequireAuth>` and `<TrainerGuard>`.
