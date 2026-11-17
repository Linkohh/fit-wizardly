import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiUrl } from './apiBase';
import { isNativeApp } from '@/lib/platform';

vi.mock('@/lib/platform', () => ({
  isNativeApp: vi.fn(() => false),
}));

describe('apiUrl (contract #6)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(isNativeApp).mockReturnValue(false);
  });

  it('returns the path unchanged on the web, even when an origin is set', () => {
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://fitwizard.app');

    expect(apiUrl('/api/motivation-quote')).toBe('/api/motivation-quote');
    expect(apiUrl('/api/proxy-wger?url=x')).toBe('/api/proxy-wger?url=x');
  });

  it('prefixes VITE_PUBLIC_APP_ORIGIN on native', () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://fitwizard.app');

    expect(apiUrl('/api/motivation-quote')).toBe('https://fitwizard.app/api/motivation-quote');
  });

  it('drops trailing slashes from the origin', () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', 'https://beta.fitwizard.app//');

    expect(apiUrl('/api/exercise-search-ninjas?name=press')).toBe(
      'https://beta.fitwizard.app/api/exercise-search-ninjas?name=press'
    );
  });

  it('falls back to the bare path on native when the origin is missing', () => {
    vi.mocked(isNativeApp).mockReturnValue(true);
    vi.stubEnv('VITE_PUBLIC_APP_ORIGIN', '');

    expect(apiUrl('/api/motivation-quote')).toBe('/api/motivation-quote');
  });
});
