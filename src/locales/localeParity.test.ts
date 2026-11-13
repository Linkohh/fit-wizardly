import { describe, expect, it } from 'vitest';
import en from './en.json';
import de from './de.json';
import es from './es.json';
import pt from './pt.json';
import knownGaps from '@/test/fixtures/localeGaps.json';

/**
 * Locale parity ratchet.
 *
 * Untranslated keys fall back to English (i18n fallbackLng is 'en'), so gaps are
 * not crashes, but they should only ever shrink. `localeGaps.json` is the
 * snapshot of keys known to be untranslated:
 *  - adding an English key without translating it fails the first assertion;
 *  - translating a listed key without removing it from the snapshot fails the second,
 *    so the list stays honest.
 *
 * To update after translating: remove the keys from src/test/fixtures/localeGaps.json.
 */

type Tree = { [key: string]: string | Tree | unknown };

function flatten(tree: Tree, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
    for (const [key, value] of Object.entries(tree)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value as Tree, path, out);
        } else {
            out[path] = value;
        }
    }
    return out;
}

const englishKeys = Object.keys(flatten(en as Tree));
const locales: Record<'de' | 'es' | 'pt', Tree> = { de, es, pt };

describe.each(Object.keys(locales) as Array<'de' | 'es' | 'pt'>)('%s locale parity', (code) => {
    const present = new Set(Object.keys(flatten(locales[code])));
    const missing = englishKeys.filter((key) => !present.has(key));
    const allowed = new Set(knownGaps[code]);

    it('adds no new untranslated keys beyond the known gaps', () => {
        const newGaps = missing.filter((key) => !allowed.has(key));
        expect(newGaps).toEqual([]);
    });

    it('lists only keys that are still untranslated in localeGaps.json', () => {
        const stale = [...allowed].filter((key) => present.has(key));
        expect(stale).toEqual([]);
    });
});
