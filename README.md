# FitWizard

**Science-based workout plans, built around you.**

FitWizard is a workout planner and training log for people who lift. You answer a few questions (goal, experience, equipment, schedule, injuries), pick the muscles you want to train on an interactive anatomy map, and FitWizard builds a periodized plan: a training split, sets and reps per exercise, a four-week effort progression measured in reps in reserve (RIR) with a deload week, and weekly volume checks per muscle. You then log each workout set by set, and the app tracks your history, personal records and strength trends.

Plans are generated on the device by a rules-based engine grounded in strength-training research. There is no AI model in the app, and plan generation works offline at no cost per user.

> **Not medical advice.** FitWizard gives general fitness guidance. Talk to a qualified professional before starting a new training program, especially with an injury or medical condition. See the in-app Legal page (`/legal`).

---

## Status

FitWizard is in **beta** and is being prepared for the App Store, Google Play and desktop.

| Branch | Role | Deployed to |
|---|---|---|
| `preview_b` | Active development and beta | Beta site on Vercel |
| `main` | Production | Production site on Vercel (currently behind `preview_b`) |

The plan for getting to the stores is in [`docs/LAUNCH_ROADMAP.md`](docs/LAUNCH_ROADMAP.md). The work is organized as a day-by-day project with parallel lanes in [`docs/project/`](docs/project/README.md).

---

## How people use it

| Platform | How | State |
|---|---|---|
| **Web** | Any modern browser | Live (beta) |
| **Installable web app (PWA)** | "Add to Home Screen" on phones, "Install" in Chrome, Edge or Safari on desktop. Works offline after the first visit | Live (beta) |
| **iOS** | Native app built with Capacitor 8 from the same web code | Project builds in Xcode; not yet in the App Store |
| **Android** | Native app built with Capacitor 8 | Project builds in Android Studio; not yet on Google Play |
| **Desktop** | The installed PWA today; Microsoft Store package and a macOS wrapper planned | Planned (roadmap Phase 5) |

FitWizard is **free**. Most of the app works without an account (guest mode). An account (email sign-in) is needed to keep plans in the cloud.

---

## Features

| Feature | State | Notes |
|---|---|---|
| Onboarding and plan wizard (goal, equipment, target muscles, constraints, schedule, review) | ✅ Shipped | |
| Anatomy muscle selector (front, back and side views; surface and deep layers; search) | ✅ Shipped | `src/features/mcl` |
| Plan generator with splits, RIR progression, deload and volume (MRV) warnings | ✅ Shipped | `src/lib/planGenerator.ts`, `src/lib/progressionEngine.ts` |
| Workout logger: rest timer, warm-up sets, supersets, plate calculator, RIR or RPE | ✅ Shipped | |
| History, analytics, strength curve, readiness check-ins | ✅ Shipped | |
| Nutrition: food log, barcode lookup (Open Food Facts), hydration, meal shortcuts | ✅ Shipped | Barcode lookup is consent-gated |
| Exercise library (bundled data plus the wger catalog) | ✅ Shipped | |
| PDF export of plans | ✅ Shipped | |
| Light and dark themes | ✅ Shipped | |
| Languages | ⚠️ Partial | English is complete. Spanish, German and Portuguese are partly translated; v1 targets English and Spanish (roadmap 3.3) |
| Cloud sync of plans for signed-in users | ✅ Shipped | |
| Saving workout logs, nutrition, measurements, readiness and achievements between sessions | ✅ Shipped | Kept on the device (IndexedDB on the web, app storage on iOS and Android), never in localStorage. See ADR 11 and `docs/store/DATA_INVENTORY.md` |
| Cloud sync of logs, nutrition, measurements, readiness, achievements and custom exercises | ✅ Shipped (signed-in users) | On since #66. Syncing before sign-out, with an unsent-changes warning, is still to come (roadmap 1.4, Lane E Day 7) |
| Account deletion | 🗓️ Planned | Roadmap 1.5 |
| Circles (social groups, feed, challenges) | 🚩 Behind a flag (`VITE_FEATURE_CIRCLES`) | Not part of v1 |
| Coach portal (clients, templates, revenue) | 🚩 Behind a flag (`VITE_FEATURE_COACH`) | Not part of v1; parts use sample data |
| Pro subscription, Apple Health / Health Connect, AI coach | 🗓️ After launch | Roadmap Phase 6 |

