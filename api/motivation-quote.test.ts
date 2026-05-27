import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './motivation-quote';

const mocks = vi.hoisted(() => ({
  handleMotivationQuoteRequest: vi.fn(),
}));

vi.mock('../src/lib/motivation/motivationQuoteEndpoint', () => ({
  handleMotivationQuoteRequest: mocks.handleMotivationQuoteRequest,
}));

describe('/api/motivation-quote Vercel function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to the shared motivation quote endpoint handler', async () => {
    const req = { method: 'GET' };
    const res = {};

    await handler(req as never, res as never);

    expect(mocks.handleMotivationQuoteRequest).toHaveBeenCalledWith(req, res);
  });
});
