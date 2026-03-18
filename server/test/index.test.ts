import test from 'node:test';
import assert from 'node:assert/strict';
import type { NextFunction, Request, Response } from 'express';
import { createRouteHandlers } from '../src/index.ts';

const appConfig = {
  supabaseUrl: 'https://example.supabase.co',
  supabaseAnonKey: 'anon-key',
  allowedOrigins: ['http://localhost:3000'],
};

const quietLogger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

function createValidPlanPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'plan-1',
    selections: {
      goal: 'strength',
      experienceLevel: 'intermediate',
      equipment: ['dumbbells'],
      targetMuscles: ['chest'],
      constraints: [],
      daysPerWeek: 3,
      sessionDuration: 60,
    },
    splitType: 'upper-lower',
    workoutDays: [
      {
        dayIndex: 0,
        name: 'Day 1',
        focusTags: ['chest'],
        exercises: [
          {
            exercise: {
              id: 'exercise-1',
              name: 'Bench Press',
            },
            sets: 3,
            reps: '8-10',
            rir: 2,
            restSeconds: 120,
          },
        ],
        estimatedDuration: 60,
      },
    ],
    weeklyVolume: [],
    rirProgression: [],
    notes: [],
    schemaVersion: 1,
    ...overrides,
  };
}

function createRequest(overrides: Partial<Request> = {}) {
  return {
    headers: {},
    params: {},
    query: {},
    body: undefined,
    ...overrides,
  } as Request & {
    user?: {
      id: string;
      email?: string;
    };
    authToken?: string;
  };
}

function createResponse() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    send(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response as Response & {
    statusCode: number;
    body: unknown;
  };
}

test('rejects requests without a bearer token', async () => {
  const { requireAuth } = createRouteHandlers(appConfig, { logger: quietLogger });
  const request = createRequest();
  const response = createResponse();
  let nextCalled = false;

  await requireAuth(request, response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: 'Missing or invalid Authorization header' });
  assert.equal(nextCalled, false);
});

test('rejects invalid bearer tokens', async () => {
  const { requireAuth } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    verifyAuthToken: async () => null,
  });
  const request = createRequest({
    headers: {
      authorization: 'Bearer invalid-token',
    },
  });
  const response = createResponse();

  await requireAuth(request, response, (() => {}) as NextFunction);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.body, { error: 'Invalid or expired token' });
});

test('rejects cross-user plan writes before touching the repo layer', async () => {
  let upsertCalled = false;

  const { createPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    upsertPlanForUser: async () => {
      upsertCalled = true;
      throw new Error('should not reach repo');
    },
  });
  const request = createRequest({
    body: createValidPlanPayload({ userId: '22222222-2222-4222-8222-222222222222' }),
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'user@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await createPlan(request, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'Cannot create plan for another user' });
  assert.equal(upsertCalled, false);
});

test('accepts valid plan writes', async () => {
  const { createPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    upsertPlanForUser: async ({ planId, userId, schemaVersion, plan }) => ({
      ...(plan as object),
      id: planId,
      userId,
      schemaVersion,
      createdAt: '2026-03-18T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    }),
  });
  const request = createRequest({
    body: createValidPlanPayload(),
    user: { id: 'user-1', email: 'user@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await createPlan(request, response);

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.body, {
    ...createValidPlanPayload(),
    userId: 'user-1',
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
  });
});
