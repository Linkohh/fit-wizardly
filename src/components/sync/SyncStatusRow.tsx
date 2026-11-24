import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, CloudOff, Loader2, LogOut, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeSignOut } from '@/components/sync/SignOutDialog';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSyncStatus } from '@/lib/sync/status';
import { useAuthStore } from '@/stores/authStore';
import type { SyncStatus } from '@/lib/sync/types';

const ICONS: Record<SyncStatus, typeof CheckCircle2> = {
  synced: CheckCircle2,
  saving: Loader2,
  offline: CloudOff,
  error: AlertTriangle,
  'signed-out': UploadCloud,
};

/**
 * Profile row showing cloud backup state (contract #5 `useSyncStatus`, Lane E
 * Day 6): Synced, Saving…, Offline, Sync problem (with Retry), or a sign-in
 * prompt for guests.
 */
export function SyncStatusRow() {
  const { t } = useTranslation();
  const status = useSyncStatus();
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const [retrying, setRetrying] = useState(false);
  const { requestSignOut, busy: signingOut, dialog: signOutDialog } = useSafeSignOut();

  const labels: Record<SyncStatus, string> = {
    synced: t('sync.synced', 'Synced'),
    saving: t('sync.saving', 'Saving…'),
    offline: t('sync.offline', "Offline. Changes will sync when you're back online."),
    error: t('sync.error', 'Sync problem. Your data is still saved on this device.'),
    'signed-out': t('sync.signed_out', 'Sign in to back up your training.'),
  };
  const Icon = ICONS[status];

  // Demo mode (no Supabase): there is no account to back up to.
  if (!isSupabaseConfigured()) return null;

  const handleRetry = async () => {
    if (!userId) return;
    setRetrying(true);
    try {
      const { retrySync } = await import('@/lib/sync/triggers');
      await retrySync(userId);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3" data-testid="sync-status-row" data-status={status}>
      <div className="flex items-start gap-3 min-w-0">
        <Icon
          aria-hidden="true"
          className={
            status === 'error'
              ? 'h-5 w-5 mt-0.5 shrink-0 text-destructive'
              : status === 'synced'
                ? 'h-5 w-5 mt-0.5 shrink-0 text-primary'
                : `h-5 w-5 mt-0.5 shrink-0 text-muted-foreground${status === 'saving' ? ' animate-spin' : ''}`
          }
        />
        <div className="space-y-0.5 min-w-0">
          <p className="text-base font-medium">{t('sync.title', 'Cloud backup')}</p>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {labels[status]}
          </p>
        </div>
      </div>
      {status === 'error' && (
        <Button variant="outline" size="sm" onClick={() => void handleRetry()} disabled={retrying}>
          {retrying && <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />}
          {t('sync.retry', 'Retry')}
        </Button>
      )}
      {status === 'signed-out' && (
        <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)}>
          {t('sync.sign_in', 'Sign in')}
        </Button>
      )}
      {status !== 'signed-out' && (
        <Button variant="ghost" size="sm" onClick={requestSignOut} disabled={signingOut} data-testid="profile-sign-out">
          {signingOut ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <LogOut aria-hidden="true" className="h-4 w-4 mr-2" />
          )}
          {signingOut ? t('sync.signing_out', 'Saving your changes…') : t('sync.sign_out', 'Sign out')}
        </Button>
      )}
      {signOutDialog}
    </div>
  );
}
