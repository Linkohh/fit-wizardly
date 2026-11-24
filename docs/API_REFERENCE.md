# API Reference

> **Rewritten on Lane F Day 5 (2026-11-23).** The Express API in `server/` (`/plans`, `/health`) was retired (roadmap 1.7, decision D1). Plans and all other user data go straight to Supabase from the client, protected by row-level security. See `docs/SUPABASE_MIGRATIONS.md` and `docs/SECURITY.md`.

FitWizard has two kinds of server code:

| Kind | Where | What |
|---|---|---|
| Vercel functions | `api/` | Exercise search, motivation quotes, wger proxy. Public, no sign-in |
| Supabase Edge Function | `supabase/functions/delete-account/` | Account deletion (contract #4). See its `README.md` |

Everything else (plans, workout logs, nutrition, measurements and so on) is read and written with the Supabase client (`src/lib/supabase.ts`, `src/lib/plans/supabasePlansRepo.ts`, `src/lib/sync/`).

---

## Calling the Vercel functions

- **Web:** call the path as-is (`/api/...`); it resolves against the page origin.
- **Native (Capacitor):** wrap the path in `apiUrl()` from `src/lib/apiBase.ts` (contract #6). It prefixes `VITE_PUBLIC_APP_ORIGIN`, because the WebView origin has no `/api`.
- **Local dev:** `npm run dev` serves the same three paths from the Vite dev server (`vite.config.ts`, `wgerProxyPlugin`). No separate server is needed.

## Shared guard (`api/_lib/guard.ts`)

Every function calls `createApiGuard()` first.

| Check | Behaviour |
|---|---|
| CORS | Origins allowed: `ALLOWED_ORIGINS` (comma-separated), the deployment's own Vercel URLs, and the native origins `capacitor://localhost` and `https://localhost`. Any other `Origin` gets `403 ORIGIN_NOT_ALLOWED`. Requests with no `Origin` are allowed |
| Methods | `GET` and `OPTIONS` (preflight answers `204`). Anything else gets `405 METHOD_NOT_ALLOWED` |
| Rate limit | 60 requests per minute per IP, in memory, per function instance (best-effort). Over the limit: `429 RATE_LIMITED` with `Retry-After` |

Guard errors use `{ "error": string, "code": string }`. Handler errors use `{ "error": string }`.

## Endpoints

### `GET /api/exercise-search-ninjas`

Searches API Ninjas for exercises. Needs `API_NINJAS_API_KEY` (server-only; never prefix with `VITE_`).

| Query | Required | Notes |
|---|---|---|
| `name` | Yes | Search text. Missing: `400 { "error": "Missing name parameter" }` |
| `type`, `muscle`, `difficulty`, `equipments` | No | Passed through as filters |

`200 { "results": NormalizedExercise[] }`. Source: `src/lib/services/api/apiNinjasExerciseEndpoint.ts`.

### `GET /api/motivation-quote`

Returns one motivation quote from API Ninjas. `200 { "quote": RemoteMotivationQuote | null }`; `null` when the key is missing or the upstream fails, and the app then shows a bundled quote. Source: `src/lib/motivation/motivationQuoteEndpoint.ts`.

### `GET /api/proxy-wger?url=<https://wger.de/...>`

Fetches a wger.de API URL on the client's behalf.

| Status | When |
|---|---|
| `200` | The upstream JSON, unchanged |
| `400` | `url` missing or not a valid URL |
| `403` | Not `https:`, or the host isn't `wger.de` / `www.wger.de` |
| upstream status | wger answered with an error: `{ "error": "Wger API returned HTTP <status>" }` |
| `502` | The upstream request failed (redirects are refused). Generic body, no details |

Source: `api/proxy-wger.ts`.

## Delete account (Supabase Edge Function)

`POST {VITE_SUPABASE_URL}/functions/v1/delete-account` with the user's bearer token. `204` on success, `401` without a valid session, `500 { "error": "Deletion failed" }` otherwise. Full contract in `docs/project/CONTRACTS.md` (#4); deploy steps in `supabase/functions/delete-account/README.md`. The client wrapper is `src/lib/account/deleteAccount.ts`.
