import { fetchApiNinjasMotivationQuote } from './apiNinjasMotivation';
import type { MotivationQuoteApiResponse } from './motivationQuoteTypes';

type RequestLike = {
  method?: string;
};

type ResponseLike = {
  setHeader: (key: string, value: string) => void;
  status: (code: number) => ResponseLike;
  json: (body: MotivationQuoteApiResponse | { error: string }) => void;
  end: () => void;
};

function setCorsHeaders(res: ResponseLike) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

export async function handleMotivationQuoteRequest(req: RequestLike, res: ResponseLike) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const quote = await fetchApiNinjasMotivationQuote();
  res.status(200).json({ quote });
}
