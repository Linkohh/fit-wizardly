import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { sameOriginPath } from './sameOriginPath';
import { sendErrorKey } from './sendErrorKey';

// The code step pulls in input-otp; load it only once a code has been sent
// (DEBT-079), so it stays out of the startup bundle.
const loadEmailCodeStep = () => import('./EmailCodeStep');
const EmailCodeStep = lazy(() =>
  loadEmailCodeStep().then((module) => ({ default: module.EmailCodeStep }))
);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email sign-in (roadmap 2.1). Step 1 sends one email that holds both a magic
 * link and a 6-digit code; step 2 takes the code. The native app has no deep
 * links, so there the code is the only way in.
 */
export function AuthModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    showAuthModal,
    setShowAuthModal,
    signInWithEmail,
    verifyEmailCode,
    isConfigured,
    redirectUrl,
    setRedirectUrl,
  } = useAuthStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  /** When the current code was sent; null while on the email step. */
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    const trimmed = email.trim();
    const result = await signInWithEmail(trimmed);
    if (!result.error) setSentAt(Date.now());
    return result;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    // Defense-in-depth: validate format before calling Supabase so we can show
    // an inline error instead of silently sending to a malformed address.
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(t('auth.email_invalid'));
      return;
    }

    setIsLoading(true);
    setError(null);
    // Fetch the code step while the email is being sent.
    void loadEmailCodeStep().catch(() => undefined);
    const { error: sendError } = await sendCode();
    setIsLoading(false);

    if (sendError) setError(t(sendErrorKey(sendError)));
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setEmail('');
    setSentAt(null);
    setError(null);
  };

  // The magic link returns to redirectUrl through emailRedirectTo; the code
  // path has to do the same itself (for example back to a protected route
  // that RequireAuth sent to /).
  const handleVerified = () => {
    const destination = sameOriginPath(redirectUrl);
    setRedirectUrl(null);
    handleClose();
    if (destination) navigate(destination, { replace: true });
  };

  if (!isConfigured) {
    return (
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.unavailable_title')}</DialogTitle>
            <DialogDescription>{t('auth.unavailable_description')}</DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose} className="w-full">
            {t('auth.unavailable_dismiss')}
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => (open ? setShowAuthModal(true) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        {sentAt === null ? (
          <>
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center">{t('auth.title')}</DialogTitle>
              <DialogDescription className="text-center">{t('auth.description')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email_label')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth.email_placeholder')}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                className="w-full gradient-primary text-white"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('auth.sending')}
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    {t('auth.send_code')}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">{t('auth.no_password')}</p>
            </form>
          </>
        ) : (
          <Suspense
            fallback={
              <div className="flex justify-center py-10" role="status" aria-label={t('auth.code_title')}>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <EmailCodeStep
              email={email.trim()}
              sentAt={sentAt}
              verifyEmailCode={verifyEmailCode}
              onResend={sendCode}
              onUseDifferentEmail={() => {
                setSentAt(null);
                setError(null);
              }}
              onVerified={handleVerified}
              onClose={handleClose}
            />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
