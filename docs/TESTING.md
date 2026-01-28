# TESTING.md - Testing Patterns and Strategies

> **Purpose**: Comprehensive guide to testing patterns, infrastructure, and best practices.
> **Audience**: Developers writing tests, AI assistants generating test code.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Test File Organization](#test-file-organization)
4. [Unit Testing Patterns](#unit-testing-patterns)
5. [Testing Zod Schemas](#testing-zod-schemas)
6. [Testing Zustand Stores](#testing-zustand-stores)
7. [Testing Custom Hooks](#testing-custom-hooks)
8. [Testing Components](#testing-components)
9. [Mocking Patterns](#mocking-patterns)
10. [Test Data Factories](#test-data-factories)
11. [Best Practices](#best-practices)

---

## Overview

### Testing Stack

| Tool | Purpose |
|------|---------|
| **Vitest** | Test runner (fast, Vite-native) |
| **@testing-library/react** | Component testing |
| **@testing-library/jest-dom** | DOM matchers |
| **jsdom** | Browser environment simulation |

### Test Commands

```bash
# Run all tests in watch mode
npm run test

# Run tests once (CI mode)
npm run test -- --run

# Run specific test file
npm run test src/lib/__tests__/planValidation.test.ts

# Run tests matching pattern
npm run test -- --grep "validation"

# Run with coverage
npm run test -- --coverage
```

---

## Test Infrastructure

### Vitest Configuration

**File**: [`vitest.config.ts`](../vitest.config.ts)

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,           // No need to import describe, it, expect
        environment: 'jsdom',    // Browser-like environment
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
});
```

### Test Setup File

**File**: [`src/test/setup.ts`](../src/test/setup.ts)

```typescript
import '@testing-library/jest-dom';
```

This file runs before all tests and:
- Adds custom DOM matchers (`toBeInTheDocument`, `toHaveClass`, etc.)
- Can be extended for global mocks

---

## Test File Organization

### Directory Structure

```
src/
├── lib/
│   ├── __tests__/                    # Unit tests for lib functions
│   │   ├── planValidation.test.ts    # ~2,000 lines
│   │   ├── planGenerator.test.ts     # ~5,500 lines
│   │   └── suggestExercises.test.ts  # ~1,500 lines
│   └── planValidation.ts
├── test/
│   ├── setup.ts                      # Global test setup
│   ├── exercises.test.ts             # ~3,200 lines
│   └── onboardingStore.test.ts       # ~5,000 lines
└── components/
    └── __tests__/                    # Component tests
        └── Button.test.tsx
```

### Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `*.test.ts` | `planValidation.test.ts` | Unit tests |
| `*.test.tsx` | `Button.test.tsx` | Component tests |
| `*.spec.ts` | `api.spec.ts` | Integration/spec tests |

---

## Unit Testing Patterns

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '../module';

describe('functionUnderTest', () => {
    // Group related tests
    describe('when input is valid', () => {
        it('returns expected output', () => {
            const result = functionUnderTest({ valid: true });
            expect(result).toBe('success');
        });
    });

    describe('when input is invalid', () => {
        it('throws an error', () => {
            expect(() => functionUnderTest({ valid: false }))
                .toThrow('Invalid input');
        });
    });
});
```

### Testing with Base Data

**Pattern**: Create a base object and spread to modify specific properties.

```typescript
// From planValidation.test.ts
describe('validatePlanBalance', () => {
    const baseSelections: WizardSelections = {
        firstName: '', lastName: '', personalGoalNote: 'test',
        isTrainer: false, coachNotes: '',
        goal: 'general', experienceLevel: 'intermediate',
        equipment: ['dumbbells'], targetMuscles: ['chest', 'back', 'quads'],
        constraints: [], daysPerWeek: 3, sessionDuration: 60,
        optPhase: 'stabilization_endurance'
    };

    it('warns on low frequency for hypertrophy', () => {
        const warnings = validatePlanBalance({
            ...baseSelections,
            goal: 'hypertrophy',
            daysPerWeek: 2
        });
        expect(warnings.some(w => w.id === 'frequency_low')).toBe(true);
    });

    it('returns no warnings for balanced plan', () => {
        const warnings = validatePlanBalance({ ...baseSelections });
        expect(warnings).toHaveLength(0);
    });
});
```

### Testing Edge Cases

```typescript
describe('edge cases', () => {
    it('handles empty array', () => {
        expect(processItems([])).toEqual([]);
    });

    it('handles null/undefined', () => {
        expect(processItems(null)).toEqual([]);
        expect(processItems(undefined)).toEqual([]);
    });

    it('handles boundary values', () => {
        expect(calculateSets(0)).toBe(0);
        expect(calculateSets(10)).toBe(10); // max
        expect(calculateSets(11)).toBe(10); // capped
    });
});
```

---

## Testing Zod Schemas

### Testing Schema Validation

```typescript
import { describe, it, expect } from 'vitest';
import { WizardSelectionsSchema } from '@/lib/validation/fitness';

describe('WizardSelectionsSchema', () => {
    const validData = {
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        equipment: ['barbell', 'dumbbells'],
        targetMuscles: ['chest', 'back'],
        constraints: [],
        daysPerWeek: 4,
        sessionDuration: 60,
    };

    describe('valid input', () => {
        it('accepts complete valid data', () => {
            const result = WizardSelectionsSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('accepts data with empty constraints', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                constraints: [],
            });
            expect(result.success).toBe(true);
        });
    });

    describe('invalid input', () => {
        it('rejects invalid goal', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                goal: 'invalid_goal',
            });
            expect(result.success).toBe(false);
            expect(result.error?.issues[0].path).toContain('goal');
        });

        it('rejects empty equipment array', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                equipment: [],
            });
            expect(result.success).toBe(false);
        });

        it('rejects daysPerWeek below minimum', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                daysPerWeek: 1,
            });
            expect(result.success).toBe(false);
        });

        it('rejects daysPerWeek above maximum', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                daysPerWeek: 7,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('type coercion', () => {
        it('coerces string numbers to numbers', () => {
            const result = WizardSelectionsSchema.safeParse({
                ...validData,
                daysPerWeek: '4', // string, not number
            });
            // Depends on schema definition - test actual behavior
            expect(result.success).toBe(false); // strict mode
        });
    });
});
```

### Testing Enum Schemas

```typescript
import { GoalSchema, EquipmentSchema } from '@/lib/validation/fitness';

describe('GoalSchema', () => {
    const validGoals = ['strength', 'hypertrophy', 'general'];

    it.each(validGoals)('accepts valid goal: %s', (goal) => {
        expect(GoalSchema.safeParse(goal).success).toBe(true);
    });

    it('rejects invalid goal', () => {
        expect(GoalSchema.safeParse('cardio').success).toBe(false);
    });

    it('rejects non-string values', () => {
        expect(GoalSchema.safeParse(123).success).toBe(false);
        expect(GoalSchema.safeParse(null).success).toBe(false);
    });
});
```

---

## Testing Zustand Stores

### Basic Store Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from '@/stores/onboardingStore';

describe('onboardingStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useOnboardingStore.getState().resetOnboarding();
    });

    describe('initial state', () => {
        it('starts with isComplete = false', () => {
            const { isComplete } = useOnboardingStore.getState();
            expect(isComplete).toBe(false);
        });

        it('starts with hasStarted = false', () => {
            const { hasStarted } = useOnboardingStore.getState();
            expect(hasStarted).toBe(false);
        });

        it('starts at welcome step', () => {
            const { currentStep } = useOnboardingStore.getState();
            expect(currentStep).toBe('welcome');
        });

        it('has default user data', () => {
            const { userData } = useOnboardingStore.getState();
            expect(userData.displayName).toBe('');
            expect(userData.role).toBe('user');
            expect(userData.avatarEmoji).toBe('💪');
            expect(userData.interestedGoals).toEqual([]);
        });
    });
});
```

### Testing Store Actions

```typescript
describe('step navigation', () => {
    it('advances to next step', () => {
        const store = useOnboardingStore.getState();
        store.nextStep();
        expect(useOnboardingStore.getState().currentStep).toBe('role');
    });

    it('goes back to previous step', () => {
        const store = useOnboardingStore.getState();
        store.setStep('goals');
        store.prevStep();
        expect(useOnboardingStore.getState().currentStep).toBe('role');
    });

    it('does not go before first step', () => {
        const store = useOnboardingStore.getState();
        store.prevStep();
        expect(useOnboardingStore.getState().currentStep).toBe('welcome');
    });
});
```

### Testing Store with Persistence

```typescript
import { afterEach, vi } from 'vitest';

describe('store with persistence', () => {
    // Mock localStorage
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };
    })();

    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
        });
        localStorageMock.clear();
    });

    it('persists state to localStorage', () => {
        // Your test here
    });
});
```

---

## Testing Custom Hooks

### Testing with renderHook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useWizardForm } from '@/hooks/useWizardForm';
import { goalStepSchema } from '@/hooks/useWizardForm';

describe('useWizardForm', () => {
    const defaultProps = {
        schema: goalStepSchema,
        defaultValues: {
            goal: 'general',
            experienceLevel: 'beginner',
        },
        onSync: vi.fn(),
    };

    it('initializes with default values', () => {
        const { result } = renderHook(() => useWizardForm(defaultProps));

        expect(result.current.getValues('goal')).toBe('general');
        expect(result.current.getValues('experienceLevel')).toBe('beginner');
    });

    it('validates on change', async () => {
        const { result } = renderHook(() => useWizardForm(defaultProps));

        await act(async () => {
            result.current.setValue('goal', 'invalid' as any);
        });

        expect(result.current.formState.errors.goal).toBeDefined();
    });

    it('syncs valid data to store', async () => {
        const onSync = vi.fn();
        const { result } = renderHook(() =>
            useWizardForm({ ...defaultProps, onSync })
        );

        await act(async () => {
            result.current.setValue('goal', 'hypertrophy');
        });

        expect(onSync).toHaveBeenCalledWith(
            expect.objectContaining({ goal: 'hypertrophy' })
        );
    });
});
```

