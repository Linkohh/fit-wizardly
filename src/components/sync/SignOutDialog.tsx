import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/stores/authStore';

/**
 * Safe sign-out for every sign-out entry point (Profile, command palette).
 * Syncs first; if changes are still unsent, asks before signing out, because
 * signing out erases this device's copy of the training data (DEBT-045).
 */
export function useSafeSignOut(): { requestSignOut: () => void; busy: boolean; dialog: ReactNode } {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const finish = async () => {
    setBusy(true);
    try {
      const { completeSignOut } = await import('@/lib/sync/signOut');
      await completeSignOut();
    } finally {
      setPending(null);
      setBusy(false);
    }
  };

  const requestSignOut = () => {
    if (busy) return;
    if (!userId) {
      void useAuthStore.getState().signOut();
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        const { prepareSignOut } = await import('@/lib/sync/signOut');
        const { pending: unsent } = await prepareSignOut(userId);
        if (unsent > 0) {
          setPending(unsent);
          setBusy(false);
          return;
        }
        await finish();
      } catch (error) {
        console.error('[FitWizard] Sign-out failed.', error);
        setBusy(false);
      }
    })();
  };

  const dialog = (
    <AlertDialog open={pending !== null} onOpenChange={(open) => (!open && !busy ? setPending(null) : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('sync.sign_out_unsent_title', "Some changes aren't backed up")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              'sync.sign_out_unsent_body',
              "{{count}} changes haven't been saved to your account yet. Signing out removes your training from this device, so they'll be lost. Connect to the internet and wait a moment to keep them.",
              { count: pending ?? 0 },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('sync.sign_out_keep', 'Stay signed in')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void finish();
            }}
          >
            {t('sync.sign_out_anyway', 'Sign out anyway')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { requestSignOut, busy, dialog };
}
