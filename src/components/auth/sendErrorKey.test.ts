import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendErrorKey } from './sendErrorKey';

function authError(fields: { code?: string; status?: number; name?: string }) {
  const error = new Error('Supabase message');
  if (fields.name) error.name = fields.name;
  return Object.assign(error, { code: fields.code, status: fields.status });
}

describe('sendErrorKey', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps rate limits by code or by HTTP 429', () => {
    expect(sendErrorKey(authError({ code: 'over_email_send_rate_limit' }))).toBe('auth.send_error_rate_limit');
    expect(sendErrorKey(authError({ status: 429 }))).toBe('auth.send_error_rate_limit');
  });

  it('maps an address Supabase will not send to', () => {
    expect(sendErrorKey(authError({ code: 'email_address_invalid', status: 400 }))).toBe(
      'auth.send_error_invalid_email'
    );
  });

  it('maps network failures and being offline', () => {
    expect(sendErrorKey(authError({ name: 'AuthRetryableFetchError', status: 0 }))).toBe(
      'auth.send_error_offline'
    );
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(sendErrorKey(new Error('Failed to fetch'))).toBe('auth.send_error_offline');
  });

  it('falls back to a generic message', () => {
    expect(sendErrorKey(new Error('Unexpected'))).toBe('auth.send_error_generic');
    expect(sendErrorKey(authError({ code: 'unexpected_failure', status: 500 }))).toBe('auth.send_error_generic');
  });
});
