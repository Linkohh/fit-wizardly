import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { OnboardingGuard } from './OnboardingGuard';
import { CONSENT_STORAGE_KEY } from '@/lib/consent';
import { useOnboardingStore } from '@/stores/onboardingStore';

function renderGuardedRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        <Route path="/legal" element={<div>Legal Page</div>} />
        <Route
          path="*"
          element={
            <OnboardingGuard>
              <div>Protected App</div>
            </OnboardingGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OnboardingGuard consent gate', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({ isComplete: true });
  });

  it('blocks protected app routes when onboarding is complete but baseline consent is missing', async () => {
    renderGuardedRoute('/analytics');

    expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected App')).not.toBeInTheDocument();
  });

  it('allows protected app routes only after onboarding and baseline consent are both stored', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());

    renderGuardedRoute('/analytics');

    expect(screen.getByText('Protected App')).toBeInTheDocument();
  });

  it('keeps legal pages readable before consent', () => {
    renderGuardedRoute('/legal');

    expect(screen.getByText('Legal Page')).toBeInTheDocument();
  });

  it('does not treat arbitrary legal-prefixed paths as consent-gate exceptions', async () => {
    renderGuardedRoute('/legal-anything');

    expect(await screen.findByText('Onboarding Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected App')).not.toBeInTheDocument();
  });
});
