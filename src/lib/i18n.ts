import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const resources = {
    en: { translation: en },
    es: { translation: es },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
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
export function changeLanguage(lang: 'en' | 'es') {
    return i18n.changeLanguage(lang);
}

// Available languages
export const AVAILABLE_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
] as const;
