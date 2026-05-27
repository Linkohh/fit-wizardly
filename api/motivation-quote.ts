import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleMotivationQuoteRequest } from '../src/lib/motivation/motivationQuoteEndpoint';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await handleMotivationQuoteRequest(req, res);
}
