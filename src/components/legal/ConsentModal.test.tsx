import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentModal } from './ConsentModal';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CONSENT_REQUEST_EVENT,
  CONSENT_RESOLVED_EVENT,
  CONSENT_STORAGE_KEY,
  CRASH_REPORTS_CONSENT_STORAGE_KEY,
  NUTRITION_LOOKUP_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

const CRASH_LABEL = /Send crash reports/i;
const ANALYTICS_LABEL = /Share anonymous usage statistics/i;

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
  }) => (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      <button type="button" data-testid="sheet-dismiss" onClick={() => onOpenChange?.(false)}>
        dismiss
      </button>
      {children}
    </SheetContext.Provider>
  );

  const SheetContent = ({
    children,
    className,
    enableBlur: _enableBlur,
    onEscapeKeyDown,
    onInteractOutside,
    onPointerDownOutside,
    showCloseButton: _showCloseButton,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    enableBlur?: boolean;
    onEscapeKeyDown?: (event: Event) => void;
    onInteractOutside?: (event: Event) => void;
    onPointerDownOutside?: (event: Event) => void;
    showCloseButton?: boolean;
  }) => {
    const { open, onOpenChange } = React.useContext(SheetContext);

    if (!open) {
      return null;
    }

    const createDismissEvent = () => {
      let defaultPrevented = false;
      return {
        get defaultPrevented() {
          return defaultPrevented;
        },
        preventDefault: () => {
          defaultPrevented = true;
        },
      } as Event;
    };

    const requestDismiss = (handler?: (event: Event) => void) => {
      const event = createDismissEvent();
      handler?.(event);
      if (!event.defaultPrevented) {
        onOpenChange?.(false);
      }
    };

    return (
      <section data-testid="consent-tray" className={className} {...props}>
        <button type="button" data-testid="sheet-escape" onClick={() => requestDismiss(onEscapeKeyDown)}>
          escape
        </button>
        <button
          type="button"
          data-testid="sheet-pointer-outside"
          onClick={() => requestDismiss(onPointerDownOutside)}
        >
          pointer outside
        </button>
        <button
          type="button"
          data-testid="sheet-interact-outside"
          onClick={() => requestDismiss(onInteractOutside)}
        >
          interact outside
        </button>
        {children}
      </section>
    );
  };

  const passthrough = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  );

  return {
    Sheet,
    SheetContent,
    SheetHeader: passthrough,
    SheetFooter: passthrough,
    SheetTitle: passthrough,
    SheetDescription: passthrough,
  };
});

function renderConsentModal() {
  return render(
    <MemoryRouter>
      <ConsentModal />
    </MemoryRouter>,
  );
}

describe('ConsentModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('shows the premium consent tray on first visit after the hydration delay', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
    expect(screen.getByText('Welcome to FitWizard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I Agree & Continue/i })).toBeInTheDocument();
  });

  it('stays hidden when consent was already stored', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());

    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByTestId('consent-tray')).not.toBeInTheDocument();
  });

  it('shows the crash-report and usage-statistics toggles separately, both off', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole('checkbox', { name: CRASH_LABEL })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: ANALYTICS_LABEL })).not.toBeChecked();
  });

  it('stores consent, opts out of crash reports and analytics by default, and closes the tray', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeTruthy();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(CRASH_REPORTS_CONSENT_STORAGE_KEY)).toBeNull();
    expect(screen.queryByTestId('consent-tray')).not.toBeInTheDocument();
  });

  it('stores usage statistics on their own, leaving crash reports off', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: ANALYTICS_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeTruthy();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(CRASH_REPORTS_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('stores crash reports on their own, leaving usage statistics off', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: CRASH_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(CRASH_REPORTS_CONSENT_STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('no longer writes the legacy analyticsStore copy of consent (DEBT-061)', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: ANALYTICS_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem('fitwizard-analytics')).toBeNull();
  });

  it('keeps an existing analytics opt-in when reopened from Privacy Settings, with crash reports off', () => {
    // A user who opted in before crash reports had their own key.
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    renderConsentModal();

    act(() => {
      window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
    });

    expect(screen.getByRole('checkbox', { name: ANALYTICS_LABEL })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: CRASH_LABEL })).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe('true');
    expect(localStorage.getItem(CRASH_REPORTS_CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('revokes one toggle from Privacy Settings without touching the other, then tells listeners', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    localStorage.setItem(CRASH_REPORTS_CONSENT_STORAGE_KEY, 'true');
    const flagsWhenResolved: Array<[string | null, string | null]> = [];
    const onResolved = () =>
      flagsWhenResolved.push([
        localStorage.getItem(CRASH_REPORTS_CONSENT_STORAGE_KEY),
        localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
      ]);
    window.addEventListener(CONSENT_RESOLVED_EVENT, onResolved);

    try {
      renderConsentModal();
      act(() => {
        window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
      });

      expect(screen.getByRole('checkbox', { name: CRASH_LABEL })).toBeChecked();
      fireEvent.click(screen.getByRole('checkbox', { name: CRASH_LABEL }));
      fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

      // The keys are written before the event, so Sentry/PostHog read the new choice.
      expect(flagsWhenResolved).toEqual([[null, 'true']]);
      expect(screen.queryByTestId('consent-tray')).not.toBeInTheDocument();
    } finally {
      window.removeEventListener(CONSENT_RESOLVED_EVENT, onResolved);
    }
  });

  it('stores nutrition lookup consent separately when explicitly enabled', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Third-party food search/i }));
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(NUTRITION_LOOKUP_CONSENT_STORAGE_KEY)).toBe('true');
  });

  it('does not close when the sheet requests dismissal before baseline consent', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId('sheet-dismiss'));

    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('does not close from Escape before baseline consent', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId('sheet-escape'));

    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('does not close from outside pointer or interaction before baseline consent', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId('sheet-pointer-outside'));
    fireEvent.click(screen.getByTestId('sheet-interact-outside'));

    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('does not render a close button loophole', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByRole('button', { name: /^close$/i })).not.toBeInTheDocument();
  });

  it('keeps terms and privacy links from storing consent or dismissing the tray', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('link', { name: /Terms of Service/i }));
    fireEvent.click(screen.getByRole('link', { name: /Privacy Policy/i }));

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
  });

  it('opens again when the app requests consent explicitly', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, new Date().toISOString());
    renderConsentModal();

    act(() => {
      window.dispatchEvent(new Event(CONSENT_REQUEST_EVENT));
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByTestId('consent-tray')).toBeInTheDocument();
  });

  it('uses the rounded bottom-tray surface styling instead of the old centered modal shell', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const tray = screen.getByTestId('consent-tray');
    expect(tray).toHaveAttribute('data-surface', 'consent-tray');
    expect(tray.className).toContain('rounded-[2rem]');
    expect(tray.className).toContain('max-w-[46rem]');
  });
});
