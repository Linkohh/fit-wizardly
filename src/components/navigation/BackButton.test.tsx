import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/lib/i18n';
import { BackButton } from './BackButton';

function CurrentPath() {
  return <div data-testid="path">{useLocation().pathname}</div>;
}

function renderAt(entries: string[], initialIndex: number) {
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex}>
      <Routes>
        <Route path="*" element={<BackButton />} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>
  );
}

describe('BackButton', () => {
  it('returns to the previous in-app page', () => {
    renderAt(['/profile', '/legal'], 1);

    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/profile');
  });

  it('goes home when the page was opened directly (no in-app history)', () => {
    renderAt(['/legal'], 0);

    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });
});
