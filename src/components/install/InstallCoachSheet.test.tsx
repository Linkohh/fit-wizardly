import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallCoachSheet } from './InstallCoachSheet';
import { useInstallCoachStore } from '@/stores/installCoachStore';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/sheet', async () => {
  const React = await import('react');

  type SheetContextValue = {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  };

  const SheetContext = React.createContext<SheetContextValue>({ open: false });

  const Sheet = ({
    open = false,
    onOpenChange,
    children,
  }: {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
  }) => <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;

  const SheetContent = ({ children }: { children: React.ReactNode }) => {
    const { open } = React.useContext(SheetContext);
    if (!open) {
      return null;
    }

    return <div data-testid="install-coach-sheet">{children}</div>;
  };

  const passthrough = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  );

  return {
    Sheet,
    SheetContent,
    SheetHeader: passthrough,
    SheetTitle: passthrough,
    SheetDescription: passthrough,
    SheetFooter: passthrough,
    SheetClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const IOS_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IOS_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/135.0.0.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36';

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
}

function setStandaloneMode(isStandalone: boolean) {
  Object.defineProperty(window.navigator, 'standalone', {
    value: isStandalone,
    configurable: true,
  });

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(display-mode: standalone)' ? isStandalone : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function resetInstallCoachStore() {
  useInstallCoachStore.setState({
    platform: 'unsupported',
    isStandalone: false,
    canNativeInstall: false,
    canShareShortcut: false,
    hasSeenCoach: false,
    dismissed: false,
    installed: false,
    isOpen: false,
    hasHydrated: true,
  });
}

describe('InstallCoachSheet', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    resetInstallCoachStore();
    setStandaloneMode(false);
    setUserAgent(IOS_SAFARI_UA);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows the Safari handoff on the first eligible iPhone Safari visit', () => {
    Object.defineProperty(window.navigator, 'share', {
      value: vi.fn(async () => undefined),
      configurable: true,
    });

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByText('Add FitWizard to your Home Screen')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Safari Share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Not now/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Stay in Browser/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Install Shortcut/i })).not.toBeInTheDocument();
  });

  it('stays hidden in standalone mode', () => {
    setStandaloneMode(true);

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();
  });

  it('does not auto-reopen after dismissal but can reopen manually', () => {
    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    fireEvent.click(screen.getByRole('button', { name: /Not now/i }));
    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();

    act(() => {
      useInstallCoachStore.getState().openCoach();
    });

    expect(screen.getByText('Add FitWizard to your Home Screen')).toBeInTheDocument();
  });

  it('opens the share flow on iPhone Safari and closes the handoff sheet', async () => {
    const share = vi.fn(async () => undefined);
    Object.defineProperty(window.navigator, 'share', {
      value: share,
      configurable: true,
    });

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Open Safari Share/i }));
      await Promise.resolve();
    });

    expect(share).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();
  });

  it('keeps the coach dismissed when the Safari share flow is cancelled by the user', async () => {
    Object.defineProperty(window.navigator, 'share', {
      value: vi.fn(async () => {
        throw new DOMException('AbortError', 'AbortError');
      }),
      configurable: true,
    });

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Open Safari Share/i }));
      await Promise.resolve();
    });

    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();
  });

  it('reopens with steps expanded when the Safari share flow fails', async () => {
    Object.defineProperty(window.navigator, 'share', {
      value: vi.fn(async () => {
        throw new Error('Share failed');
      }),
      configurable: true,
    });

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Open Safari Share/i }));
      await Promise.resolve();
    });

    expect(screen.getByText('Add FitWizard to your Home Screen')).toBeInTheDocument();
    expect(
      screen.getByText('Tap View More if Add to Home Screen is not visible.'),
    ).toBeInTheDocument();
  });

  it('shows Chrome-specific handoff copy on iPhone Chrome', async () => {
    setUserAgent(IOS_CHROME_UA);
    Object.defineProperty(window.navigator, 'share', {
      value: vi.fn(async () => undefined),
      configurable: true,
    });

    render(<InstallCoachSheet />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByRole('button', { name: /Open Share Menu/i })).toBeInTheDocument();
    expect(screen.getByText('Then choose Add to Home Screen.')).toBeInTheDocument();
  });

  it('uses the native Android install prompt when available', async () => {
    setUserAgent(ANDROID_CHROME_UA);

    const prompt = vi.fn(async () => undefined);
    const beforeInstallPromptEvent = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
      preventDefault: () => void;
    };

    beforeInstallPromptEvent.prompt = prompt;
    beforeInstallPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    beforeInstallPromptEvent.preventDefault = vi.fn();

    render(<InstallCoachSheet />);

    act(() => {
      window.dispatchEvent(beforeInstallPromptEvent);
      vi.advanceTimersByTime(1400);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Install FitWizard/i }));
      await Promise.resolve();
    });

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('waits for enableAutoPrompt before auto-opening', () => {
    const { rerender } = render(<InstallCoachSheet enableAutoPrompt={false} />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.queryByText('Add FitWizard to your Home Screen')).not.toBeInTheDocument();

    rerender(<InstallCoachSheet enableAutoPrompt />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByText('Add FitWizard to your Home Screen')).toBeInTheDocument();
  });
});
