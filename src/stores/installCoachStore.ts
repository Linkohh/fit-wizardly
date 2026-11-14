import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InstallCoachPlatform } from '@/lib/install-coach';
import { INSTALL_COACH_STORAGE_KEY } from '@/lib/install-coach';

type InstallCoachRuntimeState = {
  platform: InstallCoachPlatform;
  isStandalone: boolean;
  canNativeInstall: boolean;
  isOpen: boolean;
  hasHydrated: boolean;
};

type InstallCoachPersistedState = {
  hasSeenCoach: boolean;
  dismissed: boolean;
  installed: boolean;
  /** Browser sessions in which the app was opened. Used to time the auto-prompt. */
  visitCount: number;
};

type InstallCoachState = InstallCoachRuntimeState &
  InstallCoachPersistedState & {
    closeCoach: () => void;
    dismissCoach: () => void;
    markInstalled: () => void;
    openCoach: () => void;
    recordVisit: () => void;
    setHydrated: (value: boolean) => void;
    setRuntimeState: (runtime: Partial<InstallCoachRuntimeState>) => void;
  };

const initialRuntimeState: InstallCoachRuntimeState = {
  platform: 'unsupported',
  isStandalone: false,
  canNativeInstall: false,
  isOpen: false,
  hasHydrated: false,
};

const initialPersistedState: InstallCoachPersistedState = {
  hasSeenCoach: false,
  dismissed: false,
  installed: false,
  visitCount: 0,
};

function sanitizePersistedState(value: unknown): InstallCoachPersistedState {
  const saved = (typeof value === 'object' && value !== null ? value : {}) as Partial<
    Record<keyof InstallCoachPersistedState, unknown>
  >;
  const visitCount = saved.visitCount;

  return {
    hasSeenCoach: saved.hasSeenCoach === true,
    dismissed: saved.dismissed === true,
    installed: saved.installed === true,
    visitCount:
      typeof visitCount === 'number' && Number.isFinite(visitCount) && visitCount > 0
        ? Math.floor(visitCount)
        : 0,
  };
}

export const useInstallCoachStore = create<InstallCoachState>()(
  persist(
    (set) => ({
      ...initialRuntimeState,
      ...initialPersistedState,
      setHydrated: (value) => set({ hasHydrated: value }),
      setRuntimeState: (runtime) => set(runtime),
      openCoach: () => set({ isOpen: true, hasSeenCoach: true }),
      recordVisit: () => set((state) => ({ visitCount: state.visitCount + 1 })),
      closeCoach: () => set({ isOpen: false }),
      dismissCoach: () => set({ isOpen: false, hasSeenCoach: true, dismissed: true }),
      markInstalled: () =>
        set({ isOpen: false, hasSeenCoach: true, dismissed: false, installed: true }),
    }),
    {
      name: INSTALL_COACH_STORAGE_KEY,
      partialize: ({ hasSeenCoach, dismissed, installed, visitCount }) => ({
        hasSeenCoach,
        dismissed,
        installed,
        visitCount,
      }),
      // Saved state from before visitCount existed, or with a damaged value, loads as 0.
      merge: (persistedState, currentState) => {
        const saved = sanitizePersistedState(persistedState);
        return { ...currentState, ...saved };
      },
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
