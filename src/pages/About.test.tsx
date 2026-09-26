import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import en from '@/locales/en.json';
import AboutPage from './About';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// jsdom has no IntersectionObserver; report every element as visible so in-view reveals run.
class VisibleIntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, intersectionRatio: 1, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function renderAbout() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <AboutPage />
    </MemoryRouter>
  );
}

describe('AboutPage', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', VisibleIntersectionObserver);
  });

  it('renders the hero, version and every section with translated copy', () => {
    renderAbout();

    expect(screen.getByRole('heading', { level: 1, name: en.about.title })).toBeInTheDocument();
    expect(screen.getByText('Version 0.0.0-test')).toBeInTheDocument();

    for (const title of [
      en.about.story.title,
      en.about.creator.title,
      en.about.mission.title,
      en.about.credits.title,
    ]) {
      expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
    }

    // No untranslated i18n keys leak into the page.
    expect(document.body.textContent).not.toMatch(/about\.[a-z_]+\.[a-z_]+/);
    // No draft placeholders like "[Your Name]" ship to users.
    expect(document.body.textContent).not.toMatch(/\[[^\]]+\]/);
  });

  it('shows the creator photo and a big call to action into the plan wizard', () => {
    renderAbout();

    expect(screen.getByRole('img', { name: en.about.creator.avatar_alt })).toHaveAttribute('src', '/creator-avatar.jpg');
    expect(screen.getByRole('heading', { name: en.about.cta.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.about.cta.button })).toHaveAttribute('href', '/wizard');
  });

  it('links to the guide and legal pages', () => {
    renderAbout();

    expect(screen.getByRole('link', { name: en.about.closing.guide })).toHaveAttribute('href', '/guide');
    expect(screen.getByRole('link', { name: en.about.closing.legal })).toHaveAttribute('href', '/legal');
  });

  it('keeps at most one mission principle expanded at a time', () => {
    renderAbout();
    const mission = screen.getByRole('region', { name: en.about.mission.title });
    expect(within(mission).getAllByRole('button')).toHaveLength(4);
    const clarity = within(mission).getByRole('button', { name: new RegExp(en.about.mission.clarity_title) });
    const together = within(mission).getByRole('button', { name: new RegExp(en.about.mission.together_title) });

    fireEvent.click(clarity);
    expect(clarity).toHaveAttribute('aria-expanded', 'true');
    expect(within(mission).getByText(en.about.mission.clarity_body)).toBeInTheDocument();

    fireEvent.click(together);
    expect(together).toHaveAttribute('aria-expanded', 'true');
    expect(clarity).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(together);
    expect(together).toHaveAttribute('aria-expanded', 'false');
  });

  it('flips the creator card to reveal the personal fact', () => {
    renderAbout();
    const creator = screen.getByRole('region', { name: en.about.creator.title });
    const card = within(creator).getByRole('button');

    expect(card).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
