import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { AuthModal } from './AuthModal';
import { sameOriginPath } from './sameOriginPath';
import { EMAIL_CODE_TTL_MS, RESEND_COOLDOWN_SECONDS } from './EmailCodeStep';
import { isNativeApp } from '@/lib/platform';

const mocks = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  verifyEmailCode: vi.fn(),
  setShowAuthModal: vi.fn(),
  setRedirectUrl: vi.fn(),
  redirectUrl: null as string | null,
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
    redirectUrl: mocks.redirectUrl,
    setRedirectUrl: mocks.setRedirectUrl,
  }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

/** AuthModal lives inside the app's router (App.tsx), so render it inside one here too. */
function renderModal(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthModal />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

/** Longer than input-otp's longest caret-sync timer (50 ms). */
const INPUT_OTP_TIMER_SETTLE_MS = 75;

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
    mocks.redirectUrl = null;
  });

  afterEach(async () => {
    // input-otp syncs the caret with un-cleared setTimeouts (0, 10 and 50 ms) after
    // each input event. If one fires after the test file's jsdom is torn down, React
    // throws "window is not defined" as an unhandled error and fails the run in CI.
    // Unmount first, drain any fake timers, then let the real ones run out.
    cleanup();
    if (vi.isFakeTimers()) {
      act(() => {
        vi.runOnlyPendingTimers();
      });
      vi.useRealTimers();
    }
    await new Promise((resolve) => setTimeout(resolve, INPUT_OTP_TIMER_SETTLE_MS));
  });

  it('moves to the code step after a successful send', async () => {
    renderModal();

    await sendCodeTo(' lifter@example.com ');

    expect(mocks.signInWithEmail).toHaveBeenCalledWith('lifter@example.com');
    expect(screen.getByText(/We sent a 6-digit code to lifter@example.com/)).toBeInTheDocument();
    expect(codeInput()).toHaveAttribute('autocomplete', 'one-time-code');
    expect(codeInput()).toHaveAttribute('inputmode', 'numeric');
    expect(codeInput()).toHaveAttribute('maxlength', '6');
  });

  it('stays on the email step and shows a translated error when sending fails', async () => {
    const rateLimited = Object.assign(new Error('Email rate limit exceeded'), {
      status: 429,
      code: 'over_email_send_rate_limit',
    });
    mocks.signInWithEmail.mockResolvedValue({ error: rateLimited });
    renderModal();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lifter@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /email me a code/i }));

    expect(
      await screen.findByText('Too many codes requested. Wait a minute, then try again.')
    ).toBeInTheDocument();
    // Supabase's own English text is never shown (DEBT-085).
    expect(screen.queryByText('Email rate limit exceeded')).not.toBeInTheDocument();
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });

  it('shows a generic translated error for an unknown send failure', async () => {
    mocks.signInWithEmail.mockResolvedValue({ error: new Error('Something odd from Supabase') });
    renderModal();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lifter@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /email me a code/i }));

    expect(await screen.findByText("We couldn't send the code. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText('Something odd from Supabase')).not.toBeInTheDocument();
  });

  it('submits automatically once six digits are entered, then closes', async () => {
    renderModal();
    await sendCodeTo();

    typeCode('12345');
    expect(mocks.verifyEmailCode).not.toHaveBeenCalled();

    typeCode('123456');

    await waitFor(() => expect(mocks.verifyEmailCode).toHaveBeenCalledWith('lifter@example.com', '123456'));
    await waitFor(() => expect(mocks.setShowAuthModal).toHaveBeenCalledWith(false));
  });

  it('ignores non-digit input', async () => {
    renderModal();
    await sendCodeTo();

    typeCode('12ab56');

    expect(mocks.verifyEmailCode).not.toHaveBeenCalled();
  });

  it('says the code is wrong when verification fails within the code lifetime', async () => {
    mocks.verifyEmailCode.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    renderModal();
    await sendCodeTo();

    typeCode('000000');

    expect(await screen.findByText("That code isn't right.")).toBeInTheDocument();
    expect(codeInput()).toHaveValue('');
  });

  it('says the code has expired when verification fails after the code lifetime', async () => {
    const start = new Date('2026-11-18T10:00:00Z').getTime();
    vi.useFakeTimers({ shouldAdvanceTime: true, now: start });
    mocks.verifyEmailCode.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    renderModal();
    await sendCodeTo();

    vi.setSystemTime(start + EMAIL_CODE_TTL_MS + 1000);
    typeCode('123456');

    expect(await screen.findByText('That code has expired. Send a new one.')).toBeInTheDocument();
  });

  it('keeps "Resend code" disabled for 60 seconds with a countdown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    renderModal();

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
    renderModal();
    await sendCodeTo();

    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }));

    expect(screen.getByLabelText('Email')).toHaveValue('lifter@example.com');
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
  });

  it('mentions the email link on the web but only the code on native', async () => {
    const { unmount } = renderModal();
    await sendCodeTo();
    expect(screen.getByText(/or tap the link in the email/)).toBeInTheDocument();
    unmount();

    vi.mocked(isNativeApp).mockReturnValue(true);
    renderModal();
    await sendCodeTo();
    expect(screen.getByText(/We sent a 6-digit code to lifter@example.com\. Enter it below\.$/)).toBeInTheDocument();
    expect(screen.queryByText(/tap the link/)).not.toBeInTheDocument();
  });
  it('returns to the saved same-origin redirect after the code is verified, and clears it', async () => {
    mocks.redirectUrl = `${window.location.origin}/circles/abc/feed?tab=latest#top`;
    renderModal('/');
    await sendCodeTo();

    typeCode('123456');

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/circles/abc/feed?tab=latest#top'));
    expect(mocks.setRedirectUrl).toHaveBeenCalledWith(null);
    expect(mocks.setShowAuthModal).toHaveBeenCalledWith(false);
  });

  it('stays put when there is no saved redirect', async () => {
    renderModal('/plan');
    await sendCodeTo();

    typeCode('123456');

    await waitFor(() => expect(mocks.setShowAuthModal).toHaveBeenCalledWith(false));
    expect(screen.getByTestId('location')).toHaveTextContent('/plan');
  });

  it('does not navigate after a failed verification', async () => {
    mocks.redirectUrl = `${window.location.origin}/circles/abc/feed`;
    mocks.verifyEmailCode.mockResolvedValue({ error: new Error('Token has expired or is invalid') });
    renderModal('/');
    await sendCodeTo();

    typeCode('000000');

    expect(await screen.findByText("That code isn't right.")).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
    expect(mocks.setRedirectUrl).not.toHaveBeenCalled();
  });
});

describe('sameOriginPath', () => {
  it('keeps path, query and hash for same-origin URLs', () => {
    expect(sameOriginPath(`${window.location.origin}/history?week=2#day3`)).toBe('/history?week=2#day3');
  });

  it('rejects other origins, empty values and junk', () => {
    expect(sameOriginPath('https://evil.example/steal')).toBeNull();
    expect(sameOriginPath('javascript:alert(1)')).toBeNull();
    expect(sameOriginPath(null)).toBeNull();
    expect(sameOriginPath('')).toBeNull();
  });
});
