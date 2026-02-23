import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/Header';

const mocks = vi.hoisted(() => ({
  setMode: vi.fn(),
  toggleTrainerMode: vi.fn(),
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
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });
});
