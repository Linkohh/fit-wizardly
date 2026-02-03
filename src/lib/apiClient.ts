// API Client for FitWizard backend
// Falls back to localStorage when backend is unavailable

import type { Plan } from '@/types/fitness';

import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Feature flag for API usage
const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.DEV;

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
        ? { 'Authorization': `Bearer ${session.access_token}` }
        : {};
}

export function isApiEnabled(): boolean {
    return USE_API;
}

function normalizePlanDates(plan: unknown): Plan {
    if (!plan || typeof plan !== 'object') return plan as Plan;

    const createdAt = (plan as { createdAt?: unknown }).createdAt;
    if (createdAt instanceof Date) return plan as Plan;
    if (typeof createdAt !== 'string') return plan as Plan;

    const createdAtDate = new Date(createdAt);
    if (Number.isNaN(createdAtDate.getTime())) return plan as Plan;

    return { ...(plan as object), createdAt: createdAtDate } as Plan;
}

async function getErrorMessage(response: Response): Promise<string> {
    try {
        const body = await response.json();
        if (body?.error && typeof body.error === 'string') return body.error;
        if (body?.message && typeof body.message === 'string') return body.message;
        return `HTTP ${response.status}`;
    } catch {
        return `HTTP ${response.status}`;
    }
}

// Retry with exponential backoff
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = 3,
    delay = 500
): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (response.ok) return response;

        // Don't retry 4xx errors
        if (response.status >= 400 && response.status < 500) {
            return response;
        }

        throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

// ============================================================================
// PLANS API
// ============================================================================

export async function savePlan(plan: Plan, userId?: string): Promise<Plan> {
    if (!USE_API) return plan; // localStorage fallback handled by store

    const authHeaders = await getAuthHeaders();
    const response = await fetchWithRetry(`${API_BASE}/plans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
        },
        body: JSON.stringify({
            ...plan,
            userId,
        }),
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return normalizePlanDates(await response.json());
}

export async function getPlan(id: string): Promise<Plan> {
    if (!USE_API) throw new Error('API not enabled');

    const authHeaders = await getAuthHeaders();
    const response = await fetchWithRetry(`${API_BASE}/plans/${id}`, {
        method: 'GET',
        headers: { ...authHeaders }
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return normalizePlanDates(await response.json());
}

export async function getPlans(userId?: string): Promise<Plan[]> {
    if (!USE_API) return [];

    const url = userId
        ? `${API_BASE}/plans?userId=${encodeURIComponent(userId)}`
        : `${API_BASE}/plans`;

    const authHeaders = await getAuthHeaders();
    const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: { ...authHeaders }
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    const plans = await response.json();
    return Array.isArray(plans) ? plans.map(normalizePlanDates) : [];
}

export async function deletePlanApi(id: string): Promise<void> {
    if (!USE_API) return;

    const authHeaders = await getAuthHeaders();
    const response = await fetchWithRetry(`${API_BASE}/plans/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders }
    });

    if (!response.ok && response.status !== 204) {
        throw new Error(await getErrorMessage(response));
    }

    return;
}

// Health check
export async function checkApiHealth(): Promise<boolean> {
    if (!USE_API) return false;

    try {
        const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
        return response.ok;
    } catch {
        return false;
    }
}
