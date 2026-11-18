# Project Context for Claude

## Project Description

**FitWizard** (repository `fit-wizardly`) is a fitness workout planning application that helps users create personalized workout programs based on their goals, equipment, and constraints.

## Core User Flows

### 1. Onboarding Wizard
User completes a multi-step wizard selecting:
- Training goal (strength, hypertrophy, general)
- Experience level (beginner, intermediate, advanced)
- Available equipment
- Target muscle groups
- Physical constraints/injuries
- Weekly schedule (days/week, session duration)

### 2. Plan Generation
System generates a personalized workout plan with:
- Split type (full body, upper/lower, push/pull/legs)
- Workout days with exercises
- Sets, reps, RIR (Reps In Reserve) progression
- Weekly volume tracking per muscle group

### 3. Plan Execution
User views and follows their plan:
- Daily workout view
- Exercise details with video cues
- Progress tracking
- Plan modifications

## Key Fitness Concepts

| Term | Definition |
|------|------------|
| RIR | Reps In Reserve - how many reps left before failure |
| Split | How workouts are divided across the week |
| Volume | Total sets per muscle group per week |
| Mesocycle | 4-week training block |
| Deload | Recovery week with reduced intensity |

## Tech Stack Summary

`CLAUDE.md` and `README.md` are the authority; this is a summary.

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript 5.9 |
| Build | Vite 7 with SWC |
| Styling | Tailwind CSS 4 (CSS-first; tokens in the `@theme` block of `src/index.css`) + shadcn/ui |
| Animation | Framer Motion 12 |
| State | Zustand 5 (client) + TanStack Query 5 (server) |
| Validation | Zod 4 (client); `server/` uses Zod 3 |
| I18n | i18next, 4 locales: `en`, `es`, `de`, `pt` |
| Testing | Vitest 4 + Testing Library |
| Auth | Supabase Auth (email sign-in link) |
| Database | Supabase (PostgreSQL) |
| Serverless | Vercel functions in `api/` (exercise search, quotes, wger proxy) |
| Backend | Optional local Express API (`server/src/index.ts`) on port 3001, dev only |
| Native | Capacitor 8 (iOS uses Swift Package Manager) |

## Key Directories

```
src/
├── components/     # UI components
│   ├── ui/        # shadcn/ui primitives (do not modify)
│   └── motivation/ # Feature-specific
├── features/      # Self-contained features (mcl, exercise-library)
├── hooks/         # Custom React hooks
├── lib/           # Plan engine, storage, services, validation
├── pages/         # Route components
├── stores/        # Zustand stores
└── locales/       # i18n translations (en, es, de, pt)

api/               # Vercel serverless functions
server/
└── src/index.ts   # Optional Express API (single file, dev only)
supabase/
└── migrations/    # Numbered SQL migrations

docs/
├── ENGINEERING.md    # Architecture guide (partly out of date)
├── DESIGN_SYSTEM.md  # UI/UX patterns (partly out of date)
├── SECURITY.md       # Auth & security (partly out of date)
├── ORCHESTRATION.md  # Build & deploy (partly out of date)
├── SCHEMAS.md        # Zod schema catalog (partly out of date)
├── API_REFERENCE.md  # API documentation (partly out of date)
├── project/          # Launch project: board, lanes, contracts, handoffs
├── store/            # Store paperwork (data inventory)
└── snippets/         # Code patterns
```

## Environment Variables

See `.env.example` for the full list. The main ones:

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `VITE_FEATURE_CIRCLES`, `VITE_FEATURE_COACH` | Feature flags, off by default (read through `src/lib/featureFlags.ts`) |
| `VITE_PLANS_PROVIDER`, `VITE_USE_API`, `VITE_API_URL` | Plans persistence provider and the optional Express API |
| `API_NINJAS_API_KEY` | Server-only key for the Vercel functions. Never prefix with `VITE_` |
| `PORT` | Express server port (3001), dev only |
