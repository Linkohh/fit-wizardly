import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    ['/legal#delete-account', en.legal.tabs.privacy],
  ])('%s selects the "%s" tab', (url, expectedTab) => {
    renderLegalAt(url);
    expect(screen.getByRole('tab', { name: expectedTab })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('LegalPage account-deletion anchor (Google Play web deletion URL)', () => {
  const scrollIntoView = vi.fn();

  // jsdom has no scrollIntoView, so install a mock for these tests only.
  const original = Element.prototype.scrollIntoView;

  afterEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = original;
  });

  it('/legal?tab=privacy#delete-account scrolls to the "Delete your account" section', () => {
    Element.prototype.scrollIntoView = scrollIntoView;
    renderLegalAt('/legal?tab=privacy#delete-account');

    const heading = screen.getByRole('heading', { name: en.legal.privacy.delete_account.title });
    const section = heading.closest('section');
    expect(section).toHaveAttribute('id', 'delete-account');
    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollIntoView.mock.contexts).toContain(section);
  });

  it('explains deletion in the app, for guests and by email', () => {
    renderLegalAt('/legal?tab=privacy');
    const section = document.getElementById('delete-account');
    expect(section).not.toBeNull();
    expect(section).toHaveTextContent('Delete account');
    expect(section).toHaveTextContent('Erase data on this device');
    expect(section).toHaveTextContent('Delete my account');
  });

  it('marks the policy as a draft and drops the old "stays on your device" claim', () => {
    renderLegalAt('/legal?tab=privacy');
    expect(screen.getByText(en.legal.draft.title)).toBeInTheDocument();
    expect(screen.queryByText(/100% on your device/i)).not.toBeInTheDocument();
  });
});
