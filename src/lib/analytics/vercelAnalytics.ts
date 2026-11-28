import type { BeforeSend } from '@vercel/analytics/react';
import { scrubUrl } from '@/lib/analytics/track';

/**
 * `beforeSend` for `<VercelAnalytics />`: the same URL masking PostHog's `before_send` uses.
 * The query string and hash are dropped, ids become `:id` and invite codes become `:code`,
 * so Vercel only ever receives route patterns such as `https://host/circles/join/:code`.
 */
export const maskVercelAnalyticsEvent: BeforeSend = (event) => ({
  ...event,
  url: scrubUrl(event.url),
});