---

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript 5.9 (strict), Vite 7 with SWC |
| Styling | Tailwind CSS 4 (tokens in `src/index.css`), shadcn/ui on Radix, Framer Motion 12 |
| State | Zustand 5 (persist middleware), TanStack Query 5 |
| Routing | React Router 7 |
| Validation | Zod 4 (client), Zod 3 (local server) |
| Backend | Supabase: Postgres with row-level security on every table, Auth (email), Realtime |
| Serverless | Vercel functions in `api/` (exercise search, quotes, wger proxy) |
| Native | Capacitor 8 (iOS with Swift Package Manager, Android with Gradle) |
| Internationalization | i18next: `en`, `es`, `de`, `pt` |
| Charts and export | Recharts, jsPDF |
| Testing | Vitest 4 and Testing Library, Playwright |

---

## Quick start

Requirements: **Node 22** and **npm** (the repository uses `package-lock.json`; CI rejects other lockfiles).

```sh
git clone https://github.com/Linkohh/fit-wizardly.git
cd fit-wizardly
git checkout preview_b
npm ci
cp .env.example .env.local   # then fill in the values you need
npm run dev                  # http://localhost:8080
```

With no Supabase values the app runs in **demo mode**: everything except sign-in, cloud sync and Circles works.

### Environment variables

Put real values in `.env.local` for local work and in Vercel project settings for deployments. Never commit a filled-in `.env` file.

| Variable | Where it runs | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Client (public) | Supabase project URL. Must be HTTPS outside localhost |
| `VITE_SUPABASE_ANON_KEY` | Client (public) | Supabase publishable key (`sb_publishable_…`) or legacy anon key |
| `VITE_PLANS_PROVIDER` | Client | `auto` (default: Supabase when configured), `supabase`, or `api` |
| `VITE_USE_API` | Client | `true` to call the local Express API outside dev |
| `VITE_API_URL` | Client | Express API base; same-origin or localhost only |
| `VITE_SHARE_BASE_URL` | Client | Base URL for shared workout links |
| `VITE_FEATURE_CIRCLES` | Client | `true` to show Circles. Default off |
| `VITE_FEATURE_COACH` | Client | `true` to show the coach portal. Default off |
| `VITE_TRAINER_ACCESS_USERNAME`, `VITE_TRAINER_ACCESS_PASSCODE` | Client | Present in `.env.example`; not read by current code |
| `ALLOWED_ORIGINS` | Local Express server | Comma-separated CORS allowlist |
| `TRUST_PROXY` | Local Express server | `false`, `true`, or a hop count |
| `API_NINJAS_API_KEY` | Vercel functions (server only) | Key for exercise search and quotes. **Never prefix with `VITE_`** |

Anything starting with `VITE_` is bundled into the app and visible to users. Only put public values there.

### Database

Create a Supabase project, then apply the SQL files in `supabase/migrations/` **in order** (`001` to `006`) in the Supabase SQL editor. [`docs/SUPABASE_MIGRATIONS.md`](docs/SUPABASE_MIGRATIONS.md) explains which files can be re-run and how to check what is already applied.

### Optional local API

`server/` is a small Express API for plan storage (`/plans`, `/health`), used only in local development. Production writes to Supabase directly. Its future is decision D1 in the roadmap.

```sh
npm --prefix server ci
npm run server:dev      # http://localhost:3001 (Vite proxies /plans and /health)
```

---

## Scripts

| Group | Command | What it does |
|---|---|---|
| Develop | `npm run dev` | Vite dev server on port 8080 |
| | `npm run server:dev` / `server:build` / `server:start` | Local Express API |
| Quality | `npm run lint` | ESLint |
| | `npm run typecheck` | TypeScript, no emit |
| | `npm run test` / `npm run test:run` | Vitest in watch mode / once |
| | `npm --prefix server test` | Server tests |
| | `npm run test:playwright` (`:headed`) | Playwright smoke tests (builds and previews on port 5173) |
| | `npm run test:exercise-library` | Exercise library tests only |
| Build | `npm run build` / `build:dev` | Production / development build into `dist/` |
| | `npm run preview` | Serve the built app |
| | `npm run bundle:report` | Initial bundle size report |
| Data | `npm run sync:exercise-library` | Refresh the bundled wger snapshot |
| iOS | `npm run ios:sync` | Copy `dist/` into the iOS project |
| | `npm run ios:dev` | Build and run in the simulator with bundled files |
| | `npm run ios:live` | Run with live reload from the dev server |
| | `npm run ios:open` | Open the Xcode project |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, client tests, the client build, server tests and the server build on every push to `main` or `preview_b` and on every pull request.

