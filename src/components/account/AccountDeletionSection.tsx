import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteAccount } from '@/lib/account/deleteAccount';
import { clearLocalUserData } from '@/lib/storage/clearLocalUserData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

/** The word the user types to confirm. Kept in English in every language so support can quote it. */
export const DELETE_CONFIRMATION_WORD = 'DELETE';

interface AccountDeletionSectionProps {
    /** The Profile "Export data" action, offered before anything is deleted. */
    onExportData: () => void;
}

/**
 * Profile → Details: "Delete account" for signed-in users (contract #4) or
 * "Erase data on this device" for guests (contract #2). Both ask the user to
 * type DELETE before the confirm button is enabled.
 */
export function AccountDeletionSection({ onExportData }: AccountDeletionSectionProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isSignedIn = useAuthStore((state) => Boolean(state.user)) && isSupabaseConfigured();

    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);

    const confirmed = typed.trim() === DELETE_CONFIRMATION_WORD;
    const inputId = isSignedIn ? 'delete-account-confirm' : 'erase-device-confirm';

    const handleOpenChange = (next: boolean) => {
        if (pending) return; // keep the dialog up until the request settles
        setOpen(next);
        if (!next) {
            setTyped('');
            setFailed(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmed || pending) return;
        setPending(true);
        setFailed(false);

        let ok: boolean;
        if (isSignedIn) {
            const { error } = await deleteAccount();
            ok = error === null;
        } else {
            try {
                await clearLocalUserData();
                ok = true;
            } catch (error) {
                console.error('[FitWizard] Erasing this device failed.', error);
                ok = false;
            }
        }

        setPending(false);
        if (!ok) {
            setFailed(true);
            toast.error(
                isSignedIn
                    ? t('account.delete.error', "We couldn't delete your account. Check your connection and try again.")
                    : t('account.erase.error', "We couldn't erase this device. Please try again."),
            );
            return;
        }

        setOpen(false);
        setTyped('');
        toast.success(
            isSignedIn
                ? t('account.delete.success', 'Your account and all its data have been deleted.')
                : t('account.erase.success', 'All FitWizard data on this device has been erased.'),
        );
        navigate('/');
    };

    const copy = isSignedIn
        ? {
            trigger: t('account.delete.button', 'Delete account'),
            title: t('account.delete.title', 'Delete your account?'),
            body: t(
                'account.delete.body',
                'This permanently deletes your FitWizard account and everything synced to it: plans, workout history, personal records, nutrition, body measurements, readiness check-ins, achievements and custom exercises. FitWizard data on this device is erased too. This can\'t be undone.',
            ),
            confirm: t('account.delete.confirm', 'Delete account'),
            pending: t('account.delete.pending', 'Deleting…'),
            error: t('account.delete.error', "We couldn't delete your account. Check your connection and try again."),
        }
        : {
            trigger: t('account.erase.button', 'Erase data on this device'),
            title: t('account.erase.title', 'Erase data on this device?'),
            body: t(
                'account.erase.body',
                'This removes your plans, workout history, personal records, nutrition, body measurements, readiness check-ins, achievements, custom exercises and exercise favourites from this device. You aren\'t signed in, so there is no cloud copy. This can\'t be undone.',
            ),
            confirm: t('account.erase.confirm', 'Erase data'),
            pending: t('account.erase.pending', 'Erasing…'),
            error: t('account.erase.error', "We couldn't erase this device. Please try again."),
        };

    return (
        <div className="space-y-2" data-testid="account-deletion-section">
            <AlertDialog open={open} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                        <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                        {copy.trigger}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{copy.title}</AlertDialogTitle>
                        <AlertDialogDescription>{copy.body}</AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor={inputId}>
                            {t('account.type_to_confirm', 'Type {{word}} to confirm', { word: DELETE_CONFIRMATION_WORD })}
                        </Label>
                        <Input
                            id={inputId}
                            value={typed}
                            onChange={(event) => setTyped(event.target.value)}
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            disabled={pending}
                        />
                        {failed && (
                            <p role="alert" className="text-sm text-destructive">
                                {copy.error}
                            </p>
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>{t('account.cancel', 'Cancel')}</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed || pending}>
                            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                            {pending ? copy.pending : failed ? t('account.retry', 'Try again') : copy.confirm}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button variant="link" className="h-auto px-0 text-sm" onClick={onExportData}>
                <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                {t('account.download_first', 'Download your data first')}
            </Button>
        </div>
    );
}
