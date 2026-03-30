import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow';
import { useOnboardingStore } from '@/stores/onboardingStore';

const mocks = vi.hoisted(() => ({
  fireConfetti: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    circle: ({
      animate: _animate,
      custom: _custom,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      children,
      ...props
    }: React.SVGProps<SVGCircleElement> & Record<string, unknown>) => <circle {...props}>{children}</circle>,
    div: ({
      animate: _animate,
      custom: _custom,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => <div {...props}>{children}</div>,
    span: ({
      animate: _animate,
      custom: _custom,
      exit: _exit,
      initial: _initial,
      transition: _transition,
      variants: _variants,
      children,
      ...props
    }: React.HTMLAttributes<HTMLSpanElement> & Record<string, unknown>) => <span {...props}>{children}</span>,
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'onboarding.back': 'Back',
        'onboarding.complete': 'Complete',
        'onboarding.lets_go': "Let's go",
        'onboarding.next': 'Next',
        'onboarding.skip': 'Skip for now',
      };

      return translations[key] ?? fallback ?? key;
    },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/hooks/useConfetti', () => ({
  useConfetti: () => ({
    fire: mocks.fireConfetti,
  }),
}));

vi.mock('./steps/WelcomeStep', () => ({
  WelcomeStep: () => <h1>Let&apos;s personalize your experience</h1>,
}));

vi.mock('./steps/RoleStep', () => ({
  RoleStep: () => <h1>Choose your role</h1>,
}));

vi.mock('./steps/GoalsPreviewStep', () => ({
  GoalsPreviewStep: () => <h1>Pick your goals</h1>,
}));

vi.mock('./steps/CoachImportStep', () => ({
  CoachImportStep: () => <h1>Import your clients</h1>,
}));

function resetOnboardingState() {
  useOnboardingStore.setState({
    isComplete: false,
    hasStarted: false,
    currentStep: 'welcome',
    userData: {
      avatarEmoji: '💪',
      displayName: '',
      interestedGoals: [],
      role: 'user',
    },
  });
}

async function hydrateOnboardingStore() {
  if (useOnboardingStore.persist.hasHydrated()) {
    return;
  }

  await act(async () => {
    await useOnboardingStore.persist.rehydrate();
  });
}

async function renderOnboardingFlow() {
  await hydrateOnboardingStore();

  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <OnboardingFlow />
    </MemoryRouter>,
  );
}

describe('OnboardingFlow', () => {
  beforeEach(async () => {
    localStorage.clear();
    mocks.fireConfetti.mockReset();
    mocks.navigate.mockReset();
    await act(async () => {
      resetOnboardingState();
    });
  });

  afterEach(async () => {
    await act(async () => {
      resetOnboardingState();
    });
  });

  it('renders progress and skip controls in a normal-flow top row below the shared header', async () => {
    await renderOnboardingFlow();

    const topRow = screen.getByTestId('onboarding-top-row');
    expect(within(topRow).getByText('1/3')).toBeInTheDocument();
    expect(within(topRow).getByRole('button', { name: 'Skip for now' })).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: /let's personalize your experience/i });
    expect(topRow.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('completes onboarding and navigates home immediately when skipping', async () => {
    await renderOnboardingFlow();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    });

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(useOnboardingStore.getState().isComplete).toBe(true);
    expect(mocks.fireConfetti).not.toHaveBeenCalled();
    expect(screen.queryByTestId('onboarding-top-row')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('completes the user flow from goals without rendering a 4/3 state', async () => {
    act(() => {
      useOnboardingStore.setState({
        currentStep: 'goals',
        userData: {
          avatarEmoji: '💪',
          displayName: 'Alex',
          interestedGoals: [],
          role: 'user',
        },
      });
    });

    await renderOnboardingFlow();

    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.queryByText('4/3')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: "Let's go" }));
    });

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(useOnboardingStore.getState().isComplete).toBe(true);
    expect(mocks.fireConfetti).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('4/3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('onboarding-top-row')).not.toBeInTheDocument();
  });

  it('completes the coach flow from import and navigates home immediately', async () => {
    act(() => {
      useOnboardingStore.setState({
        currentStep: 'import',
        userData: {
          avatarEmoji: '💪',
          displayName: 'Coach Lin',
          interestedGoals: [],
          role: 'coach',
        },
      });
    });

    await renderOnboardingFlow();

    expect(screen.getByText('4/4')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Complete' }));
    });

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(useOnboardingStore.getState().isComplete).toBe(true);
    expect(mocks.fireConfetti).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('onboarding-top-row')).not.toBeInTheDocument();
  });

  it('short-circuits the onboarding shell when already complete', async () => {
    act(() => {
      useOnboardingStore.setState({
        isComplete: true,
        currentStep: 'goals',
        userData: {
          avatarEmoji: '💪',
          displayName: 'Alex',
          interestedGoals: [],
          role: 'user',
        },
      });
    });

    await renderOnboardingFlow();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(screen.queryByTestId('onboarding-top-row')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument();
  });
});
