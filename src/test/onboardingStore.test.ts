import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingStore } from '@/stores/onboardingStore';

describe('onboardingStore', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useOnboardingStore.getState().resetOnboarding();
    });

    describe('initial state', () => {
        it('starts with isComplete = false', () => {
            const { isComplete } = useOnboardingStore.getState();
            expect(isComplete).toBe(false);
        });

        it('starts with hasStarted = false', () => {
            const { hasStarted } = useOnboardingStore.getState();
            expect(hasStarted).toBe(false);
        });

        it('starts at welcome step', () => {
            const { currentStep } = useOnboardingStore.getState();
            expect(currentStep).toBe('welcome');
        });

        it('has default user data', () => {
            const { userData } = useOnboardingStore.getState();
            expect(userData.displayName).toBe('');
            expect(userData.role).toBe('user');
            expect(userData.avatarEmoji).toBe('💪');
            expect(userData.interestedGoals).toEqual([]);
        });
    });

    describe('step navigation', () => {
        it('advances to next step', () => {
            const store = useOnboardingStore.getState();
            store.nextStep();
            expect(useOnboardingStore.getState().currentStep).toBe('role');
        });

        it('goes back to previous step', () => {
            const store = useOnboardingStore.getState();
            store.setStep('goals');
            store.prevStep();
            expect(useOnboardingStore.getState().currentStep).toBe('role');
        });

        it('does not go before first step', () => {
            const store = useOnboardingStore.getState();
            store.prevStep();
            expect(useOnboardingStore.getState().currentStep).toBe('welcome');
        });
    });

    describe('user data updates', () => {
        it('sets display name', () => {
            const store = useOnboardingStore.getState();
            store.setDisplayName('John');
            expect(useOnboardingStore.getState().userData.displayName).toBe('John');
        });

        it('sets avatar emoji', () => {
            const store = useOnboardingStore.getState();
            store.setAvatarEmoji('🏆');
            expect(useOnboardingStore.getState().userData.avatarEmoji).toBe('🏆');
        });

        it('sets role to coach', () => {
            const store = useOnboardingStore.getState();
            store.setRole('coach');
            expect(useOnboardingStore.getState().userData.role).toBe('coach');
        });

        it('toggles goal on and off', () => {
            const store = useOnboardingStore.getState();

            // Toggle on
            store.toggleGoal('strength');
            expect(useOnboardingStore.getState().userData.interestedGoals).toContain('strength');

            // Toggle off
            store.toggleGoal('strength');
            expect(useOnboardingStore.getState().userData.interestedGoals).not.toContain('strength');
        });
    });

    describe('role-based step flow', () => {
        it('user has 4 steps (3 steps + complete)', () => {
            const store = useOnboardingStore.getState();
            store.setRole('user');
            expect(store.getTotalSteps()).toBe(3);
        });

        it('coach has 5 steps (4 steps + complete)', () => {
            const store = useOnboardingStore.getState();
            store.setRole('coach');
            expect(useOnboardingStore.getState().getTotalSteps()).toBe(4);
        });
    });

    describe('validation', () => {
        it('cannot proceed from welcome without name', () => {
            const { canProceed } = useOnboardingStore.getState();
            expect(canProceed()).toBe(false);
        });

        it('can proceed from welcome with name >= 2 chars', () => {
            const store = useOnboardingStore.getState();
            store.setDisplayName('Jo');
            expect(store.canProceed()).toBe(true);
        });
    });

    describe('completion', () => {
        it('marks onboarding as complete', () => {
            const store = useOnboardingStore.getState();
            store.completeOnboarding();

            const { isComplete, currentStep } = useOnboardingStore.getState();
            expect(isComplete).toBe(true);
            expect(currentStep).toBe('complete');
        });

        it('reset clears completion state', () => {
            const store = useOnboardingStore.getState();
            store.completeOnboarding();
            store.resetOnboarding();

            const { isComplete, hasStarted } = useOnboardingStore.getState();
            expect(isComplete).toBe(false);
            expect(hasStarted).toBe(false);
        });
    });
});