---

## Testing Components

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
    it('renders with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        await userEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
        render(<Button disabled>Click me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
```

### Testing with Providers

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    {children}
                </BrowserRouter>
            </QueryClientProvider>
        );
    };
}

describe('ComponentWithProviders', () => {
    it('renders correctly', () => {
        render(<MyComponent />, { wrapper: createWrapper() });
        expect(screen.getByText('Expected text')).toBeInTheDocument();
    });
});
```

---

## Mocking Patterns

### Mocking Functions

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');
mockFn.mockResolvedValue('async mocked value');

// Verify calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { user: { id: 'test-id' } } },
            }),
        },
    },
}));

// Mock with factory
vi.mock('@/stores/authStore', () => ({
    useAuthStore: vi.fn(() => ({
        session: { access_token: 'test-token' },
        user: { id: 'user-id' },
    })),
}));
```

### Mocking Fetch

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('API calls', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        global.fetch = mockFetch;
    });

    afterEach(() => {
        mockFetch.mockReset();
    });

    it('handles successful response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: 'test' }),
        });

        const result = await fetchData();
        expect(result).toEqual({ data: 'test' });
    });

    it('handles error response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: 'Not found' }),
        });

        await expect(fetchData()).rejects.toThrow('Not found');
    });
});
```

