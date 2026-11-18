import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { AuthModal } from './AuthModal';
import { EMAIL_CODE_TTL_MS, RESEND_COOLDOWN_SECONDS } from './EmailCodeStep';
import { isNativeApp } from '@/lib/platform';

const mocks = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  verifyEmailCode: vi.fn(),
  setShowAuthModal: vi.fn(),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: vi.fn(() => false),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    showAuthModal: true,
    setShowAuthModal: mocks.setShowAuthModal,
    signInWithEmail: mocks.signInWithEmail,
    verifyEmailCode: mocks.verifyEmailCode,
    isConfigured: true,
  }),
}));

function codeInput() {
  return screen.getByLabelText('Sign-in code');
}

async function sendCodeTo(email = 'lifter@example.com') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: /email me a code/i }));
  await screen.findByText('Check your email');
}

function typeCode(code: string) {
  fireEvent.change(codeInput(), { target: { value: code } });
}

describe('AuthModal email-code sign-in', () => {
  beforeAll(() => {
    // input-otp probes for password-manager badges with elementFromPoint, which jsdom lacks.
    if (typeof document.elementFromPoint !== 'function') {
      document.elementFromPoint = () => null;
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNativeApp).mockReturnValue(false);
    mocks.signInWithEmail.mockResolvedValue({ error: null });
    mocks.verifyEmailCode.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('moves to the code step after a successful send', async () => {
    render(<AuthModal />);

    await sendCodeTo(' lifter@example.com ');

    expect(mocks.signInWithEmail).toHaveBeenCalledWith('lifter@example.com');
    expect(screen.getByText(/We sent a 6-digit code to lifter@example.com/)).toBeInTheDocument();
    expect(codeInput()).toHaveAttribute('autocomplete', 'one-time-code');
    expect(codeInput()).toHaveAttribute('inputmode', 'numeric');
    expect(codeInput()).toHaveAttribute('maxlength', '6');
  });

  it('stays on the email step and shows the error when sending fails', async () => {
    mocks.signInWithEmail.mockResolvedValue({ error: new Error('Email rate limit exceeded') });
    render(<AuthModal />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lifter@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /email me a code/i }));

    expect(await screen.findByText('Email rate limit exceeded')).toBeInTheDocument();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });

  it('submits automatically once six digits are entered, then closes', async () => {
    render(<AuthModal />);
    await sendCodeTo();

    typeCode('12345');
    expect(mocks.verifyEmailCode).not.toHaveBeenCalled();

    typeCode('123456');

    await waitFor(() => expect(mocks.verifyEmailCode).toHaveBeenCalledWith('lifter@example.com', '123456'));
    await waitFor(() => expect(mocks.setShowAuthModal).toHaveBeenCalledWith(false));
  });

  it('ignores non-digit input', async () => {
    render(<AuthModal />);
    await sendCodeTo();

    typeCode('12ab56');

    expect(mocks.verifyEmailCode).not.toHaveBeenCalled();
  });

  it('says the code is wrong when verification fails within the code lifetime', async () => {
    mocks.verifyEmailCode.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    render(<AuthModal />);
    await sendCodeTo();

    typeCode('000000');

    expect(await screen.findByText("That code isn't right.")).toBeInTheDocument();
    expect(codeInput()).toHaveValue('');
  });

  it('says the code has expired when verification fails after the code lifetime', async () => {
    const start = new Date('2026-11-18T10:00:00Z').getTime();
    vi.useFakeTimers({ shouldAdvanceTime: true, now: start });
    mocks.verifyEmailCode.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    render(<AuthModal />);
    await sendCodeTo();

    vi.setSystemTime(start + EMAIL_CODE_TTL_MS + 1000);
    typeCode('123456');

    expect(await screen.findByText('That code has expired. Send a new one.')).toBeInTheDocument();
  });

  it('keeps "Resend code" disabled for 60 seconds with a countdown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    render(<AuthModal />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lifter@example.com' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /email me a code/i }));
    });

    const countdown = screen.getByRole('button', { name: `Resend code in ${RESEND_COOLDOWN_SECONDS}s` });
    expect(countdown).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByRole('button', { name: 'Resend code in 30s' })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    const resend = screen.getByRole('button', { name: 'Resend code' });
    expect(resend).toBeEnabled();

    await act(async () => {
      fireEvent.click(resend);
    });
    expect(mocks.signInWithEmail).toHaveBeenCalledTimes(2);
    expect(screen.getByText('We sent a new code.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Resend code in ${RESEND_COOLDOWN_SECONDS}s` })).toBeDisabled();
  });

  it('"Use a different email" goes back to the email step', async () => {
    render(<AuthModal />);
    await sendCodeTo();

    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }));

    expect(screen.getByLabelText('Email')).toHaveValue('lifter@example.com');
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });

  it('mentions the email link on the web but only the code on native', async () => {
    const { unmount } = render(<AuthModal />);
    await sendCodeTo();
    expect(screen.getByText(/or tap the link in the email/)).toBeInTheDocument();
    unmount();

    vi.mocked(isNativeApp).mockReturnValue(true);
    render(<AuthModal />);
    await sendCodeTo();
    expect(screen.getByText(/We sent a 6-digit code to lifter@example.com\. Enter it below\.$/)).toBeInTheDocument();
    expect(screen.queryByText(/tap the link/)).not.toBeInTheDocument();
  });
});
