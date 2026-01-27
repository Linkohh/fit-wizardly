# Security Context

## Authentication
- **Provider**: Supabase Auth (Magic Link / OTP).
- **State**: `src/stores/authStore.ts` handles session and profile management.
- **Profile Creation**: Auto-created on first 'SIGNED_IN' event if missing.

## Frontend Protection
### `RequireAuth` Component
- **Path**: `src/components/RequireAuth.tsx`
- **Usage**:
  - `<RequireAuth strict={true}>`: Forces Authentication Modal if user is guest.
  - `<RequireAuth strict={false}>`: Allows guest access, but session data is available if logged in.
- **Guards**:
  - `TrainerGuard`: Checks user metadata/profile for trainer role.
  - `OnboardingGuard`: Redirects to `/onboarding` if profile setup is incomplete.

## Backend Security (Server)
- **Middleware**: Express `cors` and distinct `rateLimiters` (standard vs auth).
- **Token Verification**:
  - Middleware `requireAuth` verifies the Bearer token against Supabase Auth API (`GET /auth/v1/user`).
  - **Critical**: Never confide in the client-claimed user ID; always use the ID returned by the Supabase verification.

## Database (RLS)
- **Policy**: Row Level Security is ENABLED on all tables.
- **Standard**: Users can only `SELECT/INSERT/UPDATE` rows where `user_id == auth.uid()`.
