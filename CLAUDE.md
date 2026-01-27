# CLAUDE.md

> [!IMPORTANT]
> **MANDATORY CONTEXT LOADING PROTOCOL**
> Before starting any task, you **MUST** read the specific "Lens" document relevant to your current role/task from the list below. Do not rely on general knowledge. The lenses contain critical, project-specific rules (e.g., Zod schemas, specific animation tokens, RLS policies) that are REQUIRED for correct implementation.

## 🧭 Navigation (The Lenses)
- **Software Engineer**: [docs/ENGINEERING.md](docs/ENGINEERING.md) (Architecture, State, API, Testing)
- **UI/UX Designer**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) (Components, Animation, Theming)
- **Security Officer**: [docs/SECURITY.md](docs/SECURITY.md) (Auth, RLS, Validation)
- **Orchestrator**: [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) (Build, Env, Deploy)

## ⭐ Golden Paths (Best-in-Class Examples)
- **Best Component**: [WelcomeHero.tsx](src/components/motivation/WelcomeHero.tsx) (Styling, Animation, Props)
- **Best Store**: [authStore.ts](src/stores/authStore.ts) (Persistence, Supabase Integration)
- **Best Page**: [Wizard.tsx](src/pages/Wizard.tsx) (Complex State, Layout)

## 📚 Reference
- **Glossary**: [docs/GLOSSARY.md](docs/GLOSSARY.md) (Domain Terms)
- **Decisions**: [docs/DECISIONS.md](docs/DECISIONS.md) (Why we chose X)

## 🚀 Critical Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Dev Server (FE: 8080, BE: 3001) |
| `npm run test` | Run Vitest (Watch Mode) |
| `npm run build` | Production Build |
| `npm run lint` | ESLint |

## 🏗️ Core Stack
**React 19** • **TypeScript 5.8** • **Vite 7** • **Supabase** • **Zustand 5** • **TanStack Query**

## ⚡ Quick Tips
- **Aliases**: `@/` maps to `src/`.
- **Styling**: Tailwind + `shadcn/ui`. Use `cn()` for class merging.
- **I18n**: Support 4 locales (`src/locales/`).

## 📋 Active Tasks
Check [task.md](.gemini/antigravity/brain/a9a7a119-4e76-4589-ac99-512e0795d912/task.md) for current objectives.
