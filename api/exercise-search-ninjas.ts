import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiNinjasExerciseSearchRequest } from '../src/lib/services/api/apiNinjasExerciseEndpoint';
import { createApiGuard, withGuardedCors } from './_lib/guard';

const guard = createApiGuard();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  await handleApiNinjasExerciseSearchRequest(req, withGuardedCors(res));
}
