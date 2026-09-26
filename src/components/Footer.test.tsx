import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/lib/i18n';
import { Footer } from './Footer';

describe('Footer', () => {
  it('shows five links, with each legal link deep-linked to its tab', () => {
    render(<Footer />, { wrapper: MemoryRouter });

    const links = screen.getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['About', '/about'],
      ['Guide', '/guide'],
      ['Privacy', '/legal?tab=privacy'],
      ['Terms', '/legal?tab=terms'],
      ['Disclaimer', '/legal?tab=disclaimer'],
    ]);
  });

  it('renders a single copyright line that mentions the brand once', () => {
    const { container } = render(<Footer />, { wrapper: MemoryRouter });
    const text = container.textContent ?? '';

    expect(text.match(/©/g)).toHaveLength(1);
    expect(text.match(/FitWizard/g)).toHaveLength(1);
    expect(screen.getByText(`© ${new Date().getFullYear()} FitWizard`)).toBeInTheDocument();
  });

  it('uses a heartbeat on the heart instead of the old opacity pulse', () => {
    const { container } = render(<Footer />, { wrapper: MemoryRouter });
    expect(container.querySelector('.animate-pulse')).toBeNull();
    expect(screen.getByTestId('footer-heart')).toBeInTheDocument();
  });
});
