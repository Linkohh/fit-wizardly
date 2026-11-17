import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApiGuard } from './_lib/guard';

/** Must match the dev proxy in vite.config.ts (wgerProxyPlugin). */
const ALLOWED_HOSTS = new Set(['wger.de', 'www.wger.de']);

const guard = createApiGuard();

function parseTargetUrl(value: unknown): URL | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw === '') return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;

  const rawUrl = req.query.url;
  if (!rawUrl || (typeof rawUrl === 'string' && rawUrl === '')) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  const target = parseTargetUrl(rawUrl);
  if (!target) {
    res.status(400).json({ error: 'Invalid url parameter' });
    return;
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    res.status(403).json({ error: 'Forbidden: Host not allowed' });
    return;
  }

  try {
    // redirect: 'error': the allowlist only checks the first hostname, so
    // following a 3xx would let the upstream point this fetch somewhere else.
    const response = await fetch(target.toString(), {
      redirect: 'error',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: `Wger API returned HTTP ${response.status}` });
      return;
    }

    const data: unknown = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('[proxy-wger] upstream request failed:', err);
    res.status(502).json({ error: 'Upstream request failed' });
  }
}
