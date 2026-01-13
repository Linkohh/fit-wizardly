import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Onboarding steps in order
export type OnboardingStep = 'welcome' | 'role' | 'goals' | 'import' | 'complete';

// User role determines feature access and UI branching
export type UserRole = 'user' | 'coach';

// Fitness emoji avatars for personalization
export const AVATAR_OPTIONS = [
    '💪', '🏋️', '🧘', '🏃', '⚡', '🔥',
    '🎯', '🏆', '💎', '🌟', '🦾', '🥇',
] as const;

export type AvatarEmoji = typeof AVATAR_OPTIONS[number];

// Pre-interest goals to personalize wizard experience
export type InterestGoal = 'strength' | 'muscle' | 'weight_loss' | 'endurance' | 'flexibility';

export interface OnboardingUserData {
    displayName: string;
    avatarEmoji: AvatarEmoji;
    role: UserRole;
    interestedGoals: InterestGoal[];
}

interface OnboardingState {
    // Status
    isComplete: boolean;
    hasStarted: boolean;
    currentStep: OnboardingStep;

    // User data collected during onboarding
    userData: OnboardingUserData;

    // Actions
    startOnboarding: () => void;
    setStep: (step: OnboardingStep) => void;
    nextStep: () => void;
    prevStep: () => void;
    setDisplayName: (name: string) => void;
    setAvatarEmoji: (emoji: AvatarEmoji) => void;
    setRole: (role: UserRole) => void;
    toggleGoal: (goal: InterestGoal) => void;
    completeOnboarding: () => void;
    resetOnboarding: () => void;

    // Computed helpers
    canProceed: () => boolean;
    getStepIndex: () => number;
    getTotalSteps: () => number;
}

// Step order - coach has extra step
const USER_STEPS: OnboardingStep[] = ['welcome', 'role', 'goals', 'complete'];
const COACH_STEPS: OnboardingStep[] = ['welcome', 'role', 'goals', 'import', 'complete'];

const getStepsForRole = (role: UserRole): OnboardingStep[] => {
    return role === 'coach' ? COACH_STEPS : USER_STEPS;
};

const initialUserData: OnboardingUserData = {
    displayName: '',
    avatarEmoji: '💪',
    role: 'user',
    interestedGoals: [],
};

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set, get) => ({
            isComplete: false,
            hasStarted: false,
            currentStep: 'welcome',
            userData: initialUserData,

            startOnboarding: () => set({ hasStarted: true }),

            setStep: (step) => set({ currentStep: step }),

            nextStep: () => {
                const { currentStep, userData } = get();
                const steps = getStepsForRole(userData.role);
                const currentIndex = steps.indexOf(currentStep);

                if (currentIndex < steps.length - 1) {
                    set({ currentStep: steps[currentIndex + 1] });
                }
            },

            prevStep: () => {
                const { currentStep, userData } = get();
                const steps = getStepsForRole(userData.role);
                const currentIndex = steps.indexOf(currentStep);

                if (currentIndex > 0) {
                    set({ currentStep: steps[currentIndex - 1] });
                }
            },

            setDisplayName: (displayName) => set((state) => ({
                userData: { ...state.userData, displayName }
            })),

            setAvatarEmoji: (avatarEmoji) => set((state) => ({
                userData: { ...state.userData, avatarEmoji }
            })),

            setRole: (role) => set((state) => ({
                userData: { ...state.userData, role }
            })),

            toggleGoal: (goal) => set((state) => {
                const current = state.userData.interestedGoals;
                const updated = current.includes(goal)
                    ? current.filter(g => g !== goal)
                    : [...current, goal];
                return {
                    userData: { ...state.userData, interestedGoals: updated }
                };
            }),

            completeOnboarding: () => set({
                isComplete: true,
                currentStep: 'complete',
            }),

            resetOnboarding: () => set({
                isComplete: false,
                hasStarted: false,
                currentStep: 'welcome',
                userData: initialUserData,
            }),

            canProceed: () => {
                const { currentStep, userData } = get();

                switch (currentStep) {
                    case 'welcome':
                        return userData.displayName.trim().length >= 2;
                    case 'role':
                        return true; // Role is always selected (default: user)
                    case 'goals':
                        return true; // Goals are optional
                    case 'import':
                        return true; // Coach import is optional
                    default:
                        return true;
                }
            },

            getStepIndex: () => {
                const { currentStep, userData } = get();
                const steps = getStepsForRole(userData.role);
                return steps.indexOf(currentStep);
            },

            getTotalSteps: () => {
                const { userData } = get();
                const steps = getStepsForRole(userData.role);
                // Don't count 'complete' as a step
                return steps.length - 1;
            },
        }),
        {
            name: 'fitwizard-onboarding',
            partialize: (state) => ({
                isComplete: state.isComplete,
                hasStarted: state.hasStarted,
                userData: state.userData,
                // Don't persist currentStep - always restart from welcome if incomplete
            }),
        }
    )
);

// Selector hooks for common patterns
export const useIsOnboardingComplete = () => useOnboardingStore((state) => state.isComplete);
export const useOnboardingUser = () => useOnboardingStore((state) => state.userData);
