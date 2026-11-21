import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
    user: null as { id: string } | null,
    configured: true,
    deleteAccount: vi.fn(),
    clearLocalUserData: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string, options?: Record<string, string>) =>
            (fallback ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name: string) => options?.[name] ?? ''),
    }),
}));

vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: () => mocks.configured }));
vi.mock('@/lib/account/deleteAccount', () => ({ deleteAccount: mocks.deleteAccount }));
vi.mock('@/lib/storage/clearLocalUserData', () => ({ clearLocalUserData: mocks.clearLocalUserData }));
vi.mock('@/stores/authStore', () => ({
    useAuthStore: (selector: (state: { user: { id: string } | null }) => unknown) => selector({ user: mocks.user }),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess, error: mocks.toastError } }));

import { AccountDeletionSection } from './AccountDeletionSection';

const onExportData = vi.fn();

function renderSection() {
    return render(
        <MemoryRouter initialEntries={['/profile']}>
            <Routes>
                <Route path="/profile" element={<AccountDeletionSection onExportData={onExportData} />} />
                <Route path="/" element={<p>Home page</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

function confirmInput() {
    return screen.getByLabelText('Type DELETE to confirm');
}

beforeEach(() => {
    mocks.user = { id: 'user-a' };
    mocks.configured = true;
    mocks.deleteAccount.mockResolvedValue({ error: null });
    mocks.clearLocalUserData.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('AccountDeletionSection, signed in', () => {
    it('keeps the confirm button disabled until DELETE is typed exactly', () => {
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toHaveTextContent("This can't be undone.");
        const confirm = screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!;
        expect(confirm).toBeDisabled();

        fireEvent.change(confirmInput(), { target: { value: 'delete' } });
        expect(confirm).toBeDisabled();
        fireEvent.change(confirmInput(), { target: { value: 'DELET' } });
        expect(confirm).toBeDisabled();
        fireEvent.change(confirmInput(), { target: { value: 'DELETE' } });
        expect(confirm).toBeEnabled();
    });

    it('deletes the account, shows a success toast and goes home', async () => {
        let resolve: (value: { error: null }) => void = () => undefined;
        mocks.deleteAccount.mockReturnValue(new Promise((done) => { resolve = done; }));
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
        fireEvent.change(confirmInput(), { target: { value: 'DELETE' } });
        fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);

        // Loading state while the request runs.
        expect(await screen.findByRole('button', { name: 'Deleting…' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

        resolve({ error: null });
        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mocks.deleteAccount).toHaveBeenCalledTimes(1);
        expect(mocks.clearLocalUserData).not.toHaveBeenCalled(); // deleteAccount() erases the device itself
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
            'Your account and all its data have been deleted.',
            { id: 'fitwizard-data-kept-on-device' },
        );
    });

    it('shows an error and lets the user retry when deletion fails', async () => {
        mocks.deleteAccount
            .mockResolvedValueOnce({ error: new Error('Deletion failed') })
            .mockResolvedValueOnce({ error: null });
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
        fireEvent.change(confirmInput(), { target: { value: 'DELETE' } });
        fireEvent.click(screen.getAllByRole('button', { name: 'Delete account' }).at(-1)!);

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't delete your account.");
        expect(mocks.toastError).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
        expect(screen.queryByText('Home page')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mocks.deleteAccount).toHaveBeenCalledTimes(2);
    });

    it('offers the export before deleting', () => {
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Download your data first' }));
        expect(onExportData).toHaveBeenCalledTimes(1);
    });
});

describe('AccountDeletionSection, guest', () => {
    beforeEach(() => {
        mocks.user = null;
    });

    it('erases this device after DELETE is typed, without calling the account function', async () => {
        renderSection();
        expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Erase data on this device' }));

        const confirm = screen.getByRole('button', { name: 'Erase data' });
        expect(confirm).toBeDisabled();
        fireEvent.change(confirmInput(), { target: { value: 'DELETE' } });
        fireEvent.click(confirm);

        await waitFor(() => expect(mocks.clearLocalUserData).toHaveBeenCalledTimes(1));
        expect(mocks.deleteAccount).not.toHaveBeenCalled();
        expect(await screen.findByText('Home page')).toBeInTheDocument();
        expect(mocks.toastSuccess).toHaveBeenCalledWith(
            'All FitWizard data on this device has been erased.',
            { id: 'fitwizard-data-kept-on-device' },
        );
    });

    it('shows an error when erasing fails', async () => {
        mocks.clearLocalUserData.mockRejectedValueOnce(new Error('disk'));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        renderSection();
        fireEvent.click(screen.getByRole('button', { name: 'Erase data on this device' }));
        fireEvent.change(confirmInput(), { target: { value: 'DELETE' } });
        fireEvent.click(screen.getByRole('button', { name: 'Erase data' }));

        expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't erase this device.");
        expect(screen.queryByText('Home page')).not.toBeInTheDocument();
    });

    it('uses guest erase in demo mode even if a user object exists', () => {
        mocks.user = { id: 'user-a' };
        mocks.configured = false;
        renderSection();
        expect(screen.getByRole('button', { name: 'Erase data on this device' })).toBeInTheDocument();
    });
});
