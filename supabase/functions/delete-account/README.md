# `delete-account` Edge Function

Deletes the signed-in user's account and **all** of their data. Both app stores require this. The contract is #4 in [`docs/project/CONTRACTS.md`](../../../docs/project/CONTRACTS.md).

| File | What it is |
|---|---|
| `index.ts` | Entry point: `Deno.serve(createHandler(...))` with the real supabase-js client and `Deno.env` |
| `handler.ts` | All the logic, with no imports, so it can be tested with a mocked client |
| `index.test.ts` | Deno unit tests (mocked client, no network) |

## What it does

```
POST {SUPABASE_URL}/functions/v1/delete-account
Authorization: Bearer <the signed-in user's access token>
apikey: <anon / publishable key>
(no body)
```

1. `OPTIONS` returns `204` with CORS headers. Any method other than `POST` returns `405`.
2. It reads the `Authorization` header. If the header is missing or isn't `Bearer <token>`, it returns `401 {"error":"Not authenticated"}`.
3. It creates a client with the **anon key plus the caller's header** and calls `auth.getUser(token)`. If the token is invalid or expired, it returns `401`.
4. It creates an admin client with `SUPABASE_SERVICE_ROLE_KEY` and calls `auth.admin.deleteUser(user.id)`. The id comes from the verified token, never from the request.
5. It returns `204` with no body. The foreign keys from migrations 007 and 008 remove every row, and keep shared circles with the user set to `NULL`. `supabase/tests/delete_account.test.sql` checks this.
6. On any other failure it logs the details server-side and returns `500 {"error":"Deletion failed"}` with nothing else.

**The service-role key is used here and nowhere else in the project.** Supabase injects it into functions automatically. Never put it in `.env`, Vercel or the app.

### CORS

The function echoes `Access-Control-Allow-Origin` only for allowed origins:

- `capacitor://localhost` (iOS) and `https://localhost` (Android) are always allowed.
- Origins listed in the `ALLOWED_ORIGINS` secret (comma-separated, trailing `/` ignored) are also allowed.

Any other browser origin gets no CORS header, so the browser blocks the response. CORS is not the security boundary, the user's token is: a request without a valid token deletes nothing.

## Deploy (Lincoln)

Run these from the repository root, with the Supabase CLI logged in (`npx supabase login`) and linked to the right project (`npx supabase link --project-ref <ref>`). Do **staging first**.

```sh
# 1. Allowed web origins (production + beta/preview). Native origins are built in.
npx supabase secrets set ALLOWED_ORIGINS="https://<production-origin>,https://<beta-origin>"

# 2. Deploy
npx supabase functions deploy delete-account

# 3. Check that it's there
npx supabase functions list
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase; don't set them yourself.

**JWT check at the gateway.** By default Supabase rejects calls without a valid JWT before the function runs (`verify_jwt = true`). That's fine here, since the function needs a signed-in user anyway. If the project uses the new asymmetric JWT signing keys and the gateway rejects valid tokens, deploy with `--no-verify-jwt`. The function verifies the token itself in step 3 either way.

**Before deploying to production,** migrations 007 and 008 must be applied there. Without 008, deleting any user who created a circle fails with `circles_created_by_fkey`, and the function returns 500.

## Test

### Unit tests (no Supabase needed)

```sh
npx -y deno@2 test --no-config supabase/functions/delete-account/
npx -y deno@2 check --no-config supabase/functions/delete-account/index.ts
```

### Against staging with curl

Use a **throwaway test account**: this really deletes it.

```sh
URL="https://<project-ref>.supabase.co"
ANON="<anon or publishable key>"

# 1. Get an access token for the test user (email code sign-in), e.g. from the
#    app's devtools: sessionStorage → sb-<ref>-auth-token → access_token.
TOKEN="<access token>"

# 2. No token → 401
curl -i -X POST "$URL/functions/v1/delete-account" -H "apikey: $ANON"

# 3. Preflight from the iOS app's origin → 204 with Access-Control-Allow-Origin
curl -i -X OPTIONS "$URL/functions/v1/delete-account" \
  -H "Origin: capacitor://localhost" -H "Access-Control-Request-Method: POST"

# 4. Delete → 204
curl -i -X POST "$URL/functions/v1/delete-account" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"

# 5. Same token again → 401 (the user is gone)
curl -i -X POST "$URL/functions/v1/delete-account" \
  -H "apikey: $ANON" -H "Authorization: Bearer $TOKEN"
```

Then confirm in the SQL Editor that nothing is left (replace the id):

```sql
SELECT 'auth.users' AS t, count(*) FROM auth.users WHERE id = '<user-id>'
UNION ALL SELECT 'profiles', count(*) FROM profiles WHERE id = '<user-id>'
UNION ALL SELECT 'plans', count(*) FROM plans WHERE user_id = '<user-id>'
UNION ALL SELECT 'workout_logs', count(*) FROM workout_logs WHERE user_id = '<user-id>'
UNION ALL SELECT 'user_state', count(*) FROM user_state WHERE user_id = '<user-id>';
-- every count should be 0
```

Function logs are under Dashboard → Edge Functions → `delete-account` → Logs. A `500` always leaves a `delete-account: …` line there.

## Client

The app calls this from `src/lib/account/deleteAccount.ts` (Lane F, Day 4). On `204`, that code clears local data (`clearLocalUserData()`), then signs out.
