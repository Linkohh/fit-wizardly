import { fetchApiNinjasExercises } from './apiNinjasExercises';
import type { NormalizedExercise } from './types';

type QueryValue = string | string[] | undefined;

type RequestLike = {
  method?: string;
  query?: Record<string, QueryValue>;
};

type ResponseLike = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => ResponseLike;
  json: (body: { results: NormalizedExercise[] } | { error: string }) => void;
  end: () => void;
};

function getFirstQueryValue(value: QueryValue) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return typeof rawValue === 'string' ? rawValue.trim() : '';
}

function setCorsHeaders(res: ResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

export async function handleApiNinjasExerciseSearchRequest(req: RequestLike, res: ResponseLike) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const name = getFirstQueryValue(req.query?.name);
  if (!name) {
    res.status(400).json({ error: 'Missing name parameter' });
    return;
  }

  const results = await fetchApiNinjasExercises({
    name,
    type: getFirstQueryValue(req.query?.type),
    muscle: getFirstQueryValue(req.query?.muscle),
    difficulty: getFirstQueryValue(req.query?.difficulty),
    equipments: getFirstQueryValue(req.query?.equipments),
  });

  res.status(200).json({ results });
}
