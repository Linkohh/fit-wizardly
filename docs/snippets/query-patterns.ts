/**
 * TanStack Query Patterns - Reusable patterns for data fetching
 *
 * This file contains copy-paste-ready patterns for TanStack React Query v5.
 * Each pattern demonstrates best practices for server state management.
 *
 * Key dependencies:
 * - @tanstack/react-query v5
 * - zod (for response validation)
 */

import {
    useQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { z } from 'zod';

// ============================================================================
// PATTERN 1: Query Key Factory
// ============================================================================

/**
 * Centralized query key factory for type-safe, consistent cache keys.
 * All keys for a domain should be defined in one place.
 */
export const planKeys = {
    // Base key for all plan queries
    all: ['plans'] as const,

    // All lists of plans
    lists: () => [...planKeys.all, 'list'] as const,

    // Filtered list
    list: (filters: { userId?: string; status?: string }) =>
        [...planKeys.lists(), filters] as const,

    // All detail queries
    details: () => [...planKeys.all, 'detail'] as const,

    // Single plan by ID
    detail: (id: string) => [...planKeys.details(), id] as const,
};

export const exerciseKeys = {
    all: ['exercises'] as const,
    lists: () => [...exerciseKeys.all, 'list'] as const,
    list: (filters: { muscle?: string; equipment?: string[] }) =>
        [...exerciseKeys.lists(), filters] as const,
    detail: (id: string) => [...exerciseKeys.all, 'detail', id] as const,
};

// ============================================================================
// PATTERN 2: Basic Query with Validation
// ============================================================================

// Response schema
const PlanSchema = z.object({
    id: z.string(),
    userId: z.string(),
    createdAt: z.string(),
    splitType: z.string(),
    workoutDays: z.array(z.object({
        name: z.string(),
        exercises: z.array(z.any()),
    })),
});

type Plan = z.infer<typeof PlanSchema>;

// API client function
async function fetchPlan(id: string): Promise<Plan> {
    const response = await fetch(`/api/plans/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch plan');
    }

    const data = await response.json();

    // Validate response against schema
    const result = PlanSchema.safeParse(data);
    if (!result.success) {
        console.error('Invalid plan data:', result.error);
        throw new Error('Invalid plan data received');
    }

    return result.data;
}

// Query hook
export function usePlan(id: string) {
    return useQuery({
        queryKey: planKeys.detail(id),
        queryFn: () => fetchPlan(id),
        // Stale time: data is fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache time: keep in cache for 30 minutes
        gcTime: 30 * 60 * 1000,
        // Only fetch if ID is provided
        enabled: !!id,
    });
}

// ============================================================================
// PATTERN 3: Query with Auth Token
// ============================================================================

// Import auth store
// import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function fetchPlans(token: string | undefined): Promise<Plan[]> {
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/plans`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Session expired');
        }
        throw new Error('Failed to fetch plans');
    }

    return response.json();
}

export function usePlans() {
    // Get token from auth store
    // const { session } = useAuthStore();
    // const token = session?.access_token;

    // For demo purposes:
    const token = 'demo-token';

    return useQuery({
        queryKey: planKeys.lists(),
        queryFn: () => fetchPlans(token),
        enabled: !!token,
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Retry failed requests 3 times
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
}

// ============================================================================
// PATTERN 4: Mutation with Optimistic Updates
// ============================================================================

interface CreatePlanInput {
    splitType: string;
    workoutDays: Array<{
        name: string;
        exercises: unknown[];
    }>;
}

export function useCreatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreatePlanInput) => {
            const response = await fetch(`${API_URL}/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add auth header in real implementation
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create plan');
            }

            return response.json();
        },

        // Optimistic update
        onMutate: async (newPlan) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: planKeys.lists() });

            // Snapshot previous value
            const previousPlans = queryClient.getQueryData<Plan[]>(planKeys.lists());

            // Optimistically add to list
            queryClient.setQueryData<Plan[]>(planKeys.lists(), (old) => [
                ...(old || []),
                {
                    id: 'temp-' + Date.now(),
                    userId: 'current-user',
                    createdAt: new Date().toISOString(),
                    ...newPlan,
                },
            ]);

            return { previousPlans };
        },

        // Rollback on error
        onError: (_err, _newPlan, context) => {
            if (context?.previousPlans) {
                queryClient.setQueryData(planKeys.lists(), context.previousPlans);
            }
        },

        // Refetch after success or error
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: planKeys.lists() });
        },
    });
}

// ============================================================================
// PATTERN 5: Mutation with Side Effects
// ============================================================================

interface UpdatePlanInput {
    id: string;
    workoutDays?: Array<{ name: string; exercises: unknown[] }>;
    notes?: Array<{ content: string }>;
}

export function useUpdatePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: UpdatePlanInput) => {
            const response = await fetch(`${API_URL}/plans/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Failed to update plan');
            }

            return response.json();
        },

        onSuccess: (updatedPlan) => {
            // Update the specific plan in cache
            queryClient.setQueryData(planKeys.detail(updatedPlan.id), updatedPlan);

            // Update the plan in the list cache
            queryClient.setQueryData<Plan[]>(planKeys.lists(), (old) =>
                old?.map((plan) =>
                    plan.id === updatedPlan.id ? updatedPlan : plan
                )
            );
        },
    });
}

