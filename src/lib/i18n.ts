import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import pt from '@/locales/pt.json';
import de from '@/locales/de.json';

const resources = {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
    de: { translation: de },
};

export const LANGUAGE_STORAGE_KEY = 'fitwizard-language';

/**
 * Every language with a locale file. `launchReady` marks the ones translated well
 * enough to offer at launch (decision D3: English and Spanish). The others stay
 * loaded so their keys keep counting in the parity test, but nobody is put on them.
 */
export const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸', launchReady: true },
    { code: 'es', name: 'Español', flag: '🇪🇸', launchReady: true },
    { code: 'pt', name: 'Português', flag: '🇧🇷', launchReady: false },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', launchReady: false },
] as const;

export type LanguageCode = (typeof AVAILABLE_LANGUAGES)[number]['code'];

/** The languages the Profile picker offers. */
export const LAUNCH_LANGUAGES = AVAILABLE_LANGUAGES.filter((language) => language.launchReady);

export function isLaunchLanguage(code: string | null | undefined): code is LanguageCode {
    return LAUNCH_LANGUAGES.some((language) => language.code === code);
}

/**
 * Picks the starting language: the saved choice, then the browser language, then English.
 * A supported but not launch-ready language (de, pt) falls back to English, so nobody
 * sees a half-translated UI.
 */
export function getInitialLanguage(
    storedLanguage: string | null = readStoredLanguage(),
    browserLanguage: string | undefined = typeof navigator === 'undefined' ? undefined : navigator.language,
): LanguageCode {
    if (isLaunchLanguage(storedLanguage)) {
        return storedLanguage;
    }

    const browserCode = browserLanguage?.split('-')[0];
    if (isLaunchLanguage(browserCode)) {
        return browserCode;
    }

    return 'en';
}

function readStoredLanguage(): string | null {
    try {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
        return null;
    }
}

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already handles XSS
        },
        react: {
            useSuspense: false,
        },
    });

/**
 * Keeps `<html lang>` in step with the UI language so screen readers pronounce
 * text correctly and the browser offers the right spell-check and translation.
 */
export function syncDocumentLanguage(lang: string | undefined = i18n.language) {
    if (typeof document === 'undefined' || !lang) {
        return;
    }
    document.documentElement.lang = lang;
}

syncDocumentLanguage();
i18n.on('languageChanged', syncDocumentLanguage);

export default i18n;

// Helper to get current language
export function getCurrentLanguage() {
    return i18n.language;
}

// Helper to change language. Saves the choice so it survives a reload.
export function changeLanguage(lang: string) {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
        // Storage can be unavailable (private mode); the change still applies for this session.
    }
    return i18n.changeLanguage(lang);
}
