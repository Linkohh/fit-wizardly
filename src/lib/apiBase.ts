import { devLog } from '@/lib/devLog';
import { isNativeApp } from '@/lib/platform';

/**
 * Builds the URL for one of the app's own serverless functions (contract #6).
 *
 * On the web the path is returned unchanged, so it resolves against the page's
 * origin. In the native app the page origin is `capacitor://localhost` (iOS) or
 * `https://localhost` (Android), where `/api/*` does not exist, so the path is
 * prefixed with VITE_PUBLIC_APP_ORIGIN, the deployed web origin.
 */
export function apiUrl(path: `/api/${string}`): string {
  if (!isNativeApp()) return path;

  const origin: unknown = import.meta.env.VITE_PUBLIC_APP_ORIGIN;
  if (typeof origin !== 'string' || origin.trim() === '') {
    devLog('[apiBase] VITE_PUBLIC_APP_ORIGIN missing on native');
    return path;
  }

  return `${origin.trim().replace(/\/+$/, '')}${path}`;
}
