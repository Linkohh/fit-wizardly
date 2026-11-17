import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/stores/planStore', () => ({
  usePlanStore: () => ({ currentPlan: null }),
}));

vi.mock('@/stores/circleStore', () => ({
  useCircleStore: () => ({
    circles: [{ id: 'circle-1', name: 'Morning Lifters', member_count: 4 }],
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: null, signOut: vi.fn() }),
}));

function openPalette() {
  render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
}

describe('CommandPalette feature flags', () => {
  beforeAll(() => {
    // cmdk scrolls the selected item into view; jsdom does not implement it.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the Circles command and the circles group when circles is off', async () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');

    openPalette();

    expect(await screen.findByText('commands.home')).toBeInTheDocument();
    expect(screen.queryByText('commands.circles')).not.toBeInTheDocument();
    expect(screen.queryByText('commands.circles_heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Morning Lifters')).not.toBeInTheDocument();
  });

  it('shows the Circles command and the circles group when circles is on', async () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');

    openPalette();

    expect(await screen.findByText('commands.circles')).toBeInTheDocument();
    expect(screen.getByText('commands.circles_heading')).toBeInTheDocument();
    expect(screen.getByText('Morning Lifters')).toBeInTheDocument();
  });
});
