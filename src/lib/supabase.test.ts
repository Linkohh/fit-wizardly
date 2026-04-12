import { describe, expect, it } from 'vitest';
import { validateRemoteEndpoint } from './supabase';

describe('validateRemoteEndpoint', () => {
  it('allows HTTPS remote endpoints', () => {
    expect(validateRemoteEndpoint('https://example.supabase.co', 'VITE_SUPABASE_URL')).toBe(
      'https://example.supabase.co'
    );
  });

  it('allows localhost HTTP endpoints for local development', () => {
    expect(validateRemoteEndpoint('http://localhost:54321', 'VITE_SUPABASE_URL')).toBe(
      'http://localhost:54321'
    );
  });

  it('rejects non-HTTPS remote endpoints outside localhost', () => {
    expect(() => validateRemoteEndpoint('http://evil.example.com', 'VITE_SUPABASE_URL')).toThrow(
      /must use HTTPS outside localhost/
    );
  });

  it('allows relative API endpoints when explicitly permitted', () => {
    expect(
      validateRemoteEndpoint('/api', 'VITE_API_URL', {
        allowRelative: true,
      })
    ).toBe('/api');
  });
});
