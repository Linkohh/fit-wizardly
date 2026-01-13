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

// Supported language codes
const SUPPORTED_LANGS = ['en', 'es', 'pt', 'de'];

// Get initial language from localStorage or browser
function getInitialLanguage(): string {
    // Check localStorage first
    const stored = localStorage.getItem('fitwizard-language');
    if (stored && SUPPORTED_LANGS.includes(stored)) {
        return stored;
    }

    // Browser language detection
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGS.includes(browserLang)) {
        return browserLang;
    }

    return 'en'; // Default fallback
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

export default i18n;

// Helper to get current language
export function getCurrentLanguage() {
    return i18n.language;
}

// Helper to change language
export function changeLanguage(lang: string) {
    localStorage.setItem('fitwizard-language', lang);
    return i18n.changeLanguage(lang);
}

// Available languages with flags
export const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;
