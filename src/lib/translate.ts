import i18next from 'i18next';

type TranslateOptions = Record<string, string | number>;

function interpolate(text: string, options?: TranslateOptions): string {
  if (!options) return text;
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) =>
    name in options ? String(options[name]) : match,
  );
}

/**
 * Translate outside React (stores, plain functions). Uses the app's i18next
 * instance when it has been initialised (src/lib/i18n.ts does that at start-up)
 * and the English fallback otherwise, so modules that call it don't have to
 * import the i18n setup (which would couple them to react-i18next).
 */
export function translate(key: string, fallback: string, options?: TranslateOptions): string {
  if (i18next.isInitialized) {
    return i18next.t(key, { defaultValue: fallback, ...options });
  }
  return interpolate(fallback, options);
}
