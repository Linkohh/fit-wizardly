# Software Engineering Context

> **Lens Purpose**: This document provides comprehensive patterns for architecture, state management, API design, testing, and type safety. Read this before implementing any feature.

---

## Table of Contents
- [Core Stack](#core-stack)
- [Architecture Patterns](#architecture-patterns)
- [State Management (Zustand)](#state-management-zustand)
- [Data Fetching (TanStack Query)](#data-fetching-tanstack-query)
- [API Design](#api-design)
- [Type System](#type-system)
- [Validation with Zod](#validation-with-zod)
- [Component Patterns](#component-patterns)
- [Custom Hooks](#custom-hooks)
- [Testing Strategy](#testing-strategy)
- [Error Handling](#error-handling)
- [File Organization](#file-organization)

---

## Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **UI Framework** | React | 19 | Component-based UI |
| **Language** | TypeScript | 5.8 | Type safety |
| **Build** | Vite + SWC | 7 | Fast dev/build |
| **State** | Zustand | 5 | Global state management |
| **Server State** | TanStack Query | 5 | Data fetching, caching |
| **Routing** | React Router | 7 | Client-side routing |
| **Backend** | Express | - | API server (Port 3001) |
| **Database** | Supabase | - | PostgreSQL + Auth + Realtime |
| **Validation** | Zod | 4 | Runtime type checking |

---

## Architecture Patterns

### Layer Separation

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                      │
│  Pages → Components → UI Primitives                 │
├─────────────────────────────────────────────────────┤
│                    APPLICATION                       │
│  Hooks → Stores → Services                          │
├─────────────────────────────────────────────────────┤
│                      DOMAIN                          │
│  Types → Validation Schemas → Business Logic        │
├─────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                     │
│  API Client → Supabase → External Services          │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → Component → Hook/Store → API/Supabase → Database
                                    ↓
Database Response → Validation → State Update → Re-render
```

### Feature Module Structure

```
src/
├── features/
│   └── workouts/
│       ├── components/       # Feature-specific components
│       │   ├── WorkoutCard.tsx
│       │   └── WorkoutList.tsx
│       ├── hooks/           # Feature-specific hooks
│       │   └── useWorkouts.ts
│       ├── stores/          # Feature-specific stores
│       │   └── workoutStore.ts
│       ├── types/           # Feature-specific types
│       │   └── workout.ts
│       └── index.ts         # Public exports
```

---

## State Management (Zustand)

### Store Creation Pattern

```typescript
// src/stores/workoutStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// 1. Define state interface
interface WorkoutState {
  // State
  workouts: Workout[];
  selectedWorkout: Workout | null;
  isLoading: boolean;

  // Actions
  setWorkouts: (workouts: Workout[]) => void;
  selectWorkout: (id: string) => void;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  removeWorkout: (id: string) => void;
  reset: () => void;
}

// 2. Define initial state (for reset)
const initialState = {
  workouts: [],
  selectedWorkout: null,
  isLoading: false,
};

// 3. Create store with middleware
export const useWorkoutStore = create<WorkoutState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setWorkouts: (workouts) => set({ workouts }),

        selectWorkout: (id) => {
          const workout = get().workouts.find((w) => w.id === id);
          set({ selectedWorkout: workout ?? null });
        },

        addWorkout: (workout) =>
          set((state) => ({
            workouts: [...state.workouts, workout],
          })),

        updateWorkout: (id, updates) =>
          set((state) => ({
            workouts: state.workouts.map((w) =>
              w.id === id ? { ...w, ...updates } : w
            ),
          })),

        removeWorkout: (id) =>
          set((state) => ({
            workouts: state.workouts.filter((w) => w.id !== id),
            selectedWorkout:
              state.selectedWorkout?.id === id ? null : state.selectedWorkout,
          })),

        reset: () => set(initialState),
      }),
      {
        name: 'workout-storage', // localStorage key
        partialize: (state) => ({
          // Only persist these fields
          workouts: state.workouts,
        }),
      }
    ),
    { name: 'WorkoutStore' } // DevTools name
  )
);
```

### Store Usage Patterns

```typescript
// Selector pattern - only re-render when selected data changes
const workouts = useWorkoutStore((state) => state.workouts);
const isLoading = useWorkoutStore((state) => state.isLoading);

// Multiple selectors
const { workouts, selectedWorkout } = useWorkoutStore((state) => ({
  workouts: state.workouts,
  selectedWorkout: state.selectedWorkout,
}));

// Action-only access (no re-render on state change)
const addWorkout = useWorkoutStore((state) => state.addWorkout);

// Outside React (for services/utils)
const state = useWorkoutStore.getState();
useWorkoutStore.setState({ isLoading: true });
```

### When to Use Zustand vs TanStack Query

| Use Zustand | Use TanStack Query |
|-------------|-------------------|
| UI state (modals, sidebars) | Server data (CRUD operations) |
| User preferences | API responses |
| Form wizard state | Real-time subscriptions |
| Offline-first data | Paginated lists |

---

## Data Fetching (TanStack Query)

### Query Pattern

```typescript
// src/hooks/useWorkouts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { WorkoutSchema, type Workout } from '@/lib/validation/fitness';

// Query keys factory
export const workoutKeys = {
  all: ['workouts'] as const,
  lists: () => [...workoutKeys.all, 'list'] as const,
  list: (filters: string) => [...workoutKeys.lists(), { filters }] as const,
  details: () => [...workoutKeys.all, 'detail'] as const,
  detail: (id: string) => [...workoutKeys.details(), id] as const,
};

// Fetch function
async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Validate response data
  return data.map((item) => WorkoutSchema.parse(item));
}

// Query hook
export function useWorkouts() {
  return useQuery({
    queryKey: workoutKeys.lists(),
    queryFn: fetchWorkouts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
  });
}

// Single item hook
export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return WorkoutSchema.parse(data);
    },
    enabled: !!id, // Only fetch when id is provided
  });
}
```

### Mutation Pattern

```typescript
// Create mutation
export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workout: WorkoutInput) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

      if (error) throw error;
      return WorkoutSchema.parse(data);
    },
    onSuccess: (newWorkout) => {
      // Optimistic update
      queryClient.setQueryData<Workout[]>(
        workoutKeys.lists(),
        (old) => old ? [newWorkout, ...old] : [newWorkout]
      );
    },
    onError: (error) => {
      console.error('Failed to create workout:', error);
      toast.error('Failed to create workout');
    },
  });
}

