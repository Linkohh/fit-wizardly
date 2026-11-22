# Architectural Decisions (ADR)

> **Partly out of date (2026-11-17).** Some files, versions and variables named here don't exist.
> The accurate sources are `README.md` and `docs/LAUNCH_ROADMAP.md`. This doc is corrected when its area is worked on.

## 1. Supabase for Backend
- **Decision**: Use Supabase for Auth, Database (Postgres), and Realtime.
- **Why**: Reduces backend boilerplate. Row Level Security (RLS) provides robust authorization at the data layer, removing the need for complex API middleware checks.

## 2. Zustand for State
- **Decision**: Use Zustand with `persist` middleware.
- **Why**: Redux is too verbose; React Context causes unnecessary re-renders. Zustand provides a simple hook-based API that scales well for our partial persistence needs (saving unfinished plans).

## 3. Tailwind + Shadcn/ui
- **Decision**: Utility-first CSS using a copy-paste component library.
- **Why**: Speed of iteration. "Rich Aesthetics" are easier to compose with granular utilities than overriding component library styles (like MUI/Antd).

## 4. Client-Side Orchestration (Vite)
- **Decision**: Single Page Application (SPA).
- **Why**: We prioritized a native-app-like feel (transitions, instant navigation) over SEO (which is less relevant for a logged-in dashboard app).

> ADRs 5–10 were recorded in `docs/SESSION_LOG.md` (Architecture Summary) and are not repeated here.

## 11. Local-first user data (2026-11)
- **Decision**: All user data (plans, workout logs, personal records, the in-progress workout, nutrition, body measurements, readiness check-ins, achievements, custom exercises, favourites) is saved on the device immediately: IndexedDB on the web, app files (`Directory.Data`) in the native apps. It is synced to Supabase when the user is signed in (cloud sync lands in Lane E, Days 4–7).
- **Why**: The April 2026 hardening (`26e3534`) stopped persisting health data to avoid script access to `localStorage`. The side effect was that the app forgot every workout on reload, which broke the product. The defence against injected scripts is the strict CSP in `vercel.json` with no third-party scripts, not storing nothing. User data still never goes to `localStorage`; tests enforce this.
- **Consequences**:
  - Existing users' saved values are moved once out of `localStorage`. The old copy is removed only after a confirmed durable write.
  - Saved data is checked on load, and malformed entries are dropped.
  - Until sync exists, signing out keeps data on the device and says so, because clearing it would delete data that exists nowhere else. After sync (Lane E Day 6), account sign-out clears device copies once they are synced. Guests keep their data.
  - Account deletion and "Erase data on this device" use `clearLocalUserData()`.
- **Code**: `src/lib/storage/appStorage.ts`, `src/lib/storage/hydration.ts`, `src/lib/storage/clearLocalUserData.ts`, `src/stores/*.persistence.ts`.

## 12. Persistent sessions (2026-11)
- **Decision**: The session token lives in `@capacitor/preferences` on native and in `localStorage` on the web, so users stay signed in across restarts (decision D2).
- **Why**: Keeping it in `sessionStorage` signed people out every time the app or tab closed. This trades a larger window if an XSS occurs (mitigated by the strict CSP and no third-party scripts) for an app that doesn't sign people out every time it closes.
- **Consequences**:
  - Sessions saved in `sessionStorage` by older versions are moved once to the new storage on first start, and the old copy is removed, so nobody is signed out by the update.
  - Sign-out (`supabase.auth.signOut()`) removes the token from the new storage.
  - Only the Supabase session (`sb-<project>-auth-token` and its companions) is stored there. ADR 11 still holds: user data never goes to `localStorage`.
  - On iOS, `@capacitor/preferences` uses UserDefaults, covered by reason `CA92.1` in `PrivacyInfo.xcprivacy`.
  - Revisit with a cookie-based backend if one is added.
- **Code**: `src/lib/authSessionStorage.ts`, `src/lib/supabase.ts`.
