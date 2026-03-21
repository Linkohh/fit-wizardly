import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';

type Selector<TState, TResult> = ((state: TState) => TResult) | undefined;

function selectState<TState, TResult>(state: TState, selector?: Selector<TState, TResult>) {
  return selector ? selector(state) : state;
}

const mocks = vi.hoisted(() => ({
  completeOnboarding: vi.fn(),
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  setAvatarEmoji: vi.fn(),
  setDisplayName: vi.fn(),
  fireConfetti: vi.fn(),
}));

const onboardingState = {
  currentStep: 'welcome' as const,
  nextStep: mocks.nextStep,
  prevStep: mocks.prevStep,
  canProceed: () => false,
  getStepIndex: () => 0,
  getTotalSteps: () => 3,
  completeOnboarding: mocks.completeOnboarding,
  isComplete: false,
  userData: {
    displayName: '',
    avatarEmoji: '💪' as const,
    role: 'user' as const,
    interestedGoals: [],
  },
  setDisplayName: mocks.setDisplayName,
  setAvatarEmoji: mocks.setAvatarEmoji,
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'onboarding.skip': 'Skip for now',
        'onboarding.back': 'Back',
        'onboarding.next': 'Next',
        'onboarding.lets_go': "Let's go",
        'onboarding.complete': 'Complete',
      };

      return fallback ?? translations[key] ?? key;
    },
  }),
}));

vi.mock('@/stores/onboardingStore', () => ({
  AVATAR_OPTIONS: ['💪', '🏋️', '🧘'],
  useOnboardingStore: <T,>(selector?: Selector<typeof onboardingState, T>) =>
    selectState(onboardingState, selector),
}));

vi.mock('@/hooks/useConfetti', () => ({
  useConfetti: () => ({
    fire: mocks.fireConfetti,
  }),
}));

describe('OnboardingFlow layout', () => {
  it('renders progress and skip controls in a normal-flow top row below the shared header', () => {
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <OnboardingFlow />
      </MemoryRouter>,
    );

    const topRow = screen.getByTestId('onboarding-top-row');
    expect(within(topRow).getByText('1/3')).toBeInTheDocument();
    expect(within(topRow).getByRole('button', { name: 'Skip for now' })).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: /let's personalize your experience/i });
    expect(topRow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });
});
