# Architectural Decisions (ADR)

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
