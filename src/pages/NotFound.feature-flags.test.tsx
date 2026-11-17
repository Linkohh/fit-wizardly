import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NotFound from './NotFound';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>,
  );
}

describe('NotFound feature flags', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the Circles link when circles is off', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'false');

    renderNotFound();

    expect(screen.getByRole('link', { name: 'notfound.create_plan' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'nav.circles' })).not.toBeInTheDocument();
  });

  it('shows the Circles link when circles is on', () => {
    vi.stubEnv('VITE_FEATURE_CIRCLES', 'true');

    renderNotFound();

    expect(screen.getByRole('link', { name: 'nav.circles' })).toHaveAttribute('href', '/circles');
  });
});