---

## Test Data Factories

### Creating Test Data

```typescript
// src/test/factories/workout.ts
import { v4 as uuid } from 'uuid';
import type { Plan, WorkoutDay, Exercise } from '@/types/fitness';

export function createTestExercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: uuid(),
        name: 'Test Exercise',
        primaryMuscles: ['chest'],
        secondaryMuscles: [],
        equipment: ['dumbbells'],
        patterns: ['horizontal_push'],
        contraindications: [],
        cues: ['Keep core tight'],
        ...overrides,
    };
}

export function createTestWorkoutDay(overrides: Partial<WorkoutDay> = {}): WorkoutDay {
    return {
        dayIndex: 0,
        name: 'Test Day',
        focusTags: ['push'],
        exercises: [],
        estimatedDuration: 60,
        ...overrides,
    };
}

export function createTestPlan(overrides: Partial<Plan> = {}): Plan {
    return {
        id: uuid(),
        createdAt: new Date(),
        selections: {
            goal: 'hypertrophy',
            experienceLevel: 'intermediate',
            equipment: ['dumbbells'],
            targetMuscles: ['chest'],
            constraints: [],
            daysPerWeek: 4,
            sessionDuration: 60,
        },
        splitType: 'upper_lower',
        workoutDays: [createTestWorkoutDay()],
        weeklyVolume: [],
        rirProgression: [],
        notes: [],
        schemaVersion: 1,
        ...overrides,
    };
}
```

