import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'fitwizard-theme';
const LEGACY_THEME_STORAGE_KEY = 'theme-storage';

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  syncSystemTheme: (matchesDark: boolean) => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system';

const resolveTheme = (mode: ThemeMode): 'light' | 'dark' =>
  mode === 'system' ? getSystemTheme() : mode;

const migrateLegacyThemeStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const nextStorage = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (nextStorage) {
    return;
  }

  const legacyStorage = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (!legacyStorage) {
    return;
  }

  try {
    const legacyMode = JSON.parse(legacyStorage)?.state?.mode;
    if (!isThemeMode(legacyMode)) {
      return;
    }

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({
        state: { mode: legacyMode },
        version: 0,
      }),
    );
  } catch {
    // Ignore malformed legacy storage and let the app fall back to system mode.
  }
};

migrateLegacyThemeStorage();

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      resolvedTheme: resolveTheme('system'),
      setMode: (mode) => set({ mode, resolvedTheme: resolveTheme(mode) }),
      syncSystemTheme: (matchesDark) =>
        set((state) => {
          if (state.mode !== 'system') {
            return state;
          }

          return { resolvedTheme: matchesDark ? 'dark' : 'light' };
        }),
      getEffectiveTheme: () => get().resolvedTheme,
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (state) => ({ mode: state.mode }),
      merge: (persistedState, currentState) => {
        const persistedMode = (persistedState as Partial<ThemeState> | undefined)?.mode;
        const mode = isThemeMode(persistedMode) ? persistedMode : currentState.mode;

        return {
          ...currentState,
          mode,
          resolvedTheme: resolveTheme(mode),
        };
      },
    }
  )
);
