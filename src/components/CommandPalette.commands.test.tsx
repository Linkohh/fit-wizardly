import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setShowAuthModal: vi.fn(),
  signOut: vi.fn(),
  user: null as { id: string } | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

vi.mock('@/stores/planStore', () => ({
  usePlanStore: () => ({ currentPlan: null }),
}));

vi.mock('@/stores/circleStore', () => ({
  useCircleStore: () => ({ circles: [] }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: mocks.user,
    signOut: mocks.signOut,
    setShowAuthModal: mocks.setShowAuthModal,
  }),
}));

function openPalette() {
  render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
}

describe('CommandPalette commands (DEBT-050)', () => {
  beforeAll(() => {
    // cmdk scrolls the selected item into view; jsdom does not implement it.
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.setShowAuthModal.mockReset();
    mocks.user = null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('has no commands for routes that do not exist', async () => {
    mocks.user = { id: 'user-1' };
    openPalette();

    expect(await screen.findByText('commands.profile')).toBeInTheDocument();
    expect(screen.queryByText('commands.achievements')).not.toBeInTheDocument();
    expect(screen.queryByText('commands.settings')).not.toBeInTheDocument();
  });

  it('opens the auth modal from Sign in instead of navigating to /auth', async () => {
    openPalette();

    fireEvent.click(await screen.findByText('commands.sign_in'));

    expect(mocks.setShowAuthModal).toHaveBeenCalledWith(true);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('opens the in-app guide from Documentation', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openPalette();

    fireEvent.click(await screen.findByText('commands.documentation'));

    expect(mocks.navigate).toHaveBeenCalledWith('/guide');
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
