import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    configured: true,
    getSession: vi.fn(),
    clearLocalUserData: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    storeSession: null as { access_token: string } | null,
    calls: [] as string[],
}));

vi.mock('@/lib/supabase', () => ({
    isSupabaseConfigured: () => mocks.configured,
    validateRemoteEndpoint: (value: string | undefined) => (value ? value.replace(/\/$/, '') : null),
    supabase: { auth: { getSession: mocks.getSession } },
}));

vi.mock('@/lib/storage/clearLocalUserData', () => ({
    clearLocalUserData: mocks.clearLocalUserData,
}));

vi.mock('@/stores/authStore', () => ({
    useAuthStore: {
        getState: () => ({ session: mocks.storeSession, signOut: mocks.signOut }),
    },
}));

import { deleteAccount, DeleteAccountError } from './deleteAccount';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    mocks.configured = true;
    mocks.storeSession = null;
    mocks.calls = [];
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'user-token' } } });
    mocks.clearLocalUserData.mockImplementation(async () => {
        mocks.calls.push('clear');
    });
    mocks.signOut.mockImplementation(async () => {
        mocks.calls.push('signOut');
    });
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co/');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('deleteAccount (contract #4 client)', () => {
    it('POSTs to the function with the access token and anon key, with no body', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await deleteAccount();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://project.supabase.co/functions/v1/delete-account');
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual({ Authorization: 'Bearer user-token', apikey: 'anon-key' });
        expect(init?.body).toBeUndefined();
    });

    it('on 204 erases the device, then signs out, and reports success', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        const result = await deleteAccount();

        expect(result.error).toBeNull();
        expect(mocks.calls).toEqual(['clear', 'signOut']);
    });

    it('still signs out and reports success if erasing the device throws after deletion', async () => {
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
        mocks.clearLocalUserData.mockRejectedValueOnce(new Error('disk'));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await deleteAccount();

        expect(result.error).toBeNull();
        expect(mocks.signOut).toHaveBeenCalledTimes(1);
    });

    it('on 500 returns "Deletion failed" and keeps the device data and session', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'Deletion failed' }), { status: 500 }));

        const result = await deleteAccount();

        expect(result.error).toBeInstanceOf(DeleteAccountError);
        expect(result.error?.message).toBe('Deletion failed');
        expect((result.error as DeleteAccountError).status).toBe(500);
        expect(mocks.clearLocalUserData).not.toHaveBeenCalled();
        expect(mocks.signOut).not.toHaveBeenCalled();
    });

    it('on 401 returns "Not authenticated"', async () => {
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 }));

        const result = await deleteAccount();

        expect(result.error?.message).toBe('Not authenticated');
        expect(mocks.signOut).not.toHaveBeenCalled();
    });

    it('returns a network error without touching local data when fetch rejects', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const result = await deleteAccount();

        expect((result.error as DeleteAccountError).status).toBe(0);
        expect(mocks.clearLocalUserData).not.toHaveBeenCalled();
    });

    it('does not call the function without a session', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: null } });

        const result = await deleteAccount();

        expect(result.error?.message).toBe('Not authenticated');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('falls back to the auth store session when getSession has none', async () => {
        mocks.getSession.mockResolvedValue({ data: { session: null } });
        mocks.storeSession = { access_token: 'store-token' };
        fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

        await deleteAccount();

        expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer store-token' });
    });

    it('does nothing when Supabase is not configured (demo mode)', async () => {
        mocks.configured = false;

        const result = await deleteAccount();

        expect(result.error).toBeInstanceOf(DeleteAccountError);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