// Update mutation with optimistic updates
export function useUpdateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Workout> }) => {
      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return WorkoutSchema.parse(data);
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: workoutKeys.detail(id) });

      // Snapshot previous value
      const previousWorkout = queryClient.getQueryData(workoutKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(workoutKeys.detail(id), (old: Workout | undefined) =>
        old ? { ...old, ...updates } : old
      );

      return { previousWorkout };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousWorkout) {
        queryClient.setQueryData(
          workoutKeys.detail(variables.id),
          context.previousWorkout
        );
      }
      toast.error('Failed to update workout');
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: workoutKeys.detail(id) });
    },
  });
}
```

---

## API Design

### Backend Route Pattern

```typescript
// server/src/routes/workouts.ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Request validation schema
const CreateWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  exercises: z.array(z.string()).min(1),
  scheduledFor: z.coerce.date().optional(),
});

// POST /api/workouts
router.post('/', requireAuth, async (req, res) => {
  try {
    // Validate request body
    const result = CreateWorkoutSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: result.error.format(),
      });
    }

    const workout = result.data;
    const userId = req.user!.id; // From auth middleware

    // Create in database
    const { data, error } = await supabase
      .from('workouts')
      .insert({ ...workout, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to create workout',
        code: 'DATABASE_ERROR',
      });
    }

    return res.status(201).json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
```

### API Response Format

```typescript
// Success response
interface ApiSuccess<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Error response
interface ApiError {
  error: string;           // User-friendly message
  code: string;            // Machine-readable code
  details?: unknown;       // Validation errors, etc.
  timestamp?: string;      // ISO timestamp
}

// Response codes
const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const;
```

### Frontend API Client

```typescript
// src/lib/apiClient.ts
const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Build URL with query params
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      ...options.headers,
    };

    const response = await fetch(url.toString(), {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error, data.code, response.status, data.details);
    }

    return data;
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
```

---

## Type System

### Type Definition Patterns

```typescript
// src/types/workout.ts

