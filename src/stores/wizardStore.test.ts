import { beforeEach, describe, expect, it } from 'vitest';
import { useWizardStore } from '@/stores/wizardStore';

describe('wizardStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWizardStore.getState().resetWizard();
  });

  it('advances through the premium coach step order', () => {
    const visitedSteps = [useWizardStore.getState().currentStep];

    for (let index = 0; index < 5; index += 1) {
      useWizardStore.getState().nextStep();
      visitedSteps.push(useWizardStore.getState().currentStep);
    }

    expect(visitedSteps).toEqual([
      'goal',
      'constraints',
      'equipment',
      'anatomy',
      'schedule',
      'review',
    ]);
  });

  it('maps the reordered constraints step to index 1', () => {
    useWizardStore.getState().setStep('constraints');

    expect(useWizardStore.getState().currentStepIndex).toBe(1);
  });
});
