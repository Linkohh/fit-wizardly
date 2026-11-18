# Claude Code Generation Rules

## Mandatory Context Loading

Before generating ANY code, you MUST:

1. Read `CLAUDE.md` in the project root, then `README.md`, `docs/LAUNCH_ROADMAP.md` and `docs/project/README.md`. Where an older lens doc disagrees with these, these win
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

- **Tailwind 4 utilities only** - No inline styles and no new CSS files. Theme tokens live in the `@theme` block of `src/index.css`
- **Semantic tokens for colour** - `bg-background`, `text-foreground`, `bg-muted`. They adapt to dark mode, so `dark:` variants are rarely needed. Never hardcode white or black
- **Mobile-first** - Start with base styles, add `md:`, `lg:`

### Text

- **All UI text through i18n** - `t('key', 'English fallback')`. Add new keys to `en.json` and `es.json` (locales: `en`, `es`, `de`, `pt`)
- **Never rewrite a locale file through a JSON parser** - `pt.json` has a duplicate key that parsers silently drop

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
