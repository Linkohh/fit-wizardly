import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import i18n from '@/lib/i18n';

// Every `workout.*` key the logger and rest timer ask for, read from the source,
// so a key added later without a translation is caught too.
const sources = ['WorkoutLogger.tsx', 'RestTimer.tsx'].map((file) =>
  readFileSync(resolve(__dirname, file), 'utf-8'),
);
const keys = [
  ...new Set(sources.flatMap((source) => [...source.matchAll(/t\('(workout\.[a-z_]+)'/g)].map((match) => match[1]))),
];

describe('workout logger strings', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('finds the keys it checks', () => {
    expect(keys).toEqual(expect.arrayContaining(['workout.cancel', 'workout.notes', 'workout.notes_placeholder']));
  });

  it.each(['en', 'es', 'de', 'pt'])('resolves every workout.* key in %s instead of showing the raw key', async (language) => {
    await i18n.changeLanguage(language);
    const unresolved = keys.filter((key) => !i18n.exists(key, { lng: language, fallbackLng: false }));
    expect(unresolved).toEqual([]);
  });
});
