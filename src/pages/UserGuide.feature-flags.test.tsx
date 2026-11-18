import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UserGuide from './UserGuide';

vi.mock('@/components/navigation/BackButton', () => ({
  BackButton: () => null,
}));

function renderGuide() {
  render(
    <MemoryRouter>
      <UserGuide />
    </MemoryRouter>,
  );
}

describe('UserGuide feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the Circles tab and its link when circles is off', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');

    renderGuide();

    expect(screen.getByText('Tracking Your Progress')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /social circles/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /go to circles/i })).not.toBeInTheDocument();
  });

  it('shows the Circles tab when circles is on', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');

    renderGuide();

    expect(screen.getByRole('tab', { name: /workouts & logging/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /social circles/i })).toBeInTheDocument();
  });
});
