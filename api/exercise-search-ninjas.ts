import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleApiNinjasExerciseSearchRequest } from '../src/lib/services/api/apiNinjasExerciseEndpoint';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleApiNinjasExerciseSearchRequest(req, res);
}
