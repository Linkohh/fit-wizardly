import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';
import { clearLocalUserData } from '@/lib/storage/clearLocalUserData';
import { translate } from '@/lib/translate';
import { syncAll, waitForRunningSync } from '@/lib/sync/engine';
import { countPendingChanges, loadOutbox } from '@/lib/sync/outbox';
import { stopSync } from '@/lib/sync/triggers';
import { useAuthStore } from '@/stores/authStore';

/**
 * Safe sign-out (Lane E Day 7, DEBT-045). Two steps so the UI can warn in between:
 *
 * 1. prepareSignOut(): sync now, then report how many changes are still unsent
 *    (for example offline, or the server refused them).
 * 2. completeSignOut(): stop sync, sign out, then erase the training data from this
 *    device. The account keeps the synced copy; a shared phone or computer no
 *    longer shows it.
 */

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Syncs one last time and returns how many local changes are still not backed up. */
export async function prepareSignOut(userId: string): Promise<{ pending: number }> {
  if (isSupabaseConfigured() && !isOffline()) {
    try {
      await syncAll(userId);
    } catch (error) {
      console.error('[FitWizard] Sync before sign-out failed.', error);
    }
  }
  await loadOutbox();
  return { pending: countPendingChanges() };
}

/** Signs out and erases this device's copy of the training data. */
export async function completeSignOut(): Promise<void> {
  // Nothing may sync once erasing starts: the erase marks every record as deleted.
  stopSync();
  await waitForRunningSync();

  await useAuthStore.getState().signOut({ quiet: true });

  try {
    await clearLocalUserData();
  } catch (error) {
    console.error('[FitWizard] Signed out, but erasing this device failed.', error);
  }

  toast.success(
    translate(
      'sync.signed_out_erased',
      'Signed out. Your training is saved in your account and removed from this device.',
    ),
  );
}
