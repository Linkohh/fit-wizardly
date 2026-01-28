# AI_GUIDELINES.md - AI-Specific Code Generation Rules

> **Purpose**: Guidelines for AI assistants generating code for fit-wizardly.
> **Audience**: AI coding assistants (Claude, Copilot, etc.).

---

## Table of Contents

1. [Pre-Generation Checklist](#pre-generation-checklist)
2. [Component Generation](#component-generation)
3. [Schema Generation](#schema-generation)
4. [Store Generation](#store-generation)
5. [Hook Generation](#hook-generation)
6. [Test Generation](#test-generation)
7. [Anti-Patterns](#anti-patterns)
8. [Golden Path Examples](#golden-path-examples)

---

## Pre-Generation Checklist

Before generating any code, verify:

- [ ] Read the relevant "Lens" document from [CLAUDE.md](../CLAUDE.md)
- [ ] Check existing patterns in the codebase
- [ ] Verify schema requirements in [SCHEMAS.md](./SCHEMAS.md)
- [ ] Review component patterns in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
- [ ] Understand security requirements in [SECURITY.md](./SECURITY.md)

### Context Loading Order

1. **Always first**: `CLAUDE.md` (entry point)
2. **For components**: `DESIGN_SYSTEM.md` + `WelcomeHero.tsx`
3. **For state/data**: `ENGINEERING.md` + `authStore.ts`
4. **For validation**: `SCHEMAS.md` + `fitness.ts`
5. **For API work**: `API_REFERENCE.md` + `server/src/index.ts`

---

## Component Generation

### Required Patterns

Every component MUST include:

```typescript
// 1. TypeScript interface for props
interface MyComponentProps {
    title: string;
    onAction?: () => void;
    className?: string;
}

// 2. Explicit function component with typed props
export function MyComponent({ title, onAction, className }: MyComponentProps) {
    // 3. Hooks at top level
    const { t } = useTranslation();

    // 4. Return JSX
    return (
        <div className={cn('base-classes', className)}>
            {/* ... */}
        </div>
    );
}
```

### Styling Rules

1. **Use Tailwind classes** - No inline styles
2. **Use `cn()` for conditional classes** - Import from `@/lib/utils`
3. **Support dark mode** - Always include `dark:` variants
4. **Prefer shadcn/ui components** - Check `@/components/ui/` first

```typescript
// Correct
<div className={cn(
    'p-4 bg-white dark:bg-gray-900',
    'rounded-lg shadow-sm',
    isActive && 'ring-2 ring-primary',
    className
)}>

// Wrong - no inline styles
<div style={{ padding: '16px' }}>
```

### Animation Rules

1. **Use Framer Motion** for complex animations
2. **Reference animation-variants.ts** for prebuilt animations
3. **Respect reduced-motion preferences**
4. **Use Tailwind transitions** for simple hover/focus states

```typescript
// Complex animation - use Framer Motion
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
>

// Simple transition - use Tailwind
<button className="transition-colors hover:bg-primary/10">
```

### Accessibility Requirements

1. **Semantic HTML** - Use correct elements
2. **ARIA labels** when semantic meaning isn't clear
3. **Focus states** - Visible and styled
4. **Keyboard navigation** - Support for all interactive elements

```typescript
// Correct
<button
    onClick={handleClick}
    aria-label={t('actions.delete')}
    className="focus:ring-2 focus:ring-primary focus:outline-none"
>
    <TrashIcon />
</button>

// Wrong - no accessibility
<div onClick={handleClick}>
    <TrashIcon />
</div>
```

---

## Schema Generation

### Required Pattern

```typescript
import { z } from 'zod';

// 1. Define schema with descriptive error messages
export const MyEntitySchema = z.object({
    id: z.string().uuid(),
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name cannot exceed 100 characters'),
    count: z.number()
        .int('Must be a whole number')
        .min(0, 'Cannot be negative')
        .max(1000, 'Maximum is 1000'),
    status: z.enum(['active', 'inactive', 'pending']),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).optional(),
});

// 2. Export inferred types
export type MyEntity = z.infer<typeof MyEntitySchema>;
export type MyEntityInput = z.input<typeof MyEntitySchema>;

// 3. Export validation helper
export function validateMyEntity(data: unknown) {
    return MyEntitySchema.safeParse(data);
}
```

### Schema Rules

1. **Always include error messages** for validation rules
2. **Use `.default([])` for optional arrays** - Prevents null checks
3. **Use `z.coerce.date()` for date fields** - Handles string inputs
4. **Export both schema and type** - Keep them together
5. **Use `.strict()` on server schemas** - Reject unknown fields

### Enum Guidelines

```typescript
// Define enums at the module level
export const StatusSchema = z.enum(['draft', 'active', 'archived']);
export type Status = z.infer<typeof StatusSchema>;

// Use enums in object schemas
export const DocumentSchema = z.object({
    status: StatusSchema,
});
```

---

## Store Generation

### Required Pattern (Zustand)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 1. Define state interface
interface MyStoreState {
    // State
    items: Item[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (item: Item) => void;
    removeItem: (id: string) => void;
    reset: () => void;
}

// 2. Define initial state separately
const initialState = {
    items: [],
    isLoading: false,
    error: null,
};

// 3. Create store with persist middleware if needed
export const useMyStore = create<MyStoreState>()(
    persist(
        (set, get) => ({
            ...initialState,

            addItem: (item) => set((state) => ({
                items: [...state.items, item],
            })),

            removeItem: (id) => set((state) => ({
                items: state.items.filter((i) => i.id !== id),
            })),

            reset: () => set(initialState),
        }),
        {
            name: 'my-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                items: state.items,
            }),
        }
    )
);
```

### Store Rules

1. **Define interface with State suffix**
2. **Separate initial state** for easy reset
3. **Use `persist` middleware** if state should survive refresh
4. **Use `partialize`** to control what gets persisted
5. **Never mutate state directly** - Always return new objects
6. **Provide `reset` action** for clearing state

### Selectors Pattern

```typescript
// Export selectors for efficient re-renders
export const useItems = () => useMyStore((state) => state.items);
export const useIsLoading = () => useMyStore((state) => state.isLoading);
```

---

## Hook Generation

### Custom Hook Pattern

```typescript
import { useState, useCallback, useMemo } from 'react';

// 1. Define return type interface
interface UseMyFeatureReturn {
    data: Item[];
    isLoading: boolean;
    error: Error | null;
    actions: {
        add: (item: Item) => void;
        remove: (id: string) => void;
    };
}

// 2. Define options interface if needed
interface UseMyFeatureOptions {
    initialData?: Item[];
    onError?: (error: Error) => void;
}

// 3. Implement hook with JSDoc
/**
 * Hook for managing feature state.
 *
 * @param options - Configuration options
 * @returns Feature state and actions
 *
 * @example
 * const { data, actions } = useMyFeature({ initialData: [] });
 * actions.add({ id: '1', name: 'Test' });
 */
export function useMyFeature(options: UseMyFeatureOptions = {}): UseMyFeatureReturn {
    const { initialData = [], onError } = options;

    const [data, setData] = useState<Item[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const add = useCallback((item: Item) => {
        setData((prev) => [...prev, item]);
    }, []);

    const remove = useCallback((id: string) => {
        setData((prev) => prev.filter((i) => i.id !== id));
    }, []);

    const actions = useMemo(() => ({ add, remove }), [add, remove]);

    return { data, isLoading, error, actions };
}
```

### Hook Rules

1. **Start with `use` prefix**
2. **Define return type interface**
3. **Document with JSDoc and example**
4. **Memoize callbacks with `useCallback`**
5. **Memoize objects with `useMemo`**
6. **Handle loading and error states**

---

## Test Generation

### Test File Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import what you're testing
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
    // Reset state before each test
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('renders with required props', () => {
            render(<MyComponent title="Test" />);
            expect(screen.getByText('Test')).toBeInTheDocument();
        });

        it('applies custom className', () => {
            render(<MyComponent title="Test" className="custom" />);
            expect(screen.getByText('Test')).toHaveClass('custom');
        });
    });

    describe('interactions', () => {
        it('calls onAction when button is clicked', async () => {
            const onAction = vi.fn();
            render(<MyComponent title="Test" onAction={onAction} />);

            await userEvent.click(screen.getByRole('button'));

            expect(onAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('edge cases', () => {
        it('handles empty title gracefully', () => {
            render(<MyComponent title="" />);
            // Assert expected behavior
        });
    });
});
```

### Test Rules

1. **Use `describe` blocks** for grouping
2. **Use meaningful test names** - `it('calls onAction when button is clicked')`
3. **Test behavior, not implementation**
4. **One concept per test**
5. **Reset mocks in `beforeEach`**
6. **Use userEvent for interactions** (not fireEvent)

---

## Anti-Patterns

### DO NOT Generate

| Anti-Pattern | Correct Approach |
|--------------|------------------|
| `any` type | Use proper types or `unknown` with validation |
| Inline styles | Use Tailwind classes |
| Direct DOM manipulation | Use React state and JSX |
| `var` keyword | Use `const` or `let` |
| Class components | Use function components |
| `.then()` chains | Use `async/await` |
| Nested ternaries | Use early returns or variables |
| Magic numbers | Use named constants |
| console.log in production | Use proper logging or remove |
| Raw HTML insertion | Use React components or sanitized content |

### Examples

```typescript
// Wrong
const data: any = await fetch(url);
const style = { color: 'red' };

// Correct
const data: ApiResponse = await fetchWithValidation(url);
const className = 'text-red-500';
return <div className={className}>{children}</div>;
```

### State Management Anti-Patterns

```typescript
// Wrong - mutating state
set((state) => {
    state.items.push(item); // Mutation!
    return state;
});

// Correct - new state object
set((state) => ({
    items: [...state.items, item],
}));
```

### Hook Anti-Patterns

```typescript
// Wrong - hook inside condition
if (condition) {
    const data = useQuery(...); // Breaks rules of hooks!
}

// Correct - always call hooks
const { data } = useQuery(...);
const result = condition ? data : null;
```

---

## Golden Path Examples

### Reference Files

| Purpose | File | Why It's Good |
|---------|------|---------------|
| Component | `src/components/motivation/WelcomeHero.tsx` | Animation, styling, i18n |
| Store | `src/stores/authStore.ts` | Persist, Supabase, types |
| Page | `src/pages/Wizard.tsx` | Complex state, routing |
| Hook | `src/hooks/useWizardForm.ts` | Form + Zod + store sync |
| Schema | `src/lib/validation/fitness.ts` | Enums, objects, helpers |
| Test | `src/test/onboardingStore.test.ts` | Store testing patterns |

### When In Doubt

1. Search for similar existing code
2. Follow the pattern from golden path files
3. Ask for clarification rather than guessing
4. Prefer simplicity over cleverness
5. Add types rather than using `any`

---

## Quick Reference Card

### File Creation Checklist

- [ ] TypeScript types defined
- [ ] Exports are correct (named vs default)
- [ ] Imports use `@/` alias
- [ ] No `any` types
- [ ] Dark mode supported
- [ ] Accessible (ARIA, semantic HTML)
- [ ] Translations used for UI text
- [ ] Error states handled
- [ ] Loading states handled

### Code Quality Checklist

- [ ] Functions are small and focused
- [ ] Names are descriptive
- [ ] No magic numbers
- [ ] No unused variables
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Types are specific (not `any`)

---

*Last Updated: 2026-01-27*
