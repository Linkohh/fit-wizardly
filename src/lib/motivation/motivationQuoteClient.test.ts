import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDailyMotivationQuote } from './motivationQuoteClient';

const today = new Date('2026-05-26T12:00:00.000Z');

function createQuoteResponse() {
  return new Response(
    JSON.stringify({
      quote: {
        text: 'Discipline turns consistent effort into lasting strength.',
        author: 'Fit Coach',
        categories: ['success'],
        source: 'api-ninjas',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

describe('motivation quote client', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('returns and caches a valid remote quote for the current day', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(createQuoteResponse());
    vi.stubGlobal('fetch', fetchMock);

    const quote = await fetchDailyMotivationQuote({ now: today, timeoutMs: 1000 });

    expect(quote?.text).toBe('Discipline turns consistent effort into lasting strength.');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/motivation-quote',
      expect.objectContaining({ method: 'GET' })
    );
    expect(window.localStorage.getItem('fitwizard:motivation-quote:v1')).toContain(
      'Discipline turns consistent effort'
    );
  });

  it('uses the current-day cache without calling the network', async () => {
    window.localStorage.setItem(
      'fitwizard:motivation-quote:v1',
      JSON.stringify({
        version: 1,
        date: '2026-05-26',
        quote: {
          text: 'Cached discipline builds daily progress.',
          author: null,
          categories: ['wisdom'],
          source: 'api-ninjas',
        },
      })
    );
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    const quote = await fetchDailyMotivationQuote({ now: today });

    expect(quote?.text).toBe('Cached discipline builds daily progress.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null instead of throwing when the response is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ quote: { text: '' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );

    await expect(fetchDailyMotivationQuote({ now: today })).resolves.toBeNull();
  });

  it('returns null when the request times out', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>((_input, init) => {
      return new Promise((_, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const promise = fetchDailyMotivationQuote({ now: today, timeoutMs: 5 });
    await vi.advanceTimersByTimeAsync(5);

    await expect(promise).resolves.toBeNull();
  });
});
