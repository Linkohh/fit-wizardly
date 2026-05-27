import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchApiNinjasMotivationQuote: vi.fn(),
}));

vi.mock('./apiNinjasMotivation', () => ({
  fetchApiNinjasMotivationQuote: mocks.fetchApiNinjasMotivationQuote,
}));

async function loadHandler() {
  return import('./motivationQuoteEndpoint');
}

function createResponse() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
  };
}

describe('motivation quote endpoint handler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns no quote for missing keys or upstream failures', async () => {
    mocks.fetchApiNinjasMotivationQuote.mockResolvedValue(null);
    const { handleMotivationQuoteRequest } = await loadHandler();
    const res = createResponse();

    await handleMotivationQuoteRequest({ method: 'GET' }, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(res.headers['Access-Control-Allow-Credentials']).toBeUndefined();
    expect(res.body).toEqual({ quote: null });
  });

  it('returns an accepted quote', async () => {
    mocks.fetchApiNinjasMotivationQuote.mockResolvedValue({
      text: 'Consistent effort builds strength.',
      author: 'Coach Example',
      categories: ['wisdom'],
      source: 'api-ninjas',
    });
    const { handleMotivationQuoteRequest } = await loadHandler();
    const res = createResponse();

    await handleMotivationQuoteRequest({ method: 'GET' }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      quote: {
        text: 'Consistent effort builds strength.',
        author: 'Coach Example',
        categories: ['wisdom'],
        source: 'api-ninjas',
      },
    });
  });

  it('handles OPTIONS without calling the upstream API', async () => {
    const { handleMotivationQuoteRequest } = await loadHandler();
    const res = createResponse();

    await handleMotivationQuoteRequest({ method: 'OPTIONS' }, res);

    expect(res.statusCode).toBe(204);
    expect(mocks.fetchApiNinjasMotivationQuote).not.toHaveBeenCalled();
  });
});
