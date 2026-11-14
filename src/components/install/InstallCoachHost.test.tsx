import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';
import { usePlanStore } from '@/stores/planStore';
import { useInstallCoachStore } from '@/stores/installCoachStore';
import { InstallCoachHost, INSTALL_COACH_VISIT_SESSION_KEY } from './InstallCoachHost';
import type { Plan } from '@/types/fitness';

vi.mock('./InstallCoachSheet', () => ({
  InstallCoachSheet: ({ enableAutoPrompt }: { enableAutoPrompt?: boolean }) => (
    <div data-testid="sheet" data-auto={String(enableAutoPrompt)} />
  ),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <InstallCoachHost />
    </MemoryRouter>,
  );
}

const autoPrompt = () => screen.getByTestId('sheet').getAttribute('data-auto');

describe('InstallCoachHost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
    useInstallCoachStore.setState({ visitCount: 0 });
    usePlanStore.setState({ currentPlan: null });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('does not auto-prompt on the first visit to the home page', () => {
    renderAt('/');
    act(() => vi.advanceTimersByTime(1000));

    expect(useInstallCoachStore.getState().visitCount).toBe(1);
    expect(autoPrompt()).toBe('false');
  });

  it('auto-prompts on the home page on the second visit', () => {
    useInstallCoachStore.setState({ visitCount: 1 });

    renderAt('/');
    act(() => vi.advanceTimersByTime(1000));

    expect(useInstallCoachStore.getState().visitCount).toBe(2);
    expect(autoPrompt()).toBe('true');
  });

  it('counts a browser session only once, however often it mounts', () => {
    const first = renderAt('/');
    first.unmount();
    renderAt('/');

    expect(useInstallCoachStore.getState().visitCount).toBe(1);
    expect(window.sessionStorage.getItem(INSTALL_COACH_VISIT_SESSION_KEY)).not.toBeNull();
  });

  it('auto-prompts on the plan page once a plan exists', () => {
    usePlanStore.setState({ currentPlan: { id: 'plan-1' } as Plan });

    renderAt('/plan');
    act(() => vi.advanceTimersByTime(1000));

    expect(autoPrompt()).toBe('true');
  });

  it('stays quiet on other pages', () => {
    useInstallCoachStore.setState({ visitCount: 5 });
    usePlanStore.setState({ currentPlan: { id: 'plan-1' } as Plan });

    renderAt('/nutrition');
    act(() => vi.advanceTimersByTime(1000));

    expect(autoPrompt()).toBe('false');
  });
});
