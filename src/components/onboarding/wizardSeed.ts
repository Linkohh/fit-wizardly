import type { InterestGoal } from '@/stores/onboardingStore';
import { useWizardStore } from '@/stores/wizardStore';
import type { Goal } from '@/types/fitness';
import {
  FIRST_PLAN_DAYS_PER_WEEK,
  FIRST_PLAN_SESSION_MINUTES,
} from '@/components/wizard/steps/firstPlanDefaults';

const INTEREST_TO_WIZARD_GOAL: Record<InterestGoal, Goal> = {
  strength: 'strength',
  muscle: 'hypertrophy',
  weight_loss: 'general',
  endurance: 'general',
  flexibility: 'general',
};

/**
 * The wizard goal that the onboarding interests answer, or `null` when they don't
 * answer it: nothing picked, or picks that point at different wizard goals
 * (for example strength and muscle). Then the wizard asks the question itself.
 */
export function wizardGoalFromInterests(interests: readonly InterestGoal[]): Goal | null {
  const goals = new Set(interests.map((interest) => INTEREST_TO_WIZARD_GOAL[interest]));
  if (goals.size !== 1) return null;
  const [goal] = goals;
  return goal ?? null;
}

/**
 * Carries the onboarding answers into a wizard that hasn't been started yet, so a
 * first-time lifter isn't asked the same question twice:
 * - the goal is pre-filled, and the wizard opens on the step after it (Back still reaches it);
 * - the schedule starts at 3 days × 45 minutes.
 *
 * A wizard that is already past its first step is left alone. Returns whether the
 * goal step was skipped.
 */
export function seedWizardFromOnboarding(interests: readonly InterestGoal[]): boolean {
  const wizard = useWizardStore.getState();
  if (wizard.currentStepIndex !== 0) return false;

  wizard.setDaysPerWeek(FIRST_PLAN_DAYS_PER_WEEK);
  wizard.setSessionDuration(FIRST_PLAN_SESSION_MINUTES);

  const goal = wizardGoalFromInterests(interests);
  if (!goal) return false;

  wizard.setGoal(goal);
  wizard.nextStep();
  return true;
}