### Using Factories in Tests

```typescript
import { createTestPlan, createTestExercise } from '@/test/factories/workout';

describe('Plan operations', () => {
    it('adds exercise to workout day', () => {
        const plan = createTestPlan();
        const exercise = createTestExercise({ name: 'Bench Press' });

        const updated = addExerciseToDay(plan, 0, exercise);
        expect(updated.workoutDays[0].exercises).toContainEqual(
            expect.objectContaining({ name: 'Bench Press' })
        );
    });
});
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Good: Tests behavior
it('displays error message when form is invalid', () => {
    render(<Form />);
    fireEvent.click(submitButton);
    expect(screen.getByText('Name is required')).toBeInTheDocument();
});

// Bad: Tests implementation
it('sets error state to true', () => {
    const { result } = renderHook(() => useForm());
    act(() => result.current.submit());
    expect(result.current.errors).toBeTruthy(); // Implementation detail
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
it('returns empty array when no exercises match the selected equipment', () => {});

// Bad
it('works correctly', () => {});
it('test 1', () => {});
```

### 3. One Assertion Per Concept

```typescript
// Good: Each test verifies one thing
it('validates minimum days per week', () => {
    const result = schema.safeParse({ ...valid, daysPerWeek: 1 });
    expect(result.success).toBe(false);
});

it('validates maximum days per week', () => {
    const result = schema.safeParse({ ...valid, daysPerWeek: 7 });
    expect(result.success).toBe(false);
});

// Acceptable: Related assertions
it('has correct initial state', () => {
    const state = useStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.data).toEqual([]);
});
```

### 4. Use beforeEach for Common Setup

```typescript
describe('Store tests', () => {
    beforeEach(() => {
        // Reset to known state
        useStore.getState().reset();
    });

    // Each test starts with clean state
});
```

### 5. Avoid Testing Third-Party Libraries

```typescript
// Bad: Testing Zod itself
it('validates string type', () => {
    expect(z.string().safeParse('test').success).toBe(true);
});

// Good: Testing YOUR schema
it('rejects invalid goal values', () => {
    expect(GoalSchema.safeParse('cardio').success).toBe(false);
});
```

### 6. Use Test IDs Sparingly

```typescript
// Prefer accessible queries
screen.getByRole('button', { name: 'Submit' });
screen.getByLabelText('Email address');
screen.getByText('Welcome');

// Use test IDs only when necessary
screen.getByTestId('complex-chart'); // No semantic meaning
```

### 7. Clean Up After Tests

```typescript
afterEach(() => {
    vi.clearAllMocks();
    cleanup(); // @testing-library/react
});
```

---

## Test Coverage

### Running Coverage

```bash
npm run test -- --coverage
```

### Coverage Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Statements | 80% | High |
| Branches | 75% | Medium |
| Functions | 80% | High |
| Lines | 80% | High |

### Coverage Exclusions

Files typically excluded from coverage:
- `*.d.ts` - Type definitions
- `*.config.*` - Configuration files
- `src/test/**` - Test utilities
- `src/main.tsx` - Entry point

---

## Quick Reference

| Pattern | When to Use |
|---------|-------------|
| `describe/it` | Group and name tests |
| `beforeEach` | Reset state before each test |
| `vi.fn()` | Mock functions |
| `vi.mock()` | Mock modules |
| `renderHook` | Test custom hooks |
| `render` | Test components |
| `screen.getBy*` | Find elements |
| `userEvent` | Simulate user interactions |
| `waitFor` | Wait for async operations |

---

*Last Updated: 2026-01-27*