---

## Mobile builds

Both native projects are generated by Capacitor from the web build. Always build the web app first.

**iOS** (macOS with Xcode; dependencies use Swift Package Manager, CocoaPods is not needed):

```sh
npm run build
npm run ios:sync
npm run ios:open        # archive and sign in Xcode
```

**Android** (Android Studio with SDK 36):

```sh
npm run build
npx cap sync android
npx cap open android
```

App id on both platforms: `com.fitwizardly.app`. Release signing, store metadata and CI builds are covered in roadmap Phases 2 and 4. More detail is in [`docs/IOS_DEVELOPMENT.md`](docs/IOS_DEVELOPMENT.md).

---

## Deployment

Vercel builds the static app from `dist/` and serves the functions in `api/`. Security headers, including a strict Content Security Policy and HSTS, are set in `vercel.json`. `main` deploys to production and `preview_b` to the beta site. The service worker updates installed copies automatically.

## Releasing

1. Bump `version` in `package.json`.
2. Add a matching entry at the top of `src/data/changelog.ts`. A test fails if the two differ.
3. Bump the native versions: `MARKETING_VERSION` in Xcode and `versionName` / `versionCode` in `android/app/build.gradle`.
4. Merge to `main` and tag the commit (`vX.Y.Z`).

Details: [`docs/ABOUT_PAGE.md`](docs/ABOUT_PAGE.md).

---

## Project layout

```
api/                 Vercel serverless functions
android/, ios/       Capacitor native projects
docs/                Documentation (see index below)
public/              Static assets, icons, bundled exercise data
scripts/             Dev and data scripts (iOS live reload, wger sync, bundle report)
server/              Optional local Express API
src/
  components/        Feature components (ui/ holds shadcn primitives: do not edit)
  features/          Self-contained features: mcl (anatomy selector), exercise-library
  pages/             Route-level pages
  stores/            Zustand stores
  hooks/             Custom hooks
  lib/               Plan engine, sync, services, utilities
  locales/           en, es, de, pt translations
  data/              Static data (changelog, exercise data)
  types/             TypeScript types, including generated Supabase types
supabase/migrations/ SQL migrations, applied in order
```

## Documentation

| Document | State |
|---|---|
| [`docs/LAUNCH_ROADMAP.md`](docs/LAUNCH_ROADMAP.md) | Current. Analysis, work items, decisions, risks |
| [`docs/project/`](docs/project/README.md) | Current. Day-by-day project, lanes, contracts, board |
| [`docs/SESSION_LOG.md`](docs/SESSION_LOG.md) | Current. Session history and known issues |
| [`docs/SUPABASE_MIGRATIONS.md`](docs/SUPABASE_MIGRATIONS.md), [`docs/ABOUT_PAGE.md`](docs/ABOUT_PAGE.md), [`docs/VERCEL_SECRET_ROTATION.md`](docs/VERCEL_SECRET_ROTATION.md), [`docs/PERFORMANCE_BASELINE.md`](docs/PERFORMANCE_BASELINE.md) | Current |
| [`CLAUDE.md`](CLAUDE.md) and the lens docs (`ENGINEERING`, `DESIGN_SYSTEM`, `SECURITY`, `ORCHESTRATION`, `API_REFERENCE`, `SCHEMAS`, `TESTING`, `TROUBLESHOOTING`, `MIGRATION`, `AI_GUIDELINES`) | **Partly out of date.** Some versions, paths and variables they mention do not exist. Corrections are scheduled (roadmap 0.9) |
| [`docs/privacy-policy.md`](docs/privacy-policy.md) | Privacy policy and terms, rewritten from `docs/store/DATA_INVENTORY.md` (roadmap 4.1). **Draft for qualified review (L9)**; same text as `/legal` |

## License

No license file is published. All rights reserved by the repository owner unless stated otherwise.
