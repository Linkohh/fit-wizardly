# Project Context for Claude

## Project Description

**fit-wizardly** is a fitness workout planning application that helps users create personalized workout programs based on their goals, equipment, and constraints.

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

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript 5.8 |
| Build | Vite 7 with SWC |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion |
| State | Zustand (client) + TanStack Query (server) |
| Validation | Zod 4 |
| Auth | Supabase Auth (magic links) |
| Database | Supabase (PostgreSQL) |
| Backend | Express.js on port 3001 |

## Key Directories

```
src/
├── components/     # UI components
│   ├── ui/        # shadcn/ui primitives
│   └── motivation/ # Feature-specific
├── hooks/         # Custom React hooks
├── lib/           # Utilities & validation
├── pages/         # Route components
├── stores/        # Zustand stores
└── locales/       # i18n translations

server/
└── src/           # Express API

docs/
├── ENGINEERING.md    # Architecture guide
├── DESIGN_SYSTEM.md  # UI/UX patterns
├── SECURITY.md       # Auth & security
├── ORCHESTRATION.md  # Build & deploy
├── SCHEMAS.md        # Zod schema catalog
├── API_REFERENCE.md  # API documentation
└── snippets/         # Code patterns
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `VITE_API_URL` | Backend API URL |
| `PORT` | Backend server port (3001) |
