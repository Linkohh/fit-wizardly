// API Client for FitWizard backend
// Falls back to localStorage when backend is unavailable

import type { Plan } from '@/types/fitness';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Feature flag for API usage
const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.DEV;

interface ApiResponse<T> {
    data?: T;
    error?: string;
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

export async function savePlan(plan: Plan, userId?: string): Promise<ApiResponse<Plan>> {
    if (!USE_API) {
        return { data: plan }; // localStorage fallback handled by store
    }

    try {
        const response = await fetchWithRetry(`${API_BASE}/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...plan,
                userId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { error: error.message || 'Failed to save plan' };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error - plan saved locally' };
    }
}

export async function getPlan(id: string): Promise<ApiResponse<Plan>> {
    if (!USE_API) {
        return { error: 'API not enabled' };
    }

    try {
        const response = await fetchWithRetry(`${API_BASE}/plans/${id}`, {
            method: 'GET',
        });

        if (!response.ok) {
            return { error: 'Plan not found' };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error' };
    }
}

export async function getPlans(userId?: string): Promise<ApiResponse<Plan[]>> {
    if (!USE_API) {
        return { data: [] };
    }

    try {
        const url = userId
            ? `${API_BASE}/plans?userId=${encodeURIComponent(userId)}`
            : `${API_BASE}/plans`;

        const response = await fetchWithRetry(url, { method: 'GET' });

        if (!response.ok) {
            return { error: 'Failed to fetch plans' };
        }

        const data = await response.json();
        return { data };
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error' };
    }
}

export async function deletePlanApi(id: string): Promise<ApiResponse<void>> {
    if (!USE_API) {
        return {};
    }

    try {
        const response = await fetchWithRetry(`${API_BASE}/plans/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok && response.status !== 204) {
            return { error: 'Failed to delete plan' };
        }

        return {};
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network error' };
    }
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
