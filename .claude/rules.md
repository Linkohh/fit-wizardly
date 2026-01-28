# Claude Code Generation Rules

## Mandatory Context Loading

Before generating ANY code, you MUST:

1. Read `CLAUDE.md` in the project root
2. Read the relevant "Lens" document for your task:
   - Components/UI: `docs/DESIGN_SYSTEM.md`
   - State/Logic: `docs/ENGINEERING.md`
   - Security/Auth: `docs/SECURITY.md`
   - Build/Deploy: `docs/ORCHESTRATION.md`

## Code Style Requirements

### TypeScript

- **NO `any` type** - Use `unknown` with type guards or proper types
- **Explicit return types** for exported functions
- **Interface over type** for object shapes
- **Use `z.infer<typeof Schema>`** for Zod types

### React Components

- **Function components only** - No class components
- **Props interface required** - Named `ComponentNameProps`
- **Hooks at top level** - Follow rules of hooks
- **Use `cn()` for class merging** - Import from `@/lib/utils`

### Styling

- **Tailwind only** - No inline styles, no CSS files
- **Dark mode required** - Include `dark:` variants
- **Mobile-first** - Start with base styles, add `md:`, `lg:`

### State Management

- **Zustand for global state** - Use persist middleware when needed
- **TanStack Query for server state** - Use query key factories
- **Never mutate state** - Always return new objects

## Forbidden Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `any` | Type safety | Use proper types |
| `document.querySelector` | React anti-pattern | Use refs or state |
| Inline styles | Inconsistent | Tailwind classes |
| `var` | Scoping issues | `const` or `let` |
| `.then()` chains | Readability | `async/await` |
| Class components | Outdated | Function components |
| `export default` | Refactoring issues | Named exports |

## Golden Path Files

When unsure about patterns, reference these exemplary files:

| Task | Reference File |
|------|---------------|
| Component | `src/components/motivation/WelcomeHero.tsx` |
| Store | `src/stores/authStore.ts` |
| Page | `src/pages/Wizard.tsx` |
| Validation | `src/lib/validation/fitness.ts` |
| Hook | `src/hooks/useWizardForm.ts` |
| Test | `src/test/onboardingStore.test.ts` |

## Import Order

1. React imports
2. External library imports
3. `@/` aliased imports
4. Relative imports
5. Type imports (with `type` keyword)

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { localHelper } from './helpers';
import type { MyType } from '@/types';
```

## Error Handling

- Always use `try/catch` for async operations
- Use Zod `.safeParse()` at boundaries
- Provide user-friendly error messages
- Log errors for debugging

## Testing Requirements

- Test behavior, not implementation
- One concept per test
- Meaningful test names
- Reset mocks between tests
