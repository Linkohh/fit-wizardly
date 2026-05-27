import type { NormalizedExercise } from './types';

const API_NINJAS_EXERCISES_URL = 'https://api.api-ninjas.com/v1/exercises';
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RESULTS = 5;

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type ApiNinjasExerciseSearchParams = {
  name: string;
  type?: string;
  muscle?: string;
  difficulty?: string;
  equipments?: string;
};

type ApiNinjasExerciseRecord = {
  name?: unknown;
  type?: unknown;
  muscle?: unknown;
  difficulty?: unknown;
  equipments?: unknown;
  instructions?: unknown;
  safety_info?: unknown;
};

type FetchApiNinjasExercisesOptions = ApiNinjasExerciseSearchParams & {
  apiKey?: string;
  fetcher?: Fetcher;
  timeoutMs?: number;
};

function getServerApiNinjasKey() {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return runtime.process?.env?.API_NINJAS_API_KEY;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(normalizeString).filter(Boolean);
  }

  const normalized = normalizeString(value);
  return normalized ? [normalized] : [];
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeExerciseName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function normalizeDifficulty(value: unknown): NormalizedExercise['difficulty'] | undefined {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === 'beginner' || normalized === 'intermediate') {
    return normalized;
  }

  if (normalized === 'advanced' || normalized === 'expert') {
    return 'advanced';
  }

  return undefined;
}

function buildDescription(instructions: string, safetyInfo: string) {
  if (instructions && safetyInfo) return `${instructions} Safety: ${safetyInfo}`;
  return instructions || safetyInfo || undefined;
}

export function normalizeApiNinjasExercises(payload: unknown): NormalizedExercise[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  const seenNames = new Set<string>();
  const results: NormalizedExercise[] = [];

  for (const record of payload) {
    if (typeof record !== 'object' || record === null) {
      continue;
    }

    const exercise = record as ApiNinjasExerciseRecord;
    const name = normalizeString(exercise.name);
    if (!name) {
      continue;
    }

    const dedupeKey = normalizeExerciseName(name);
    if (seenNames.has(dedupeKey)) {
      continue;
    }
    seenNames.add(dedupeKey);

    const muscle = normalizeString(exercise.muscle);
    const type = normalizeString(exercise.type);
    const instructions = normalizeString(exercise.instructions);
    const safetyInfo = normalizeString(exercise.safety_info);
    const description = buildDescription(instructions, safetyInfo);

    results.push({
      id: `api-ninjas:${slugify(name)}`,
      name,
      targetMuscles: muscle ? [muscle] : [],
      equipment: normalizeStringArray(exercise.equipments),
      difficulty: normalizeDifficulty(exercise.difficulty),
      description,
      safetyInfo: safetyInfo || undefined,
      source: 'api-ninjas',
    });

    if (results.length >= MAX_RESULTS) {
      break;
    }
  }

  return results;
}

function appendParam(params: URLSearchParams, key: string, value: string | undefined) {
  const normalized = value?.trim();
  if (normalized) {
    params.set(key, normalized);
  }
}

function buildApiNinjasExercisesUrl(options: ApiNinjasExerciseSearchParams) {
  const params = new URLSearchParams();
  appendParam(params, 'name', options.name);
  appendParam(params, 'type', options.type);
  appendParam(params, 'muscle', options.muscle);
  appendParam(params, 'difficulty', options.difficulty);
  appendParam(params, 'equipments', options.equipments);
  return `${API_NINJAS_EXERCISES_URL}?${params.toString()}`;
}

export async function fetchApiNinjasExercises({
  apiKey = getServerApiNinjasKey(),
  fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  ...params
}: FetchApiNinjasExercisesOptions): Promise<NormalizedExercise[]> {
  if (!apiKey || !params.name.trim()) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(buildApiNinjasExercisesUrl(params), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    return normalizeApiNinjasExercises(await response.json());
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
