/**
 * Client for the delete-account Edge Function (contract #4).
 *
 * POST {VITE_SUPABASE_URL}/functions/v1/delete-account with the signed-in
 * user's access token. On 204 the account and every row that references it
 * are gone (cascade from auth.users), so this erases the device copy
 * (contract #2) and signs out. Navigation is left to the caller.
 */

import { isSupabaseConfigured, supabase, validateRemoteEndpoint } from '@/lib/supabase';
import { clearLocalUserData } from '@/lib/storage/clearLocalUserData';
import { useAuthStore } from '@/stores/authStore';

export const DELETE_ACCOUNT_FUNCTION_PATH = '/functions/v1/delete-account';

export class DeleteAccountError extends Error {
    constructor(
        message: string,
        /** HTTP status from the function, or 0 when the request never got an answer. */
        readonly status: number,
    ) {
        super(message);
        this.name = 'DeleteAccountError';
    }
}

async function readAccessToken(): Promise<string | null> {
    try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) return data.session.access_token;
    } catch (error) {
        console.error('[FitWizard] Could not read the session for account deletion.', error);
    }
    return useAuthStore.getState().session?.access_token ?? null;
}

export async function deleteAccount(): Promise<{ error: Error | null }> {
    const baseUrl = validateRemoteEndpoint(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!isSupabaseConfigured() || !baseUrl || !anonKey) {
        return { error: new DeleteAccountError('Accounts are not available in this build', 0) };
    }

    const accessToken = await readAccessToken();
    if (!accessToken) {
        return { error: new DeleteAccountError('Not authenticated', 401) };
    }

    let response: Response;
    try {
        response = await fetch(`${baseUrl}${DELETE_ACCOUNT_FUNCTION_PATH}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: anonKey,
            },
        });
    } catch (error) {
        console.error('[FitWizard] Account deletion request failed.', error);
        return { error: new DeleteAccountError('Network error', 0) };
    }

    if (response.status !== 204) {
        const message = response.status === 401 ? 'Not authenticated' : 'Deletion failed';
        return { error: new DeleteAccountError(message, response.status) };
    }

    // The account is gone from here on: report success even if a local step fails.
    try {
        await clearLocalUserData();
    } catch (error) {
        console.error('[FitWizard] Account deleted, but erasing this device failed.', error);
    }
    try {
        // quiet: skip the "your data stays on this device" toast, which is untrue here.
        await useAuthStore.getState().signOut({ quiet: true });
    } catch (error) {
        console.error('[FitWizard] Account deleted, but signing out failed.', error);
    }
    return { error: null };
}