// Base entity type (from database)
export interface WorkoutEntity {
  id: string;
  user_id: string;
  name: string;
  exercises: string[];
  scheduled_for: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Domain type (camelCase, parsed dates)
export interface Workout {
  id: string;
  userId: string;
  name: string;
  exercises: string[];
  scheduledFor: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Create input (omit server-generated fields)
export type WorkoutInput = Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>;

// Update input (partial, omit immutable fields)
export type WorkoutUpdate = Partial<Omit<Workout, 'id' | 'userId' | 'createdAt'>>;

// List item (subset for lists)
export type WorkoutListItem = Pick<Workout, 'id' | 'name' | 'scheduledFor' | 'completedAt'>;
```

### Type Guards

```typescript
// Type guard for runtime checks
function isWorkout(value: unknown): value is Workout {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as Workout).id === 'string'
  );
}

// Usage
if (isWorkout(data)) {
  console.log(data.name); // TypeScript knows data is Workout
}
```

### Discriminated Unions

```typescript
// State machines with discriminated unions
type WorkoutStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: Workout }
  | { status: 'error'; error: Error };

function renderWorkout(state: WorkoutStatus) {
  switch (state.status) {
    case 'idle':
      return <EmptyState />;
    case 'loading':
      return <Skeleton />;
    case 'success':
      return <WorkoutCard workout={state.data} />;
    case 'error':
      return <ErrorState error={state.error} />;
  }
}
```

---

## Validation with Zod

### Schema Definition Patterns

```typescript
// src/lib/validation/workout.ts
import { z } from 'zod';

// Reusable field schemas
const NonEmptyString = z.string().min(1, 'Required');
const PositiveInt = z.number().int().positive();

// Entity schema
export const WorkoutSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: NonEmptyString.max(100, 'Name too long'),
  exercises: z.array(z.string()).min(1, 'Add at least one exercise'),
  scheduledFor: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Infer types from schema
export type Workout = z.infer<typeof WorkoutSchema>;

// Input schema (for forms)
export const WorkoutInputSchema = WorkoutSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WorkoutInput = z.infer<typeof WorkoutInputSchema>;

// Partial update schema
export const WorkoutUpdateSchema = WorkoutInputSchema.partial();
export type WorkoutUpdate = z.infer<typeof WorkoutUpdateSchema>;
```

### Form Integration

```typescript
// With react-hook-form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function WorkoutForm() {
  const form = useForm<WorkoutInput>({
    resolver: zodResolver(WorkoutInputSchema),
    defaultValues: {
      name: '',
      exercises: [],
      scheduledFor: null,
    },
  });

  const onSubmit = (data: WorkoutInput) => {
    // data is fully validated and typed
    createWorkout(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Validation Error Handling

```typescript
// Safe parsing with error handling
function parseWorkout(data: unknown): Workout | null {
  const result = WorkoutSchema.safeParse(data);

  if (!result.success) {
    console.error('Validation failed:', result.error.format());
    return null;
  }

  return result.data;
}

// Throwing parser (for trusted sources)
function parseWorkoutOrThrow(data: unknown): Workout {
  return WorkoutSchema.parse(data); // Throws ZodError on failure
}
```

---

## Component Patterns

### Component Structure

```typescript
// src/components/workout/WorkoutCard.tsx
import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Workout } from '@/types/workout';

// Props interface
interface WorkoutCardProps {
  workout: Workout;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  className?: string;
}

// Component with memo for performance
export const WorkoutCard = memo(function WorkoutCard({
  workout,
  onSelect,
  isSelected = false,
  className,
}: WorkoutCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isSelected && 'border-primary bg-primary/5',
        className
      )}
      onClick={() => onSelect?.(workout.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.(workout.id);
        }
      }}
    >
      <h3 className="font-semibold">{workout.name}</h3>
      <p className="text-sm text-muted-foreground">
        {workout.exercises.length} exercises
      </p>
    </div>
  );
});
```

### Compound Component Pattern

```typescript
// src/components/ui/Card.tsx
import { createContext, useContext, type ReactNode } from 'react';

// Context for compound components
const CardContext = createContext<{ variant: 'default' | 'elevated' }>({
  variant: 'default',
});

// Root component
interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated';
  className?: string;
}

export function Card({ children, variant = 'default', className }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div className={cn('rounded-lg border', className)}>
        {children}
      </div>
    </CardContext.Provider>
  );
}

// Sub-components
Card.Header = function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4 border-b', className)}>{children}</div>;
};

Card.Body = function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4 border-t', className)}>{children}</div>;
};

// Usage
<Card variant="elevated">
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

---

## Custom Hooks

### Hook Patterns

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Setter that persists to localStorage
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      return valueToStore;
    });
  }, [key]);

  // Remove from storage
  const removeValue = useCallback(() => {
    window.localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

### Async Hook Pattern

```typescript
// src/hooks/useAsync.ts
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, error: null, isLoading: true });
      try {
        const data = await asyncFunction(...args);
        setState({ data, error: null, isLoading: false });
        return data;
      } catch (error) {
        setState({ data: null, error: error as Error, isLoading: false });
        throw error;
      }
    },
    [asyncFunction]
  );

  return { ...state, execute };
}
```

---

## Testing Strategy

### Testing Pyramid

```
          ╱╲
         ╱  ╲
        ╱ E2E╲         Few, slow, high confidence
       ╱──────╲
      ╱        ╲
     ╱Integration╲    Some, medium speed
    ╱──────────────╲
   ╱                ╲
  ╱      Unit        ╲  Many, fast, focused
 ╱────────────────────╲
