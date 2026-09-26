import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAndroidBackButton } from './useAndroidBackButton';

const mocks = vi.hoisted(() => ({
  platform: 'android' as 'android' | 'ios' | 'web',
  backHandler: null as null | (() => void),
  minimizeApp: vi.fn(async () => undefined),
  addListener: vi.fn(),
}));

vi.mock('@/lib/platform', () => ({
  getNativePlatform: () => mocks.platform,
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: mocks.addListener,
    minimizeApp: mocks.minimizeApp,
  },
}));

function Harness() {
  useAndroidBackButton();
  return <div data-testid="path">{useLocation().pathname}</div>;
}

function renderAt(entries: string[]) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Harness />
    </MemoryRouter>
  );
}

async function pressBack() {
  await waitFor(() => expect(mocks.backHandler).not.toBeNull());
  act(() => mocks.backHandler?.());
}

describe('useAndroidBackButton', () => {
  beforeEach(() => {
    mocks.platform = 'android';
    mocks.backHandler = null;
    mocks.minimizeApp.mockClear();
    mocks.addListener.mockReset();
    mocks.addListener.mockImplementation(async (_event: string, handler: () => void) => {
      mocks.backHandler = handler;
      return { remove: vi.fn(async () => undefined) };
    });
  });

  it('steps back through in-app history', async () => {
    renderAt(['/profile', '/legal']);
    await pressBack();
    expect(screen.getByTestId('path')).toHaveTextContent('/profile');
  });

  it('goes home from the first in-app page instead of closing the app', async () => {
    renderAt(['/legal']);
    await pressBack();
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('minimizes the app from Home', async () => {
    renderAt(['/']);
    await pressBack();
    expect(mocks.minimizeApp).toHaveBeenCalledTimes(1);
  });

  it('does nothing outside Android', async () => {
    mocks.platform = 'ios';
    renderAt(['/profile', '/legal']);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.addListener).not.toHaveBeenCalled();
  });
});
