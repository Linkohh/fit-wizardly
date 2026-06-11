# FitWizardly — Security, Threat Model & Performance Report

**Version:** 1.1 (final) — initial assessment + Iteration 1 remediation applied and verified
**Date:** 2026-06-11 · **Scope:** Full codebase (706 tracked files) — Vite/React 19 SPA + PWA, Capacitor iOS/Android shell, Express 4 API (`server/`), Supabase (Postgres + Auth + RLS), Vercel edge delivery.
**Assessor role:** Application Security Architect / Principal Systems Engineer.
**Anchor standards:** OWASP Top 10 (2021), OWASP ASVS 4.0 L2, OWASP MASVS (Capacitor shell), Core Web Vitals.

> **What changed in v1.1:** Iteration 1 of the hardening strategy was executed in this session (see §3.1 Remediation Log). Three additional findings surfaced during remediation (F-16…F-18), one original finding was corrected (F-11 was already implemented; part of F-13 was wrong — `.env.example` exists). Rubric scores updated. **Weighted total: 3.78 → 3.98 / 5.**

---

## 1. The Rubric

Each category scored 1–5. Weights sum to 100%.

| # | Category (OWASP anchor) | Weight | v1.0 | **v1.1** | Evidence |
|---|--------------------------|:---:|:---:|:---:|----------|
| R1 | **Broken Access Control** (A01) | 13% | 4.5 | **4.5** | 50 RLS policies across 6 migrations; server re-verifies ownership *after* RLS in every plan handler — now fail-closed (F-09 fixed); client timestamps & `userId` stripped server-side; UUID format gate before DB calls. |
| R2 | **Cryptographic Failures** (A02) | 8% | 4.0 | **4.0** | HTTPS enforced by `validateRemoteEndpoint` on client & server; HSTS preload 2y; HTTP origins rejected in prod CORS. No private secrets in client bundle or git history (audited — see F-16). |
| R3 | **Injection / XSS** (A03) | 10% | 4.5 | **4.5** | Zod `safeParse` on every mutating route; the one production `dangerouslySetInnerHTML` (static CSS in `sheet.tsx`) removed entirely; no `eval`/`new Function`; Supabase parameterizes all queries. |
| R4 | **Insecure Design / Threat Model** (A04) | 8% | 4.0 | **4.0** | Token verified server-side against `auth/v1/user` with 5s abort; user's own JWT forwarded to Supabase (no service-role key anywhere — RLS always applies). Update route uses explicit `pick().partial()` schema (anti-mass-assignment). |
| R5 | **Security Misconfiguration** (A05) | 13% | 3.0 | **4.0** | Dev server now localhost-only with Vite's DNS-rebinding host check restored (F-01 fixed); CSP/style collision removed (F-04 fixed); tracked `.env` untracked (F-16 fixed). Remaining: Helmet CSP disabled on API (F-10). |
| R6 | **Vulnerable & Outdated Components** (A06) | 8% | 3.5 | **4.0** | Both package roots now audit **0 vulnerabilities** (`qs` chain patched, express → 4.22.2). Still missing: CI audit gate / Dependabot (Iteration 2). |
| R7 | **Identification & Auth Failures** (A07) | 9% | 4.0 | **4.0** | Supabase Auth; JWT in `sessionStorage` (deliberate XSS-blast-radius reduction); storage cleanup on sign-out; cross-origin redirect rejection in `authStore`. MFA/leaked-password protection still unverified (F-15). |
| R8 | **Software & Data Integrity** (A08) | 5% | 3.5 | **3.5** | All scripts self-hosted (SRI moot); PWA `autoUpdate` is a silent-update channel with no release attestation; lockfiles present but unaudited in CI. |
| R9 | **Logging & Monitoring** (A09) | 6% | 2.5 | **2.5** | Unchanged — `console.*` only; no structured audit trail or failed-auth alerting. **Now the single weakest pillar; Iteration 2's headline item.** |
| R10 | **SSRF & Egress Control** (A10) | 5% | 3.5 | **4.0** | Dev wger proxy now pins `https:` and refuses redirects (F-06 fixed); prod egress limited to the configured Supabase URL. |
| P1 | **Front-end Performance / CWV** | 10% | 4.0 | **4.0** | 20+ `lazy()` route splits, deliberate `manualChunks`, bundle visualizer wired in. Risks: 65 runtime deps; exercise-data JSON in SW precache (F-08, open). |
| P2 | **Back-end & Mobile Performance** | 5% | 3.5 | **3.5** | 5s upstream timeouts; 512 KB body cap; in-memory single-bucket rate limiter (F-07, open); `CapacitorHttp` globally enabled (F-05, open). |

