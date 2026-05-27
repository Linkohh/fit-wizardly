import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchApiNinjasMotivationQuote } from './apiNinjasMotivation';

function createApiNinjasResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('API Ninjas motivation quote server helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns no quote when API_NINJAS_API_KEY is missing', async () => {
    vi.stubEnv('VITE_API_NINJAS_API_KEY', 'client-secret-must-not-be-used');
    const fetchMock = vi.fn<typeof fetch>();

    const quote = await fetchApiNinjasMotivationQuote({ fetcher: fetchMock });

    expect(quote).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns no quote when the upstream API fails', async () => {
    vi.stubEnv('API_NINJAS_API_KEY', 'server-key');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: 'rate limited' }), { status: 429 })
    );

    await expect(fetchApiNinjasMotivationQuote({ fetcher: fetchMock })).resolves.toBeNull();
  });

  it('returns no quote for invalid upstream payloads', async () => {
    vi.stubEnv('API_NINJAS_API_KEY', 'server-key');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createApiNinjasResponse({}));

    await expect(fetchApiNinjasMotivationQuote({ fetcher: fetchMock })).resolves.toBeNull();
  });

  it('returns no quote for rejected unrelated quotes', async () => {
    vi.stubEnv('API_NINJAS_API_KEY', 'server-key');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createApiNinjasResponse([
        {
          quote: 'The price of tomatoes changes with the season.',
          author: 'Market Almanac',
          categories: ['wisdom'],
        },
      ])
    );

    await expect(fetchApiNinjasMotivationQuote({ fetcher: fetchMock })).resolves.toBeNull();
  });

  it('returns an accepted quote and sends the server API key to API Ninjas', async () => {
    vi.stubEnv('API_NINJAS_API_KEY', 'server-key');
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createApiNinjasResponse([
        {
          quote: 'Consistent effort and discipline build lasting strength.',
          author: 'Coach Example',
          categories: ['success'],
        },
      ])
    );

    const quote = await fetchApiNinjasMotivationQuote({
      fetcher: fetchMock,
      now: new Date('2026-05-26T12:00:00.000Z'),
    });

    expect(quote).toEqual({
      text: 'Consistent effort and discipline build lasting strength.',
      author: 'Coach Example',
      categories: ['success'],
      source: 'api-ninjas',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /^https:\/\/api\.api-ninjas\.com\/v2\/randomquotes\?categories=(inspirational|success|courage|leadership|wisdom)$/
      ),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Api-Key': 'server-key' }),
      })
    );
  });
});
