# API_REFERENCE.md - Complete API Documentation

> **Purpose**: Complete reference for all backend API endpoints.
> **Audience**: Frontend developers, API consumers, AI assistants building features.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Plans API](#plans-api)
5. [Error Responses](#error-responses)
6. [Request/Response Examples](#requestresponse-examples)
7. [TypeScript Types](#typescript-types)

---

## Overview

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3001` |
| Production | `https://api.fitwizard.app` (configure via `VITE_API_URL`) |

### API Conventions

- **Content-Type**: `application/json` for all requests/responses
- **Authentication**: Bearer token in `Authorization` header
- **Timestamps**: ISO 8601 format (`2024-01-15T10:30:00.000Z`)
- **IDs**: UUID v4 format
- **HTTP Methods**: REST semantics (GET=read, POST=create, PATCH=update, DELETE=remove)

### CORS Configuration

Allowed origins (configurable via `ALLOWED_ORIGINS` env var):
- `http://localhost:8080` (Vite dev server)
- `http://localhost:5173` (Vite alternative)
- `http://localhost:3000` (Create React App)

Allowed methods: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
Allowed headers: `Content-Type`, `Authorization`

---

## Authentication

All endpoints except `/health` require authentication.

### Token Format

```
Authorization: Bearer <supabase_access_token>
```

### Token Verification

Tokens are verified against Supabase Auth API:
```
GET https://<project>.supabase.co/auth/v1/user
```

### Obtaining Tokens

```typescript
import { supabase } from '@/lib/supabase';

// After login
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Token Lifecycle

| Event | Token Status |
|-------|--------------|
| Magic link clicked | New access token issued |
| Session refresh | Token refreshed automatically |
| Logout | Token invalidated |
| Token expiry | 401 response, trigger refresh |

### Authentication Errors

| Status | Error | Cause |
|--------|-------|-------|
| 401 | Missing or invalid Authorization header | No Bearer token |
| 401 | Invalid or expired token | Token verification failed |
| 500 | Internal authentication error | Supabase API unavailable |

---

## Rate Limiting

### Default Limits

| Limit Type | Window | Max Requests |
|------------|--------|--------------|
| General | 15 minutes | 100 |
| Auth-related | 15 minutes | 20 |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

### Rate Limit Exceeded

```json
{
    "error": "Too many requests, please try again later"
}
```
**Status**: `429 Too Many Requests`

---

## Plans API

### GET /health

Health check endpoint (no authentication required).

**Response**
```json
{
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### POST /plans

Create a new workout plan.

**Authentication**: Required

**Request Body**
```json
{
    "selections": {
        "goal": "hypertrophy",
        "experienceLevel": "intermediate",
        "equipment": ["barbell", "dumbbells", "bench"],
        "daysPerWeek": 4,
        "sessionDuration": 60,
        "muscleTargets": {
            "chest": 16,
            "back": 16
        }
    },
    "splitType": "upper_lower",
    "workoutDays": [
        {
            "name": "Upper A",
            "dayIndex": 0,
            "exercises": [
                {
                    "exerciseId": "bench-press",
                    "name": "Bench Press",
                    "sets": [
                        { "reps": 8, "weight": 135, "rir": 2 },
                        { "reps": 8, "weight": 135, "rir": 2 },
                        { "reps": 8, "weight": 135, "rir": 2 }
                    ],
                    "muscleGroup": "chest"
                }
            ]
        }
    ],
    "weeklyVolume": [
        { "muscleGroup": "chest", "sets": 16, "targetSets": 16 }
    ],
    "rirProgression": [
        { "week": 1, "targetRir": 3 },
        { "week": 2, "targetRir": 2 },
        { "week": 3, "targetRir": 1 },
        { "week": 4, "targetRir": 3 }
    ],
    "notes": []
}
```

**Validation Rules**
| Field | Constraint |
|-------|------------|
| `id` | Optional UUID (auto-generated if omitted) |
| `splitType` | 1-50 characters |
| `workoutDays` | 1-7 items |
| `workoutDays[].name` | 1-100 characters |
| `workoutDays[].exercises` | Max 50 items |
| `exercises[].sets` | Max 20 items |
| `exercises[].sets[].reps` | 0-1000 |
| `exercises[].sets[].weight` | 0-10000 |
| `weeklyVolume` | Max 50 items |
| `rirProgression` | Max 52 items (1 year) |
| `notes` | Max 100 items |

**Success Response**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "selections": { /* ... */ },
    "splitType": "upper_lower",
    "workoutDays": [ /* ... */ ],
    "weeklyVolume": [ /* ... */ ],
    "rirProgression": [ /* ... */ ],
    "notes": [],
    "schemaVersion": 1
}
```
**Status**: `201 Created`

**Error Responses**
| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid input | Schema validation failed |
| 403 | Cannot create plan for another user | userId mismatch |

---

### GET /plans

Get all plans for the authenticated user.

**Authentication**: Required

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | UUID | Optional, must match authenticated user |

**Success Response**
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "user-uuid",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "selections": { /* ... */ },
        "splitType": "upper_lower",
        "workoutDays": [ /* ... */ ],
        "weeklyVolume": [ /* ... */ ],
        "rirProgression": [ /* ... */ ],
        "notes": [],
        "schemaVersion": 1
    }
]
```
**Status**: `200 OK`

**Error Responses**
| Status | Error | Cause |
|--------|-------|-------|
| 403 | Unauthorized to view these plans | userId query param doesn't match token |

---

### GET /plans/:id

Get a specific plan by ID.

**Authentication**: Required

**URL Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Plan ID |

**Success Response**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "selections": { /* ... */ },
    "splitType": "upper_lower",
    "workoutDays": [ /* ... */ ],
    "weeklyVolume": [ /* ... */ ],
    "rirProgression": [ /* ... */ ],
    "notes": [],
    "schemaVersion": 1
}
```
**Status**: `200 OK`

**Error Responses**
| Status | Error | Cause |
|--------|-------|-------|
| 404 | Plan not found | No plan with given ID |
| 403 | Unauthorized | Plan belongs to another user |

---

### PATCH /plans/:id

Update an existing plan.

**Authentication**: Required

**URL Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Plan ID |

**Request Body** (all fields optional)
```json
{
    "workoutDays": [
        {
            "name": "Upper A - Updated",
            "dayIndex": 0,
            "exercises": [ /* ... */ ]
        }
    ],
    "notes": [
        {
            "id": "note-uuid",
            "content": "Increased bench press weight",
            "createdAt": "2024-01-16T10:30:00.000Z"
        }
    ]
}
```

**Success Response**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-16T10:30:00.000Z",
    "selections": { /* ... */ },
    "splitType": "upper_lower",
    "workoutDays": [ /* updated */ ],
    "weeklyVolume": [ /* ... */ ],
    "rirProgression": [ /* ... */ ],
    "notes": [ /* updated */ ],
    "schemaVersion": 1
}
```
**Status**: `200 OK`

**Error Responses**
| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid input | Schema validation failed |
| 404 | Plan not found | No plan with given ID |
| 403 | Unauthorized | Plan belongs to another user |

---

### DELETE /plans/:id

Delete a plan.

**Authentication**: Required

**URL Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Plan ID |

**Success Response**

No content returned.
**Status**: `204 No Content`

**Error Responses**
| Status | Error | Cause |
|--------|-------|-------|
| 404 | Plan not found | No plan with given ID |
| 403 | Unauthorized | Plan belongs to another user |

---

## Error Responses

### Error Format

```json
{
    "error": "Human-readable error message",
    "details": { /* Optional: Zod validation errors */ }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, schema validation failed |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Accessing another user's resource |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Validation Error Details

When schema validation fails, `details` contains Zod's formatted errors:

```json
{
    "error": "Invalid input",
    "details": {
        "_errors": [],
        "splitType": {
            "_errors": ["String must contain at least 1 character(s)"]
        },
        "workoutDays": {
            "_errors": ["Array must contain at least 1 element(s)"]
        }
    }
}
```

---

## Request/Response Examples

### Creating a Plan with cURL

```bash
curl -X POST http://localhost:3001/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "selections": {
      "goal": "hypertrophy",
      "experienceLevel": "intermediate",
      "equipment": ["barbell", "dumbbells"],
      "daysPerWeek": 4,
      "sessionDuration": 60
    },
    "splitType": "upper_lower",
    "workoutDays": [{
      "name": "Upper A",
      "dayIndex": 0,
      "exercises": [{
        "exerciseId": "bench-press",
        "name": "Bench Press",
        "sets": [
          {"reps": 8, "weight": 135, "rir": 2}
        ]
      }]
    }]
  }'
```

### Fetching Plans with Fetch API

```typescript
const response = await fetch('http://localhost:3001/plans', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    },
});

