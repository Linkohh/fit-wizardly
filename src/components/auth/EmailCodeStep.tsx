import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { isNativeApp } from '@/lib/platform';
import { sendErrorKey } from './sendErrorKey';

export const EMAIL_CODE_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;
/**
 * How long a code lasts. Must match Supabase → Authentication → "Email OTP
 * expiration" (L11). Supabase answers a wrong code and an expired code with the
 * same error, so the elapsed time since sending is what tells them apart.
 */
export const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;

type CodeError = 'wrong' | 'expired' | null;

export interface EmailCodeStepProps {
  email: string;
  /** When the current code was sent (ms since epoch). */
  sentAt: number;
  verifyEmailCode: (email: string, code: string) => Promise<{ error: Error | null }>;
  /** Sends a new code; resolves with the send error, if any. */
  onResend: () => Promise<{ error: Error | null }>;
  onUseDifferentEmail: () => void;
  onVerified: () => void;
  onClose: () => void;
}

function secondsUntil(timestamp: number) {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

export function EmailCodeStep({
  email,
  sentAt,
  verifyEmailCode,
  onResend,
  onUseDifferentEmail,
  onVerified,
  onClose,
}: EmailCodeStepProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState<CodeError>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const resendAvailableAt = sentAt + RESEND_COOLDOWN_SECONDS * 1000;
  const [cooldown, setCooldown] = useState(() => secondsUntil(resendAvailableAt));

  useEffect(() => {
    setCooldown(secondsUntil(resendAvailableAt));
    const intervalId = window.setInterval(() => {
      const remaining = secondsUntil(resendAvailableAt);
      setCooldown(remaining);
      if (remaining === 0) window.clearInterval(intervalId);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [resendAvailableAt]);

  const submitCode = useCallback(
    async (value: string) => {
      setIsVerifying(true);
      setCodeError(null);
      const { error } = await verifyEmailCode(email, value);
      setIsVerifying(false);

      if (!error) {
        onVerified();
        return;
      }

      setCode('');
      setCodeError(Date.now() - sentAt >= EMAIL_CODE_TTL_MS ? 'expired' : 'wrong');
    },
    [email, onVerified, sentAt, verifyEmailCode]
  );

  const handleResend = async () => {
    setIsResending(true);
    setResendError(null);
    setResent(false);
    const { error } = await onResend();
    setIsResending(false);

    if (error) {
      setResendError(t(sendErrorKey(error)));
      return;
    }
    setCode('');
    setCodeError(null);
    setResent(true);
  };

  const description = isNativeApp()
    ? t('auth.code_description_native', { email })
    : t('auth.code_description_web', { email });

  return (
    <>
      <DialogHeader>
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <DialogTitle className="text-center">{t('auth.code_title')}</DialogTitle>
        <DialogDescription className="text-center">{description}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 flex flex-col items-center gap-3">
        <InputOTP
          maxLength={EMAIL_CODE_LENGTH}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={(value) => {
            setCode(value);
            if (codeError) setCodeError(null);
          }}
          onComplete={(value: string) => void submitCode(value)}
          autoComplete="one-time-code"
          inputMode="numeric"
          aria-label={t('auth.code_label')}
          aria-invalid={codeError ? true : undefined}
          aria-describedby={codeError ? 'auth-code-error' : undefined}
          disabled={isVerifying}
          autoFocus
        >
          <InputOTPGroup>
            {Array.from({ length: EMAIL_CODE_LENGTH }, (_, index) => (
              <InputOTPSlot key={index} index={index} className="h-12 w-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <div aria-live="polite" className="min-h-5 text-sm text-center">
          {isVerifying && (
            <span className="inline-flex items-center text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('auth.verifying')}
            </span>
          )}
          {!isVerifying && codeError && (
            <span id="auth-code-error" className="text-destructive">
              {codeError === 'expired' ? t('auth.code_expired') : t('auth.code_wrong')}
            </span>
          )}
          {!isVerifying && !codeError && resendError && <span className="text-destructive">{resendError}</span>}
          {!isVerifying && !codeError && !resendError && resent && (
            <span className="text-muted-foreground">{t('auth.resent')}</span>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void handleResend()}
          disabled={cooldown > 0 || isResending || isVerifying}
        >
          {isResending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {cooldown > 0 ? t('auth.resend_in', { seconds: cooldown }) : t('auth.resend')}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onUseDifferentEmail} disabled={isVerifying}>
          {t('auth.different_email')}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          {t('auth.close')}
        </Button>
      </div>
    </>
  );
}