**Weighted total: 3.98 / 5** (was 3.78). **Scoring legend:** 5 exemplary · 4 production-ready · 3 acceptable with caveats · 2 needs work · 1 critical exposure.

---

## 2. The Findings

> **No Critical findings** at any point. Status reflects the end of this session. LoE: S < ½ day · M = 1–2 days · L = 1 wk+.

### High

| ID | Finding | Status | Fix applied / required | LoE |
|----|---------|:---:|------|:---:|
| **F-01** | Vite dev server LAN-exposed with host checks disabled (`host: "::"` + `allowedHosts: true`) — DNS-rebinding / LAN access to dev middleware while the API-Ninjas key is loaded. | ✅ **Resolved** | `vite.config.ts` now binds `localhost` and drops `allowedHosts: true` (Vite's secure default host check restored). `scripts/dev-ios-live.mjs` passes `--host ::` explicitly for Capacitor live reload — iPhone testing unaffected (Vite always accepts direct-IP requests). | S |
| **F-02** | No structured audit logging or auth-failure telemetry — credential stuffing is undetectable. | ⬜ Open | Iteration 2: pino + event taxonomy (`auth.reject`, `cors.deny`, `ratelimit.hit`, `acl.forbidden`) + log drain/alerting. The existing per-request ID middleware (`server/src/index.ts:222`) is a ready-made attachment point. | M |

### Medium

| ID | Finding | Status | Fix applied / required | LoE |
|----|---------|:---:|------|:---:|
| **F-03** | `qs` moderate DoS chain in server deps (GHSA-q8mj-m7cp-5q26 via express 4.22.1). | ✅ **Resolved** | `npm audit fix` in `server/` — express now 4.22.2, **0 vulnerabilities** in both package roots. | S |
| **F-04** | Prod CSP (`style-src` without `'unsafe-inline'`) silently blocks the inline `<style>` injected by `sheet.tsx:360`. | ✅ **Resolved** | Inline `<style>` block removed; `bounce-right` keyframes moved to `src/index.css` (CSP-compliant external stylesheet). Unused `.glow-edge-shimmer` rule deleted as dead CSS. A full prod-CSP smoke pass on a deployed build is still recommended. | S |
| **F-05** | `CapacitorHttp: { enabled: true }` globally bypasses WebView CORS for every request in the mobile shell. | ⬜ Open | Iteration 3: disable globally; call the `CapacitorHttp` API explicitly only for wger/openfoodfacts. | M |
| **F-06** | Dev wger proxy followed redirects → residual SSRF pivot despite hostname allowlist. | ✅ **Resolved** | Proxy now requires `https:` on the target URL and fetches with `redirect: 'error'`. | S |
| **F-07** | In-memory rate limiter, one global bucket shared by writes and health checks. | ⬜ Open | Iteration 2: route-scoped stricter limits on writes; durable store (Redis/Upstash) before horizontal scale. | M |
| **F-08** | PWA precache ships heavyweight exercise datasets (`wger-snapshot.v1.json` etc.) — install cost on low-end Android. | ⬜ Open | Iteration 3: move to workbox `runtimeCaching` (stale-while-revalidate). | S |
| **F-16** 🆕 | **`.env` was tracked in git** despite the `.gitignore` rule (committed before the rule; gitignore doesn't apply to already-tracked files). Contents: Supabase URL + anon key — public-by-design (they ship in the client bundle), so not a live secret leak, but a tracked `.env` normalizes committing env files and the *next* variable added could be a real secret. | ✅ **Resolved** | `git rm --cached .env` (file kept on disk; ignore rule now effective). Full history audited: only the five public `VITE_*` vars were ever committed — **no rotation required**. | S |
| **F-17** 🆕 | **Pre-existing failing test** — `sheet.test.tsx > closes a right-side gesture drawer when swiped past the threshold` fails on the parent commit too (verified by stash-and-rerun). A permanently red suite masks real regressions and trains people to ignore CI. Likely fallout from commit `970da4c` (edge-swipe gesture unification). | ⬜ Open | Diagnose whether component or test is wrong; restore a green baseline. (Flagged as a separate background task.) | S |
| **F-18** 🆕 | CORS is configured with `credentials: true`, but the API is pure Bearer-token — no cookies are ever used. Credentialed CORS needlessly widens what an allowlisted origin may do and forbids future `*` relaxations. | ⬜ Open | Drop `credentials: true` (one-line; verify the frontend never sends `credentials: 'include'`). | S |

### Low

| ID | Finding | Status | Fix applied / required | LoE |
|----|---------|:---:|------|:---:|
| **F-09** | Ownership defense-in-depth check failed open when `userId` was falsy (`if (planData.userId && …)`). | ✅ **Resolved** | All three handlers (get/update/delete) now fail closed (`planData.userId !== userId`). Safe because `toApiPlan` in `supabasePlansRepo.ts` always populates `userId` from the row's `user_id` column. All 14 server tests pass, including both ownership-rejection tests. | S |
| **F-10** | Helmet runs with `contentSecurityPolicy: false` on the API. | ⬜ Open | Set a minimal API CSP (`default-src 'none'; frame-ancestors 'none'`). | S |
| **F-11** | ~~No request body size limit~~ — **withdrawn**: verification showed `express.json({ limit: '512kb' })` already present at `server/src/index.ts:220`. | ✅ N/A | Already implemented before this assessment. | — |
| **F-12** | JWT in `sessionStorage` is script-readable; mitigated by strict CSP. Long-term ceiling is a cookie-based BFF session. | ⬜ Open | Record as ADR; roadmap item. | S |
| **F-13** | *(Corrected)* `.env.example` **does** exist — original claim was wrong. Still missing: `SECURITY.md`, `/.well-known/security.txt`, Dependabot/Renovate config. | ⬜ Open | Add disclosure + update-automation files. | S |
| **F-14** | Docs drift: CLAUDE.md says Tailwind 3.4; lockfile has `tailwindcss@4.2.4`. | ⬜ Open | Refresh stack docs. | S |
| **F-15** | Supabase project-level auth settings (MFA, leaked-password protection, OTP expiry, captcha) not verifiable from code. | ⬜ Open | Dashboard review. | S |

---

## 3. The Hardening Strategy

### 3.1 Remediation Log — Iteration 1 (✅ executed this session)

**Files changed:**

| File | Change |
|------|--------|
| `vite.config.ts` | Dev server binds `localhost` (was `::`); removed `allowedHosts: true` (secure Vite default restored); wger proxy now requires `https:` targets and uses `redirect: 'error'`. |
| `scripts/dev-ios-live.mjs` | Passes `--host ::` explicitly when launching Vite, preserving Capacitor LAN live-reload as an opt-in rather than the default posture. |
| `server/src/index.ts` | Ownership checks in `getPlan`, `updatePlan`, `deletePlan` converted from fail-open to fail-closed. |
| `server/package-lock.json` | `npm audit fix` — `qs` chain patched, express 4.22.1 → 4.22.2. |
| `src/components/ui/sheet.tsx` | Inline `<style dangerouslySetInnerHTML>` removed (CSP-blocked in prod). |
| `src/index.css` | `bounce-right` keyframes + `.animate-bounce-right` relocated here; dead `.glow-edge-shimmer` rule dropped. |
| `.env` (git index) | Untracked via `git rm --cached` — file remains on disk for local dev; gitignore now effective. History audited clean. |

**Verification evidence:**
- Server suite: **14/14 pass**, including "rejects GET/PATCH/DELETE for a plan owned by a different user" (exercises the new fail-closed paths).
- Frontend suite: **407/408 pass**; the single failure (`sheet.test.tsx` gesture-close) was proven pre-existing by stashing the changes and re-running — identical failure on the parent commit (→ F-17).
- ESLint: **0 errors** (4 pre-existing warnings, untouched files).
- `npm audit`: **0 vulnerabilities** in both the root and `server/` package trees.
- Git history of `.env`: only `VITE_USE_API`, `VITE_API_URL`, `VITE_PLANS_PROVIDER`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ever committed — all public-by-design client values; no rotation needed.

**Not yet verified:** the CSP fix (F-04) against a *deployed* production build — recommend loading the next Vercel preview with DevTools open and confirming zero `Content-Security-Policy` violations while opening a right-side sheet.

### 3.2 Iteration 2 — "See the attacks" (1 sprint, next)
1. Structured security event logging (pino + event taxonomy) hung off the existing request-ID middleware; drain to Supabase `security_events` or a log service; alert on auth-reject spikes (F-02).
2. Route-scoped rate limits (strict on writes); durable store when scaling (F-07).
3. CI gates: `npm audit --audit-level=high` for both package roots, plus a Playwright check asserting prod security headers (Playwright is already wired). Restore the green test baseline first (F-17) so gates mean something.
4. Drop `credentials: true` from CORS (F-18); add `SECURITY.md`, `security.txt`, Dependabot (F-13).
5. Supabase dashboard pass: MFA, leaked-password protection, OTP expiry (F-15).

### 3.3 Iteration 3 — "Shrink the mobile surface & weight" (1–2 sprints)
6. Scope `CapacitorHttp` to explicit calls; verify CSP inside the WebView (F-05).
7. Exercise datasets: precache → runtime caching; re-budget with the wired-in bundle visualizer (F-08).
8. Minimal API CSP via Helmet (F-10); token-storage ADR (F-12); docs refresh (F-14).
9. Quarterly: re-run this rubric — **v1.1 scores are the regression baseline.**

---

## 4. Proprietary Innovations

Forward-looking, defensible concepts that exploit assets this codebase *already has* (RLS-scoped social graph, Capacitor haptics, offline PWA, deterministic plan generator):

### 4.1 **Provenance-Sealed Training Ledger** ("Receipts for Reps")
Every logged set is appended to a per-user **hash chain** (each entry hashes the previous one + monotonic device clock), sealed server-side on sync. Result: a *tamper-evident* training history. In Circles, PRs and challenge results render with a "verified streak" seal — provably not backfilled or edited. No competitor offers cryptographic anti-cheat for social fitness challenges; it turns the security posture into a **visible product feature** and makes the social graph trustworthy enough for real stakes (trainer accountability, sponsored challenges).

### 4.2 **Haptic Periodization Grammar** (phone-in-pocket coaching)
`@capacitor/haptics` already ships. Define a proprietary **vibration grammar** — distinct tactile signatures for "last RIR rep," "rest over," "tempo: 3-1-1," "deload week" — so the user trains screen-free with the phone in a pocket. The grammar (timing/intensity patterns mapped to the RIR/MRV engine's outputs) is novel, brandable, and defensible as a *non-visual prescription delivery system*. No fitness app couples haptics to a periodization engine rather than to generic timers.

### 4.3 **Plan Genome** — signed, offline-shareable plan seeds
The wizard's output is deterministic from its inputs. Encode any plan as a compact, **signed seed string/QR** ("genome") that regenerates the full plan client-side — no server roundtrip, works fully offline in the gym. Trainers hand clients a QR; the signature (server-issued, verified against the trainer role model from `005_trainer_roles.sql`) proves authorship and blocks tampered programming. A viral share loop *and* an integrity guarantee in one primitive.

### 4.4 **Gym Mesh** — CRDT offline-first co-training
Gyms are connectivity dead zones. Use a CRDT log (the workout log is naturally append-only — ideal) so two Circle members in the same gym sync sets **peer-to-peer over local network** via the Capacitor shell, reconciling with Supabase when signal returns. Live "spotter board" with zero infrastructure mid-session; the conflict-free merge of the provenance ledger (4.1) on reconnect is the proprietary hard part competitors won't replicate quickly.

### 4.5 **Live Privacy Nutrition Label**
Generate an in-app, always-current "privacy facts" panel **from the code itself**: parse the CSP `connect-src`, the Capacitor plugin manifest, and the analytics store config at build time into a user-readable label ("Your data goes to: Supabase, nowhere else. Camera: never."). Drift between claim and code fails the build — self-auditing privacy-as-feature, a genuine differentiator in a category with notoriously bad data practices.

---

## Bottom line

After Iteration 1, every quick-win exposure is closed: the dev server no longer trusts the LAN, the SSRF pivot is sealed, ownership checks fail closed, dependencies audit clean in both trees, the CSP no longer fights the UI, and the tracked `.env` foot-gun is defused (with history verified clean). The two items that most deserve the next sprint are **observability (F-02)** — still the lowest rubric score at 2.5 — and **restoring the green test baseline (F-17)** so future CI gates actually gate. Residual architectural risk is Low across the board; the remaining work is operational discipline, not redesign.