if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
}

const plans = await response.json();
```

### Using with TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Query keys factory
export const planKeys = {
    all: ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
};

// Fetch all plans
export function usePlans() {
    const { session } = useAuthStore();

    return useQuery({
        queryKey: planKeys.all,
        queryFn: async () => {
            const response = await fetch(`${API_URL}/plans`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch plans');
            return response.json();
        },
        enabled: !!session,
    });
}

// Create plan mutation
export function useCreatePlan() {
    const queryClient = useQueryClient();
    const { session } = useAuthStore();

    return useMutation({
        mutationFn: async (planData: CreatePlanInput) => {
            const response = await fetch(`${API_URL}/plans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(planData),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: planKeys.all });
        },
    });
}
```

---

## TypeScript Types

### API Types

```typescript
// Plan as returned by API
export interface ApiPlan {
    id: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    selections: ApiSelections;
    splitType: string;
    workoutDays: ApiWorkoutDay[];
    weeklyVolume: ApiWeeklyVolume[];
    rirProgression: ApiRirProgression[];
    notes: ApiPlanNote[];
    schemaVersion: number;
}

export interface ApiSelections {
    goal?: string;
    experienceLevel?: string;
    equipment?: string[];
    daysPerWeek?: number;
    sessionDuration?: number;
    muscleTargets?: Record<string, number>;
}

