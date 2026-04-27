# Security Best Practices Report

## Executive Summary

The current tracked source no longer contains the exposed Supabase legacy anon JWT or any detected Vercel, Supabase service/secret, GitHub, OpenAI, Anthropic, Stripe, or private key material. Vercel now uses Supabase publishable keys in Production, Preview, and Development. The exposed legacy key still exists in Git history and ignored local artifacts, so the old legacy key material should be deactivated only after the publishable-key deployment is live and verified.

## Critical

### SEC-001: Supabase legacy anon JWT exists in Git history

Impact: Anyone with access to the repository history could recover the old browser Supabase anon JWT until it is invalidated in Supabase.

- Location: historical `.env:5`
- Evidence: history scan found a JWT-like token at `.env:5` across prior commits; current `.env` is sanitized.
- Fix applied: current tracked `.env` now contains placeholders only.
- Required provider action: rotate away from the exposed legacy JWT and revoke/deactivate the old Supabase key material after a verified deployment uses the replacement.

## High

### SEC-002: Vercel Supabase key rotation verified

- Location: Vercel project `lins-projects-d5791edf/fit-wizardly`
- Evidence: type-only Vercel env verification classified `VITE_SUPABASE_ANON_KEY` as `supabase-publishable` for Production, Preview, and Development.
- Status: fixed for future Vercel deployments.
- Follow-up: after the new deployment is live and verified, revoke/deactivate the old legacy key material in Supabase.

## Medium

### SEC-003: Ignored local artifacts still contain the local legacy JWT

- Locations: `.env.local:5`, `dist/...`, `android/app/src/main/assets/public/...`, `ios/App/App/public/...`
- Evidence: local scan found JWT-like values in ignored local-only files and generated bundles.
- Risk: these files are not tracked, but they can leak if copied, uploaded, or used for a mobile build.
- Required local action: after rotation, repull `.env.local`, delete `dist`, and regenerate Capacitor assets from the rotated env.

## Low

### SEC-004: Separate local Claude worktree contains stale env material

- Location: `.claude/worktrees/trusting-almeida/.env:5`
- Evidence: workspace scan found a JWT-like local env value in the separate worktree.
- Risk: not part of the current branch push, but it is another local copy of the old key.
- Required local action: sanitize or delete that worktree env file after preserving anything still needed.

### SEC-005: Hosted Supabase schema is missing later app tables

- Location: live Supabase project referenced by Vercel Production env.
- Evidence: live REST checks reported `public.plans` and `public.exercise_stats` missing from the schema cache.
- Risk: plan sync and exercise community stats features may fail until migrations `002_exercise_interactions_schema.sql` and `004_plans_schema.sql` are applied.
- Required provider action: apply the missing Supabase migrations before relying on those features in production.

## Fixes Applied In This Branch

- Sanitized tracked `.env`.
- Updated `.env.example`, `README.md`, `docs/ORCHESTRATION.md`, and `docs/SECURITY.md` to avoid secret-like examples.
- Updated `server/src/index.ts` so `.env.local` overrides stale tracked defaults.
- Added `docs/VERCEL_SECRET_ROTATION.md` with a no-downtime rotation runbook.

## Verification

- Current tracked source scan: no significant tracked findings.
- Git history scan: only historical `.env:5` legacy JWT finding; no Vercel tokens, service/secret keys, GitHub tokens, OpenAI keys, Anthropic keys, Stripe secrets, or private keys detected.
- Vercel env verification: Production, Preview, and Development all use Supabase publishable key format.
- Live Supabase smoke test: auth health reachable, existing `profiles` and `circles` tables reachable, anonymous writes to protected tables blocked.
- Live schema note: `plans` and `exercise_stats` were not present in the hosted Supabase schema cache.
