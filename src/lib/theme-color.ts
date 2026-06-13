/**
 * Keeps the browser/PWA chrome (iOS status bar, Safari tab tint, Android chrome)
 * in lockstep with the app's class-based dark mode.
 *
 * The app toggles a `.dark` class on <html>, which can diverge from the OS
 * color scheme. A media-keyed <meta name="theme-color"> pair (the previous
 * approach) follows the OS, not the app, so a dark app on a light-mode device
 * rendered a white status bar. We instead drive a single theme-color meta from
 * the effective app theme.
 *
 * Chrome colors equal the real page background so the status bar / safe-area
 * region blends seamlessly under `apple-mobile-web-app-status-bar-style:
 * black-translucent` and Safari's "Liquid Glass" chrome tinting (iOS 26+).
 */

/** hsl(270 50% 8%) — matches the dark `--background` token in index.css. */
export const DARK_CHROME_COLOR = "#140A1F";
/** hsl(260 30% 98%) — matches the light `--background` token in index.css. */
export const LIGHT_CHROME_COLOR = "#F9F8FB";

export function syncThemeColor(isDark: boolean): void {
  if (typeof document === "undefined") {
    return;
  }

  // Remove any legacy media-keyed theme-color metas (also clears a stale
  // cached index.html that still carries the prefers-color-scheme pair).
  document
    .querySelectorAll('meta[name="theme-color"][media]')
    .forEach((el) => el.remove());

  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])'
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = isDark ? DARK_CHROME_COLOR : LIGHT_CHROME_COLOR;
}
