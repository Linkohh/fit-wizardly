import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncStatus } from '@/lib/sync/types';

const mocks = vi.hoisted(() => ({
  status: 'synced' as SyncStatus,
  configured: true,
  retrySync: vi.fn(async () => ({ pulled: 0, pushed: 0, failed: 0 })),
  setShowAuthModal: vi.fn(),
  prepareSignOut: vi.fn(),
  completeSignOut: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string, options?: { count?: number }) =>
      options?.count === undefined ? fallback : fallback.replace('{{count}}', String(options.count)),
  }),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: () => mocks.configured }));
vi.mock('@/lib/sync/status', () => ({ useSyncStatus: () => mocks.status }));
vi.mock('@/lib/sync/triggers', () => ({ retrySync: mocks.retrySync }));
vi.mock('@/lib/sync/signOut', () => ({ prepareSignOut: mocks.prepareSignOut, completeSignOut: mocks.completeSignOut }));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: <T,>(selector: (state: { user: { id: string } | null; setShowAuthModal: () => void }) => T) =>
    selector({ user: mocks.status === 'signed-out' ? null : { id: 'user-1' }, setShowAuthModal: mocks.setShowAuthModal }),
}));

import { SyncStatusRow } from './SyncStatusRow';

describe('SyncStatusRow', () => {
  beforeEach(() => {
    mocks.configured = true;
    mocks.retrySync.mockClear();
    mocks.setShowAuthModal.mockClear();
  });

  it.each([
    ['synced', 'Synced'],
    ['saving', 'Saving…'],
    ['offline', "Offline. Changes will sync when you're back online."],
    ['error', 'Sync problem. Your data is still saved on this device.'],
    ['signed-out', 'Sign in to back up your training.'],
  ] as const)('shows %s', (status, text) => {
    mocks.status = status;
    render(<SyncStatusRow />);
    expect(screen.getByRole('status')).toHaveTextContent(text);
  });

  it('offers Retry on a sync problem, which syncs now', async () => {
    mocks.status = 'error';
    render(<SyncStatusRow />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await vi.waitFor(() => expect(mocks.retrySync).toHaveBeenCalledWith('user-1'));
  });

  it('offers sign-in to guests', () => {
    mocks.status = 'signed-out';
    render(<SyncStatusRow />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(mocks.setShowAuthModal).toHaveBeenCalledWith(true);
  });

  it('shows nothing in demo mode (no Supabase)', () => {
    mocks.configured = false;
    const { container } = render(<SyncStatusRow />);
    expect(container).toBeEmptyDOMElement();
  });

  it('signs out straight away when everything is backed up', async () => {
    mocks.status = 'synced';
    mocks.prepareSignOut.mockResolvedValue({ pending: 0 });
    mocks.completeSignOut.mockResolvedValue(undefined);
    render(<SyncStatusRow />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await vi.waitFor(() => expect(mocks.completeSignOut).toHaveBeenCalledTimes(1));
    expect(mocks.prepareSignOut).toHaveBeenCalledWith('user-1');
  });

  it('warns before signing out when changes are not backed up, and can stay signed in', async () => {
    mocks.status = 'offline';
    mocks.prepareSignOut.mockResolvedValue({ pending: 3 });
    mocks.completeSignOut.mockReset().mockResolvedValue(undefined);
    render(<SyncStatusRow />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText(/3 changes haven't been saved/)).toBeInTheDocument();
    expect(mocks.completeSignOut).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
    await vi.waitFor(() => expect(screen.queryByText(/3 changes haven't been saved/)).not.toBeInTheDocument());
    expect(mocks.completeSignOut).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out anyway' }));
    await vi.waitFor(() => expect(mocks.completeSignOut).toHaveBeenCalledTimes(1));
  });
});
