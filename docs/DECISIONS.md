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