export interface ApiWorkoutDay {
    name: string;
    dayIndex?: number;
    exercises: ApiWorkoutExercise[];
    notes?: string;
}

export interface ApiWorkoutExercise {
    exerciseId: string;
    name: string;
    sets: ApiExerciseSet[];
    notes?: string;
    muscleGroup?: string;
}

export interface ApiExerciseSet {
    reps: number;
    weight?: number;
    rir?: number;
    completed?: boolean;
}

export interface ApiWeeklyVolume {
    muscleGroup: string;
    sets: number;
    targetSets?: number;
}

export interface ApiRirProgression {
    week: number;
    targetRir: number;
}

export interface ApiPlanNote {
    id?: string;
    content: string;
    createdAt?: string;
}

// Request types
export interface CreatePlanRequest {
    id?: string;
    selections: ApiSelections;
    splitType: string;
    workoutDays: ApiWorkoutDay[];
    weeklyVolume?: ApiWeeklyVolume[];
    rirProgression?: ApiRirProgression[];
    notes?: ApiPlanNote[];
}

export interface UpdatePlanRequest {
    workoutDays?: ApiWorkoutDay[];
    notes?: ApiPlanNote[];
}

// Error response
export interface ApiError {
    error: string;
    details?: Record<string, unknown>;
}
```

---

## API Client Helper

A simple API client wrapper for consistent error handling:

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit & { token?: string } = {}
): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(error.error, response.status, error.details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

// Usage:
// const plans = await apiRequest<ApiPlan[]>('/plans', { token });
// await apiRequest('/plans', { method: 'POST', body: JSON.stringify(data), token });
```

---

*Last Updated: 2026-01-27*
