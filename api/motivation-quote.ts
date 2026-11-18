import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMotivationQuoteRequest } from '../src/lib/motivation/motivationQuoteEndpoint';
import { createApiGuard, withGuardedCors } from './_lib/guard';

const guard = createApiGuard();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  await handleMotivationQuoteRequest(req, withGuardedCors(res));
}