// ============================================================================
// PATTERN 6: Delete Mutation
// ============================================================================

export function useDeletePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_URL}/plans/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete plan');
            }
        },

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: planKeys.lists() });

            const previousPlans = queryClient.getQueryData<Plan[]>(planKeys.lists());

            // Optimistically remove from list
            queryClient.setQueryData<Plan[]>(planKeys.lists(), (old) =>
                old?.filter((plan) => plan.id !== id)
            );

            return { previousPlans };
        },

        onError: (_err, _id, context) => {
            if (context?.previousPlans) {
                queryClient.setQueryData(planKeys.lists(), context.previousPlans);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: planKeys.lists() });
        },
    });
}

// ============================================================================
// PATTERN 7: Infinite Query (Pagination)
// ============================================================================

interface PaginatedResponse<T> {
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

async function fetchPaginatedExercises(
    cursor: string | null,
    filters: { muscle?: string }
): Promise<PaginatedResponse<unknown>> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (filters.muscle) params.append('muscle', filters.muscle);

    const response = await fetch(`${API_URL}/exercises?${params}`);
    return response.json();
}

export function useInfiniteExercises(filters: { muscle?: string }) {
    return useInfiniteQuery({
        queryKey: exerciseKeys.list(filters),
        queryFn: ({ pageParam }) => fetchPaginatedExercises(pageParam, filters),
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        getPreviousPageParam: () => undefined,
    });
}

// ============================================================================
// PATTERN 8: Prefetching
// ============================================================================

export function usePrefetchPlan() {
    const queryClient = useQueryClient();

    return (id: string) => {
        queryClient.prefetchQuery({
            queryKey: planKeys.detail(id),
            queryFn: () => fetchPlan(id),
            staleTime: 5 * 60 * 1000,
        });
    };
}

// Usage in component:
// const prefetchPlan = usePrefetchPlan();
// <Link onMouseEnter={() => prefetchPlan(plan.id)} to={`/plans/${plan.id}`}>

// ============================================================================
// PATTERN 9: Query Client Configuration
// ============================================================================

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Consider data stale after 1 minute
                staleTime: 60 * 1000,
                // Keep in cache for 5 minutes
                gcTime: 5 * 60 * 1000,
                // Retry failed requests 3 times
                retry: 3,
                // Don't refetch on mount if data is fresh
                refetchOnMount: false,
                // Refetch when window regains focus
                refetchOnWindowFocus: true,
            },
            mutations: {
                // Don't retry mutations by default
                retry: false,
            },
        },
    });
}

// ============================================================================
// PATTERN 10: Dependent Queries
// ============================================================================

export function useUserPlanWithExercises(userId: string) {
    // First query: get user's active plan
    const planQuery = useQuery({
        queryKey: ['user', userId, 'activePlan'],
        queryFn: () => fetch(`/api/users/${userId}/active-plan`).then((r) => r.json()),
        enabled: !!userId,
    });

    // Second query: get exercises for the plan (depends on first query)
    const exercisesQuery = useQuery({
        queryKey: ['plan', planQuery.data?.id, 'exercises'],
        queryFn: () =>
            fetch(`/api/plans/${planQuery.data.id}/exercises`).then((r) => r.json()),
        // Only run when we have the plan ID
        enabled: !!planQuery.data?.id,
    });

    return {
        plan: planQuery.data,
        exercises: exercisesQuery.data,
        isLoading: planQuery.isLoading || exercisesQuery.isLoading,
        error: planQuery.error || exercisesQuery.error,
    };
}

// Missing import
import { useInfiniteQuery } from '@tanstack/react-query';
