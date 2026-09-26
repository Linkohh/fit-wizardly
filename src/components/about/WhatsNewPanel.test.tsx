import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import '@/lib/i18n';
import en from '@/locales/en.json';
import { CHANGELOG } from '@/data/changelog';
import { AboutHero } from './AboutHero';
import { WhatsNewPanel } from './WhatsNewPanel';

// vitest.config.ts defines __APP_VERSION__ as '0.0.0-test', so the "current" entry is whichever matches it (none).
// These tests therefore target UI behaviour by version, not the "Current" badge.

describe('WhatsNewPanel', () => {
  afterEach(() => {
    window.localStorage.removeItem('fitwizard-changelog-seen');
  });

  it('lists every release newest first inside a titled panel', () => {
    render(<WhatsNewPanel open onOpenChange={() => undefined} />);

    const dialog = screen.getByRole('dialog', { name: en.about.whats_new.title });
    const chips = within(dialog).getAllByRole('button', { pressed: false }).concat(
      within(dialog).queryAllByRole('button', { pressed: true })
    );
    expect(chips.length).toBeGreaterThanOrEqual(CHANGELOG.length);

    const triggers = CHANGELOG.map(({ version }) =>
      within(dialog).getByRole('button', { name: new RegExp(`v${version.replace(/\./g, '\\.')}`) , expanded: false })
    );
    expect(triggers).toHaveLength(CHANGELOG.length);
  });

  it('expands a release when its version chip is picked, showing its highlights', () => {
    render(<WhatsNewPanel open onOpenChange={() => undefined} />);
    const oldest = CHANGELOG[CHANGELOG.length - 1];

    fireEvent.click(screen.getByTestId(`changelog-chip-${oldest.version}`));

    expect(screen.getByTestId(`changelog-chip-${oldest.version}`)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(oldest.highlights.new![0])).toBeInTheDocument();
  });

  it('collapses and expands a release from its row', () => {
    render(<WhatsNewPanel open onOpenChange={() => undefined} />);
    const release = CHANGELOG[1];
    const row = screen.getByRole('button', { name: new RegExp(`v${release.version.replace(/\./g, '\\.')}`), expanded: false });

    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
  });

  it('marks the notes as read when opened', () => {
    render(<WhatsNewPanel open onOpenChange={() => undefined} />);
    expect(window.localStorage.getItem('fitwizard-changelog-seen')).toBe('0.0.0-test');
  });
});

describe('About hero version pill', () => {
  afterEach(() => {
    window.localStorage.removeItem('fitwizard-changelog-seen');
  });

  it("shows an unread dot, then opens What's new and clears it", () => {
    render(<AboutHero />, { wrapper: MemoryRouter });

    expect(screen.getByTestId('about-version-unread')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('about-version-pill'));

    expect(screen.getByRole('dialog', { name: en.about.whats_new.title })).toBeInTheDocument();
    expect(screen.queryByTestId('about-version-unread')).not.toBeInTheDocument();
  });
});
