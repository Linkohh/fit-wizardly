import { beforeEach, describe, expect, it } from 'vitest';
import { useWizardStore } from '@/stores/wizardStore';
import { seedWizardFromOnboarding, wizardGoalFromInterests } from './wizardSeed';

describe('wizardGoalFromInterests', () => {
  it('maps a single answer to the wizard goal', () => {
    expect(wizardGoalFromInterests(['strength'])).toBe('strength');
    expect(wizardGoalFromInterests(['muscle'])).toBe('hypertrophy');
    expect(wizardGoalFromInterests(['weight_loss'])).toBe('general');
  });

  it('treats picks that point at the same wizard goal as one answer', () => {
    expect(wizardGoalFromInterests(['endurance', 'flexibility', 'weight_loss'])).toBe('general');
  });

  it('returns null when nothing is picked or the picks disagree', () => {
    expect(wizardGoalFromInterests([])).toBeNull();
    expect(wizardGoalFromInterests(['strength', 'muscle'])).toBeNull();
  });
});

describe('seedWizardFromOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
  });

  it('pre-fills the goal, skips the goal step and sets a 3 x 45 schedule', () => {
    expect(seedWizardFromOnboarding(['strength'])).toBe(true);

    const state = useWizardStore.getState();
    expect(state.selections.goal).toBe('strength');
    expect(state.currentStep).toBe('constraints');
    expect(state.selections.daysPerWeek).toBe(3);
    expect(state.selections.sessionDuration).toBe(45);
  });

  it('keeps the goal step and its answer reachable with Back', () => {
    seedWizardFromOnboarding(['muscle']);
    useWizardStore.getState().prevStep();

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe('goal');
    expect(state.selections.goal).toBe('hypertrophy');
  });

  it('asks the goal question when the onboarding picks do not answer it', () => {
    expect(seedWizardFromOnboarding(['strength', 'muscle'])).toBe(false);

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe('goal');
    expect(state.selections.sessionDuration).toBe(45);
  });

  it('leaves a wizard that is already under way alone', () => {
    useWizardStore.getState().setStep('equipment');
    useWizardStore.getState().setSessionDuration(75);

    expect(seedWizardFromOnboarding(['strength'])).toBe(false);

    const state = useWizardStore.getState();
    expect(state.currentStep).toBe('equipment');
    expect(state.selections.goal).toBe('hypertrophy');
    expect(state.selections.sessionDuration).toBe(75);
  });
});
