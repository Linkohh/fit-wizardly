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

test('rejects plan body that fails schema validation', async () => {
  let upsertCalled = false;

  const { createPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    upsertPlanForUser: async () => {
      upsertCalled = true;
      throw new Error('should not reach repo');
    },
  });
  const request = createRequest({
    body: { id: 'plan-1', invalid: true }, // missing required fields
    user: { id: 'user-1', email: 'user@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await createPlan(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal((response.body as { error: string }).error, 'Invalid input');
  assert.equal(upsertCalled, false);
});

test('ignores client-provided createdAt and uses server timestamp', async () => {
  let capturedPlan: Record<string, unknown> | undefined;

  const { createPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    upsertPlanForUser: async ({ plan }) => {
      capturedPlan = plan as Record<string, unknown>;
      return {
        ...(plan as object),
        id: 'plan-1',
        userId: 'user-1',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
  });

  const clientBackdatedTime = '2000-01-01T00:00:00.000Z';
  const beforeCreate = Date.now();
  const request = createRequest({
    body: createValidPlanPayload({ createdAt: clientBackdatedTime }),
    user: { id: 'user-1', email: 'user@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await createPlan(request, response);
  const afterCreate = Date.now();

  assert.equal(response.statusCode, 201);
  assert.ok(capturedPlan, 'upsert should have been called');
  assert.notEqual(capturedPlan!.createdAt, clientBackdatedTime);
  const serverTimestamp = new Date(capturedPlan!.createdAt as string).getTime();
  assert.ok(
    serverTimestamp >= beforeCreate && serverTimestamp <= afterCreate,
    'createdAt should be a current server timestamp'
  );
});

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '99999999-9999-4999-8999-999999999999';
const OWNER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('rejects GET /plans/:id for a plan owned by a different user', async () => {
  const { getPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    getPlanForUser: async () => ({
      ...createValidPlanPayload(),
      userId: OTHER_USER_ID,
      createdAt: '2026-03-18T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    }),
  });
  const request = createRequest({
    params: { id: VALID_UUID },
    user: { id: OWNER_USER_ID, email: 'owner@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await getPlan(request, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'Forbidden' });
});

test('returns 200 for GET /plans/:id when plan belongs to the authenticated user', async () => {
  const planData = {
    ...createValidPlanPayload(),
    userId: OWNER_USER_ID,
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
  };
  const { getPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    getPlanForUser: async () => planData,
  });
  const request = createRequest({
    params: { id: VALID_UUID },
    user: { id: OWNER_USER_ID, email: 'owner@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await getPlan(request, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, planData);
});

test('rejects DELETE /plans/:id for a plan owned by a different user', async () => {
  let deleteCalled = false;

  const { deletePlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    getPlanForUser: async () => ({
      ...createValidPlanPayload(),
      userId: OTHER_USER_ID,
      createdAt: '2026-03-18T00:00:00.000Z',
      updatedAt: '2026-03-18T00:00:00.000Z',
    }),
    deletePlanForUser: async () => {
      deleteCalled = true;
      return true;
    },
  });
  const request = createRequest({
    params: { id: VALID_UUID },
    user: { id: OWNER_USER_ID, email: 'owner@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await deletePlan(request, response);

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, { error: 'Forbidden' });
  assert.equal(deleteCalled, false);
});

test('rejects GET /plans/:id with a malformed (non-UUID) plan ID', async () => {
  let repoCalled = false;

  const { getPlan } = createRouteHandlers(appConfig, {
    logger: quietLogger,
    getPlanForUser: async () => {
      repoCalled = true;
      return null;
    },
  });
  const request = createRequest({
    params: { id: 'not-a-uuid' },
    user: { id: OWNER_USER_ID, email: 'owner@example.com' },
    authToken: 'valid-token',
  });
  const response = createResponse();

  await getPlan(request, response);

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'Invalid plan ID format' });
  assert.equal(repoCalled, false);
});
