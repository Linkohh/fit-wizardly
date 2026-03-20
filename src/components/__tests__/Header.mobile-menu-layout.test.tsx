import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/Header';

const mocks = vi.hoisted(() => ({
  setMode: vi.fn(),
  toggleTrainerMode: vi.fn(),
  requestPermission: vi.fn(async () => ({
    available: true,
    permission: 'granted' as const,
    source: 'web' as const,
  })),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/platform', () => ({
  isNativeApp: () => false,
}));

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({
    mode: 'dark',
    setMode: mocks.setMode,
  }),
}));

vi.mock('@/hooks/useUserPreferences', () => ({
  usePreferencesStore: (selector: (state: { settings: { motionTilt?: boolean } }) => unknown) =>
    selector({
      settings: {
        motionTilt: true,
      },
    }),
}));

vi.mock('@/hooks/use-motion-preferences', () => ({
  useMotionPreferences: () => ({
    shouldReduceMotion: false,
    prefersReducedMotion: false,
    reducedMotionEnabled: false,
  }),
}));

vi.mock('@/hooks/use-motion-tilt-status', () => ({
  useMotionTiltStatus: () => ({
    status: {
      available: true,
      permission: 'prompt',
      source: 'web',
    },
    isRefreshing: false,
    isRequestingPermission: false,
    refreshStatus: vi.fn(),
    requestPermission: mocks.requestPermission,
  }),
}));

vi.mock('@/stores/trainerStore', () => {
  const useTrainerStore = Object.assign(
    () => ({
      isTrainerMode: true,
    }),
    {
      getState: () => ({
        toggleTrainerMode: mocks.toggleTrainerMode,
      }),
    },
  );

  return { useTrainerStore };
});

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

  const SheetTrigger = ({ children }: { children: React.ReactNode }) => {
    const { onOpenChange } = React.useContext(SheetContext);
    return (
      <div data-testid="sheet-trigger" onClick={() => onOpenChange?.(true)}>
        {children}
      </div>
    );
  };

  const SheetContent = ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    const { open } = React.useContext(SheetContext);
    if (!open) return null;
    return (
      <div data-testid="mobile-sheet-content" className={className}>
        {children}
      </div>
    );
  };

  return {
    Sheet,
    SheetTrigger,
    SheetContent,
  };
});

describe('Header mobile menu layout', () => {
  it('tags the brand logo and menu trigger with explicit mobile feedback events', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('FitWizard Logo').closest('a')).toHaveAttribute(
      'data-click-feedback-event',
      'brandHome',
    );
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute(
      'data-click-feedback-event',
      'navigation',
    );
  });

  it('applies viewport-safe sheet sizing and makes the mobile menu scrollable', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    const sheetContent = screen.getByTestId('mobile-sheet-content');
    expect(sheetContent).toHaveClass('flex', 'flex-col', 'overflow-hidden');
    expect(sheetContent.className).toContain('h-[100svh]');
    expect(sheetContent.className).toContain('supports-[height:100dvh]:h-[100dvh]');
    expect(sheetContent.className).toContain('max-h-[100dvh]');
    expect(sheetContent.className).toContain('pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]');

    const mobileNav = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(mobileNav).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto', 'overscroll-contain');

    expect(within(sheetContent).getByText('nav.clients')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Motion Tilt')).toBeInTheDocument();
    expect(within(sheetContent).getByText('Tap to enable motion tilt')).toBeInTheDocument();
    expect(within(sheetContent).queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    fireEvent.click(within(sheetContent).getByRole('button', { name: 'Enable' }));
    expect(mocks.requestPermission).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });
});
