import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiNinjasExerciseAdapter, WgerAdapter } from './exerciseApiAdapter';
import { isNativeApp } from '@/lib/platform';

vi.mock('@/lib/platform', () => ({
  isNativeApp: vi.fn(() => false),
}));

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('exercise API adapters use apiUrl()', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.mocked(isNativeApp).mockReturnValue(false);
  });

  it('WgerAdapter goes through /api/proxy-wger on the web, not straight to wger (DEBT-055)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await new WgerAdapter().search('bench press');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `/api/proxy-wger?url=${encodeURIComponent('https://wger.de/api/v2/exerciseinfo/?search=bench%20press')}`
    );
  });

  it('WgerAdapter goes through the deployed proxy on native', async () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://fitwizard.app');
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await new WgerAdapter().search('row');

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/fitwizard\.app\/api\/proxy-wger\?url=/);
  });

  it('ApiNinjasExerciseAdapter prefixes the deployed origin on native', async () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://fitwizard.app');
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await new ApiNinjasExerciseAdapter().search('press');

    expect(fetchMock.mock.calls[0][0]).toBe('https://fitwizard.app/api/exercise-search-ninjas?name=press');
  });
});
