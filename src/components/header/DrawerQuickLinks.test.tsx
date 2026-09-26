import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { markAboutSeen } from '@/lib/aboutSeen';
import { DrawerQuickLinks } from './DrawerQuickLinks';

describe('DrawerQuickLinks', () => {
  afterEach(() => {
    window.localStorage.removeItem('fitwizard-about-seen');
  });

  it('links to About, Help and Legal and closes the drawer on navigation', () => {
    const onNavigate = vi.fn();
    render(<DrawerQuickLinks onNavigate={onNavigate} />, { wrapper: MemoryRouter });

    expect(screen.getByRole('link', { name: /About/ })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/guide');
    expect(screen.getByRole('link', { name: 'Legal' })).toHaveAttribute('href', '/legal');

    fireEvent.click(screen.getByRole('link', { name: 'Help' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('shows the "New" hint beside About until the About page has been seen', () => {
    const { unmount } = render(<DrawerQuickLinks onNavigate={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.getByTestId('quick-links-about-new')).toBeInTheDocument();
    unmount();

    markAboutSeen();
    render(<DrawerQuickLinks onNavigate={vi.fn()} />, { wrapper: MemoryRouter });
    expect(screen.queryByTestId('quick-links-about-new')).not.toBeInTheDocument();
  });
});
