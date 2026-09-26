import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/lib/i18n';
import en from '@/locales/en.json';
import LegalPage from './Legal';

function renderLegalAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <LegalPage />
    </MemoryRouter>
  );
}

describe('LegalPage tab deep links', () => {
  it.each([
    ['/legal?tab=privacy', en.legal.tabs.privacy],
    ['/legal?tab=terms', en.legal.tabs.terms],
    ['/legal?tab=disclaimer', en.legal.tabs.medical],
    ['/legal', en.legal.tabs.medical],
    ['/legal?tab=unknown', en.legal.tabs.medical],
  ])('%s selects the "%s" tab', (url, expectedTab) => {
    renderLegalAt(url);
    expect(screen.getByRole('tab', { name: expectedTab })).toHaveAttribute('aria-selected', 'true');
  });
});
