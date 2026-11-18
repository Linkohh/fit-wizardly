import { afterEach, describe, expect, it } from 'vitest';
import i18n, {
  AVAILABLE_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
  LAUNCH_LANGUAGES,
  changeLanguage,
  getInitialLanguage,
} from '@/lib/i18n';

describe('launch languages (decision D3)', () => {
  it('marks English and Spanish as launch-ready and keeps every locale available', () => {
    expect(LAUNCH_LANGUAGES.map((language) => language.code)).toEqual(['en', 'es']);
    expect(AVAILABLE_LANGUAGES.map((language) => language.code).sort()).toEqual(['de', 'en', 'es', 'pt']);
  });
});

describe('getInitialLanguage', () => {
  it('uses a saved launch language', () => {
    expect(getInitialLanguage('es', 'en-US')).toBe('es');
  });

  it('uses the browser language when nothing is saved', () => {
    expect(getInitialLanguage(null, 'es-MX')).toBe('es');
  });

  it.each(['de', 'pt'])('falls back to English for a saved %s choice', (code) => {
    expect(getInitialLanguage(code, 'en-US')).toBe('en');
  });

  it.each(['de-DE', 'pt-BR'])('falls back to English for a %s browser', (browserLanguage) => {
    expect(getInitialLanguage(null, browserLanguage)).toBe('en');
  });

  it('ignores a saved unsupported code and falls back to English', () => {
    expect(getInitialLanguage('fr', 'fr-FR')).toBe('en');
  });

  it('defaults to English when the browser language is unknown', () => {
    expect(getInitialLanguage(null, undefined)).toBe('en');
  });
});

describe('changeLanguage', () => {
  afterEach(async () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    await i18n.changeLanguage('en');
  });

  it('saves the choice so it survives a reload', async () => {
    await changeLanguage('es');

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(i18n.language).toBe('es');
    expect(getInitialLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY), 'en-US')).toBe('es');
  });
});
