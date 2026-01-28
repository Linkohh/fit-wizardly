# CLAUDE.md

> [!IMPORTANT]
> **MANDATORY CONTEXT LOADING PROTOCOL**
> Before starting ANY task, you **MUST**:
> 1. Read the specific "Lens" document relevant to your current role/task
> 2. Reference "Golden Path" examples for pattern consistency
> 3. Consult the Glossary for domain-specific terminology
>
> These documents contain **PROJECT-SPECIFIC RULES** (Zod schemas, animation tokens, RLS policies) that override general knowledge.

---

## Table of Contents
- [Navigation (The Lenses)](#navigation-the-lenses)
- [Golden Paths](#golden-paths-best-in-class-examples)
- [Reference Documents](#reference-documents)
- [Extended Documentation](#extended-documentation)
- [Code Snippets Library](#code-snippets-library)
- [AI Configuration](#ai-configuration)
- [Core Stack & Architecture](#core-stack--architecture)
- [Coding Principles](#coding-principles)
- [Error Handling Philosophy](#error-handling-philosophy)
- [Debugging Protocol](#debugging-protocol)
- [Refactoring Guidelines](#refactoring-guidelines)
- [Performance Standards](#performance-standards)
- [Code Quality Gates](#code-quality-gates)
- [Common Pitfalls](#common-pitfalls-avoid-these)
- [Commands Reference](#commands-reference)

---

## Navigation (The Lenses)

| Role | Document | Scope |
|------|----------|-------|
| **Software Engineer** | [docs/ENGINEERING.md](docs/ENGINEERING.md) | Architecture, State, API, Testing, Type Safety |
| **UI/UX Designer** | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Components, Animation, Theming, Accessibility |
| **Security Officer** | [docs/SECURITY.md](docs/SECURITY.md) | Auth, RLS, Validation, OWASP Compliance |
| **Orchestrator** | [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) | Build, Env, Deploy, CI/CD, Monitoring |

---

## Golden Paths (Best-in-Class Examples)

These files represent the **canonical patterns** for this codebase. Study them before implementing similar features:

| Pattern | File | Learn |
|---------|------|-------|
| **Component Architecture** | [WelcomeHero.tsx](src/components/motivation/WelcomeHero.tsx) | Props, Styling, Animation, Composition |
| **State Management** | [authStore.ts](src/stores/authStore.ts) | Zustand patterns, Persistence, Supabase Integration |
| **Page Structure** | [Wizard.tsx](src/pages/Wizard.tsx) | Complex State, Layout, Multi-step Forms |
| **Validation Schemas** | [fitness.ts](src/lib/validation/fitness.ts) | Zod patterns, Type inference, API payloads |
| **Custom Hooks** | [useCountUp.ts](src/hooks/useCountUp.ts) | Hook patterns, Cleanup, Dependencies |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Domain terminology (RIR, Split, Volume, etc.) |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architectural Decision Records (ADRs) |

---

## Extended Documentation

| Document | Purpose |
|----------|---------|
| [docs/SCHEMAS.md](docs/SCHEMAS.md) | Zod schema registry - all validation schemas |
| [docs/API_REFERENCE.md](docs/API_REFERENCE.md) | Complete API documentation with examples |
| [docs/TESTING.md](docs/TESTING.md) | Testing patterns, strategies, and best practices |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [docs/MIGRATION.md](docs/MIGRATION.md) | Version upgrades and breaking changes |
| [docs/AI_GUIDELINES.md](docs/AI_GUIDELINES.md) | AI-specific code generation rules |

---

## Code Snippets Library

Reusable patterns in [docs/snippets/](docs/snippets/):

| File | Patterns |
|------|----------|
| [form-patterns.tsx](docs/snippets/form-patterns.tsx) | Form + Zod + React Hook Form + Wizard integration |
| [query-patterns.ts](docs/snippets/query-patterns.ts) | TanStack Query patterns with auth |
| [auth-patterns.ts](docs/snippets/auth-patterns.ts) | Authentication patterns with Supabase |
| [animation-variants.ts](docs/snippets/animation-variants.ts) | Framer Motion animation presets |

---

## AI Configuration

See [.claude/](.claude/) for AI-specific configuration:

| File | Purpose |
|------|---------|
| [.claude/rules.md](.claude/rules.md) | Mandatory code generation rules |
| [.claude/context.md](.claude/context.md) | Project context and domain knowledge |
| [.claude/ignore.md](.claude/ignore.md) | Files to ignore and context priorities |

---

## Core Stack & Architecture

### Technology Stack
```
Frontend:     React 19 + TypeScript 5.8 + Vite 7 (SWC)
State:        Zustand 5 (with persist middleware)
Data:         TanStack React Query v5
Routing:      React Router 7
Styling:      Tailwind CSS 3.4 + shadcn/ui + Framer Motion 12
Backend:      Express (Node.js) on Port 3001
Database:     Supabase (PostgreSQL + Auth + Realtime)
Validation:   Zod 4
I18n:         i18next (4 locales: en, es, fr, de)
Testing:      Vitest + Testing Library
```

### Directory Structure
```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui primitives (DO NOT MODIFY)
│   ├── motivation/     # Feature: gamification components
│   ├── onboarding/     # Feature: onboarding flow
│   ├── circles/        # Feature: social circles
│   └── logging/        # Feature: workout logging
├── pages/              # Route-level components
├── stores/             # Zustand state stores
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   └── validation/     # Zod schemas
├── types/              # TypeScript type definitions
├── locales/            # i18n translation files
└── data/               # Static data (exercise library)

server/
├── src/
│   ├── routes/         # Express route handlers
│   └── middleware/     # Auth, validation, rate limiting
```

### Path Aliases
```typescript
// Import using @ alias (maps to src/)
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
```

---

## Coding Principles

### 1. Type Safety First
```typescript
// ALWAYS define explicit types - never use `any`
interface WorkoutDay {
  dayIndex: number;
  name: string;
  exercises: ExercisePrescription[];
}

// Use Zod for runtime validation + type inference
const WorkoutDaySchema = z.object({
  dayIndex: z.number().int().min(0),
  name: z.string().min(1),
  exercises: z.array(ExercisePrescriptionSchema),
});
type WorkoutDay = z.infer<typeof WorkoutDaySchema>;
```

### 2. Single Responsibility
```typescript
// Each function/component does ONE thing well
// BAD: Component that fetches, transforms, and renders
// GOOD: Separate hooks for data, utils for transform, component for render

// Custom hook for data fetching
function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: fetchWorkouts,
  });
}

// Pure function for transformation
function groupWorkoutsByDay(workouts: Workout[]): Map<number, Workout[]> {
  return workouts.reduce((acc, w) => {
    const day = acc.get(w.dayIndex) || [];
    return acc.set(w.dayIndex, [...day, w]);
  }, new Map());
}

// Component for rendering
function WorkoutList({ workouts }: { workouts: Workout[] }) {
  return <ul>{workouts.map(w => <WorkoutCard key={w.id} workout={w} />)}</ul>;
}
```

### 3. Immutability
```typescript
// ALWAYS create new objects/arrays, never mutate
// BAD
state.items.push(newItem);

// GOOD
set({ items: [...state.items, newItem] });

// GOOD - Zustand pattern
set((state) => ({ items: [...state.items, newItem] }));
```

### 4. Explicit Over Implicit
```typescript
// Name things clearly - avoid abbreviations
// BAD
const d = getData();
const usr = useAuthStore();

// GOOD
const workoutData = fetchWorkoutHistory();
const { user, session } = useAuthStore();
```

### 5. Fail Fast, Fail Loud
```typescript
// Validate early, throw descriptive errors
function processExercise(input: unknown): Exercise {
  const result = ExerciseSchema.safeParse(input);

  if (!result.success) {
    console.error('Invalid exercise data:', result.error.format());
    throw new Error(`Invalid exercise: ${result.error.message}`);
  }

  return result.data;
}
```

---

## Error Handling Philosophy

### Frontend Error Handling
```typescript
// 1. Use Error Boundaries for React component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <WorkoutDisplay />
</ErrorBoundary>

// 2. Handle async errors with try-catch
async function handleSubmit(data: FormData) {
  try {
    await submitWorkout(data);
    toast.success('Workout saved!');
  } catch (error) {
    console.error('Submit failed:', error);
    toast.error('Failed to save workout. Please try again.');
  }
}

// 3. Use TanStack Query for data fetching errors
const { data, error, isLoading } = useQuery({
  queryKey: ['workouts'],
  queryFn: fetchWorkouts,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) {
  return <ErrorState message="Failed to load workouts" onRetry={refetch} />;
}
```

### Backend Error Response Format
```typescript
// Consistent error response structure
interface ApiError {
  error: string;        // Human-readable message
  code?: string;        // Machine-readable error code
  details?: unknown;    // Additional context (validation errors, etc.)
  timestamp?: string;   // ISO timestamp for debugging
}

// Example response
res.status(400).json({
  error: 'Validation failed',
  code: 'VALIDATION_ERROR',
  details: zodError.format(),
  timestamp: new Date().toISOString(),
});
```

### Error Hierarchy
```
1. User Errors (4xx) - Show friendly message, suggest action
2. System Errors (5xx) - Log details, show generic message
3. Network Errors - Retry with backoff, show offline state
4. Validation Errors - Highlight specific fields, show inline errors
```

---

## Debugging Protocol

### 1. Reproduce First
```typescript
// Document reproduction steps before fixing
/**
 * BUG: Workout not saving
 * REPRO:
 * 1. Navigate to /wizard
 * 2. Complete all steps
 * 3. Click "Generate Plan"
 * 4. Observe: Nothing happens
 * 5. Expected: Plan appears
 */
```

### 2. Isolate the Issue
```typescript
// Use console groups for structured logging
console.group('Workout Submit Debug');
console.log('Input data:', formData);
console.log('Validation result:', validationResult);
console.log('API response:', response);
console.groupEnd();
```

### 3. Check Common Causes
```
1. State not updating? Check immutability in Zustand
2. Component not re-rendering? Check dependency arrays
3. API failing? Check network tab, CORS, auth headers
4. Type errors? Run `npm run lint` and check tsconfig
5. Style issues? Check Tailwind classes, dark mode variants
```

### 4. Use Browser DevTools
```
- React DevTools: Component tree, props, state
- Network tab: API calls, response bodies
- Console: Errors, warnings, logs
- Application tab: localStorage, cookies, session
```

---

## Refactoring Guidelines

### When to Refactor
1. **Duplication detected** - Extract shared logic into utilities/hooks
2. **Component > 200 lines** - Split into smaller focused components
3. **Complex conditionals** - Extract into named functions or components
4. **Type assertions (`as`)** - Improve type definitions instead

### Refactoring Patterns

#### Extract Custom Hook
```typescript
// BEFORE: Logic mixed in component
function WorkoutPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts().then(setWorkouts).finally(() => setLoading(false));
  }, []);

  // ... render
}

// AFTER: Logic in reusable hook
function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: fetchWorkouts,
  });
}

function WorkoutPage() {
  const { data: workouts, isLoading } = useWorkouts();
  // ... render
}
```

#### Extract Component
```typescript
// BEFORE: Large render block
function Dashboard() {
  return (
    <div>
      <div className="card">
        <h2>{workout.name}</h2>
        <p>{workout.description}</p>
        <button onClick={handleStart}>Start</button>
      </div>
      {/* 50 more lines... */}
    </div>
  );
}

// AFTER: Focused components
function Dashboard() {
  return (
    <div>
      <WorkoutCard workout={workout} onStart={handleStart} />
      <StatsPanel stats={stats} />
    </div>
  );
}
```

### Refactoring Checklist
- [ ] All tests still pass
- [ ] No new TypeScript errors
- [ ] No new ESLint warnings
- [ ] Component API unchanged (or migration documented)
- [ ] Performance not degraded

---

## Performance Standards

### React Performance
```typescript
// 1. Memoize expensive computations
const sortedExercises = useMemo(
  () => exercises.sort((a, b) => a.name.localeCompare(b.name)),
  [exercises]
);

// 2. Memoize callbacks passed to children
const handleExerciseClick = useCallback((id: string) => {
  setSelectedExercise(id);
}, []);

// 3. Use React.memo for pure components
const ExerciseCard = memo(function ExerciseCard({ exercise }: Props) {
  return <div>{exercise.name}</div>;
});

// 4. Lazy load heavy components
const ExerciseLibrary = lazy(() => import('./ExerciseLibrary'));
```

### Bundle Performance
```typescript
// Use dynamic imports for code splitting
const PDFExport = lazy(() => import('@/components/PDFExport'));

// Tree-shake imports
// BAD
import _ from 'lodash';

// GOOD
import debounce from 'lodash/debounce';

// Or use native
import { debounce } from '@/lib/utils';
```

### Animation Performance
```typescript
// Use transform/opacity for 60fps animations (GPU accelerated)
// BAD
animate={{ left: 100, top: 100 }}

// GOOD
animate={{ x: 100, y: 100 }}

// Use will-change sparingly
<motion.div style={{ willChange: 'transform' }} />
```

---

## Code Quality Gates

### Pre-Commit Checklist
1. **Type Check**: `npm run lint` passes
2. **Tests Pass**: `npm run test:run` passes
3. **No Console Logs**: Remove debug statements
4. **No TODOs without tickets**: `TODO(TICKET-123): description`
5. **Imports organized**: Absolute imports first, then relative

### Code Review Checklist
- [ ] Types are explicit (no `any`)
- [ ] Error handling is present
- [ ] Loading/error states handled in UI
- [ ] Accessibility considered (keyboard, screen reader)
- [ ] Dark mode tested
- [ ] Mobile responsive
- [ ] i18n strings used (not hardcoded text)

---

## Common Pitfalls (Avoid These)

### State Management
```typescript
// PITFALL: Mutating state directly
// BAD
const addItem = (item) => {
  state.items.push(item); // Mutation!
  set({ items: state.items });
};

// GOOD
const addItem = (item) => {
  set((state) => ({ items: [...state.items, item] }));
};
```

### useEffect Dependencies
```typescript
// PITFALL: Missing dependencies cause stale closures
// BAD
useEffect(() => {
  fetchData(userId); // userId in closure but not in deps
}, []); // eslint will warn

// GOOD
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Async State Updates
```typescript
// PITFALL: Setting state after unmount
// BAD
useEffect(() => {
  fetchData().then(setData);
}, []);

// GOOD
useEffect(() => {
  let cancelled = false;
  fetchData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => { cancelled = true; };
}, []);

// BEST: Use TanStack Query (handles this automatically)
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });
```

### Type Assertions
```typescript
// PITFALL: Overusing type assertions
// BAD
const user = response.data as User; // Unsafe!

// GOOD
const result = UserSchema.safeParse(response.data);
if (result.success) {
  const user = result.data; // Type-safe User
}
```

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (FE: 8080, BE: 3001) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run lint` | Run ESLint |

---

## Quick Tips

| Topic | Tip |
|-------|-----|
| **Imports** | Use `@/` alias: `import { cn } from '@/lib/utils'` |
| **Styling** | Use `cn()` for conditional classes: `cn('base', condition && 'active')` |
| **Icons** | Import from `lucide-react`: `import { ChevronRight } from 'lucide-react'` |
| **Toast** | Use Sonner: `toast.success('Saved!')` or `toast.error('Failed')` |
| **Validation** | Define Zod schema, infer type: `type X = z.infer<typeof XSchema>` |
| **Dark Mode** | Use Tailwind variants: `className="bg-white dark:bg-gray-900"` |
| **Animation** | Use Tailwind tokens or Framer Motion (see DESIGN_SYSTEM.md) |

---

## Active Tasks

Check [task.md](.gemini/antigravity/brain/a9a7a119-4e76-4589-ac99-512e0795d912/task.md) for current objectives.