```

### Unit Test Pattern

```typescript
// src/lib/validation/__tests__/workout.test.ts
import { describe, it, expect } from 'vitest';
import { WorkoutSchema, WorkoutInputSchema } from '../workout';

describe('WorkoutSchema', () => {
  it('validates a valid workout', () => {
    const workout = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Push Day',
      exercises: ['bench-press', 'shoulder-press'],
      scheduledFor: '2024-01-15T10:00:00Z',
      completedAt: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const result = WorkoutSchema.safeParse(workout);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const workout = {
      name: '',
      exercises: ['bench-press'],
    };

    const result = WorkoutInputSchema.safeParse(workout);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['name']);
  });
});
```

### Component Test Pattern

```typescript
// src/components/workout/__tests__/WorkoutCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutCard } from '../WorkoutCard';

const mockWorkout = {
  id: '1',
  name: 'Push Day',
  exercises: ['bench-press', 'shoulder-press'],
  // ... other fields
};

describe('WorkoutCard', () => {
  it('renders workout name', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('Push Day')).toBeInTheDocument();
  });

  it('shows exercise count', () => {
    render(<WorkoutCard workout={mockWorkout} />);
    expect(screen.getByText('2 exercises')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<WorkoutCard workout={mockWorkout} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });

  it('applies selected styles when isSelected is true', () => {
    render(<WorkoutCard workout={mockWorkout} isSelected />);
    expect(screen.getByRole('button')).toHaveClass('border-primary');
  });
});
```

### Hook Test Pattern

```typescript
// src/hooks/__tests__/useLocalStorage.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when storage is empty', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    expect(result.current[0]).toBe('initial');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('test-key')).toBe('"updated"');
    expect(result.current[0]).toBe('updated');
  });
});
```

---

## Error Handling

### Error Boundary Pattern

```typescript
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-8">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message}
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Class

```typescript
// src/lib/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

// Usage
try {
  await api.post('/workouts', data);
} catch (error) {
  if (ApiError.isApiError(error)) {
    if (error.code === 'VALIDATION_ERROR') {
      // Handle validation errors
      form.setErrors(error.details);
    } else if (error.status === 401) {
      // Handle unauthorized
      redirectToLogin();
    }
  }
}
```

---

## File Organization

### Import Order

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// 3. Internal absolute imports (@/)
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

// 4. Types
import type { Workout } from '@/types/workout';

// 5. Relative imports
import { WorkoutCard } from './WorkoutCard';
import styles from './Workout.module.css';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `WorkoutCard.tsx` |
| Hooks | camelCase, `use` prefix | `useWorkouts.ts` |
| Stores | camelCase, `Store` suffix | `workoutStore.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Workout`, `WorkoutInput` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_EXERCISES` |
| CSS Modules | camelCase | `workoutCard.module.css` |

### Index Files

```typescript
// src/components/workout/index.ts
export { WorkoutCard } from './WorkoutCard';
export { WorkoutList } from './WorkoutList';
export { WorkoutForm } from './WorkoutForm';

// Types re-export
export type { WorkoutCardProps } from './WorkoutCard';
```
