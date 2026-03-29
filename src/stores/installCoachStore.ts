import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { InstallCoachPlatform, InstallCoachView } from '@/lib/install-coach';
import { INSTALL_COACH_STORAGE_KEY } from '@/lib/install-coach';

type InstallCoachRuntimeState = {
  platform: InstallCoachPlatform;
  isStandalone: boolean;
  canNativeInstall: boolean;
  canShareShortcut: boolean;
  isOpen: boolean;
  hasHydrated: boolean;
  view: InstallCoachView;
};

type InstallCoachPersistedState = {
  hasSeenCoach: boolean;
  dismissed: boolean;
  installed: boolean;
};

type InstallCoachState = InstallCoachRuntimeState &
  InstallCoachPersistedState & {
    closeCoach: () => void;
    dismissCoach: () => void;
    markInstalled: () => void;
    openCoach: () => void;
    showChooser: () => void;
    showNudge: () => void;
    setHydrated: (value: boolean) => void;
    setRuntimeState: (runtime: Partial<InstallCoachRuntimeState>) => void;
  };

const initialRuntimeState: InstallCoachRuntimeState = {
  platform: 'unsupported',
  isStandalone: false,
  canNativeInstall: false,
  canShareShortcut: false,
  isOpen: false,
  hasHydrated: false,
  view: 'chooser',
};

const initialPersistedState: InstallCoachPersistedState = {
  hasSeenCoach: false,
  dismissed: false,
  installed: false,
};

export const useInstallCoachStore = create<InstallCoachState>()(
  persist(
    (set) => ({
      ...initialRuntimeState,
      ...initialPersistedState,
      setHydrated: (value) => set({ hasHydrated: value }),
      setRuntimeState: (runtime) => set(runtime),
      openCoach: () => set({ isOpen: true, hasSeenCoach: true, view: 'chooser' }),
      closeCoach: () => set({ isOpen: false, view: 'chooser' }),
      dismissCoach: () => set({ isOpen: false, hasSeenCoach: true, dismissed: true, view: 'chooser' }),
      markInstalled: () =>
        set({ isOpen: false, hasSeenCoach: true, dismissed: false, installed: true, view: 'chooser' }),
      showChooser: () => set({ isOpen: true, view: 'chooser' }),
      showNudge: () => set({ isOpen: true, view: 'nudge' }),
    }),
    {
      name: INSTALL_COACH_STORAGE_KEY,
      partialize: ({ hasSeenCoach, dismissed, installed }) => ({
        hasSeenCoach,
        dismissed,
        installed,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
