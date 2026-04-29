import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentModal } from './ConsentModal';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  CONSENT_REQUEST_EVENT,
  CONSENT_STORAGE_KEY,
  NUTRITION_LOOKUP_CONSENT_STORAGE_KEY,
} from '@/lib/consent';

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
    onEscapeKeyDown: _onEscapeKeyDown,
    onInteractOutside: _onInteractOutside,
    onPointerDownOutside: _onPointerDownOutside,
    showCloseButton: _showCloseButton,
    ...props
  }: React.HTMLAttributes<HTMLElement> & {
    enableBlur?: boolean;
    onEscapeKeyDown?: (event: Event) => void;
    onInteractOutside?: (event: Event) => void;
    onPointerDownOutside?: (event: Event) => void;
    showCloseButton?: boolean;
  }) => {
    const { open } = React.useContext(SheetContext);

    if (!open) {
      return null;
    }

    return (
      <section data-testid="consent-tray" className={className} {...props}>
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
    useAnalyticsStore.setState({ hasConsented: false });
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

  it('stores consent, opts out of analytics by default, and closes the tray', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeTruthy();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull();
    expect(useAnalyticsStore.getState().hasConsented).toBe(false);
    expect(screen.queryByTestId('consent-tray')).not.toBeInTheDocument();
  });

  it('respects analytics opt-in when explicitly enabled', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /Help improve FitWizard/i }));
    fireEvent.click(screen.getByRole('button', { name: /I Agree & Continue/i }));

    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeTruthy();
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe('true');
    expect(useAnalyticsStore.getState().hasConsented).toBe(true);
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

  it('closes when the sheet requests dismissal', () => {
    renderConsentModal();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    fireEvent.click(screen.getByTestId('sheet-dismiss'));

    expect(screen.queryByTestId('consent-tray')).not.toBeInTheDocument();
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
