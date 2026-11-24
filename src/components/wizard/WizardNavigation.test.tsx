import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/lib/i18n';
import { WizardNavigation } from './WizardNavigation';

function renderNavigation(onStartOver = vi.fn()) {
  render(
    <WizardNavigation
      canGoBack
      canGoForward
      isLastStep={false}
      onBack={vi.fn()}
      onNext={vi.fn()}
      onStartOver={onStartOver}
    />,
  );
  return onStartOver;
}

describe('WizardNavigation Start Over dialog', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('shows the English dialog and resets on confirm', () => {
    const onStartOver = renderNavigation();

    fireEvent.click(screen.getByRole('button', { name: 'Start Over' }));
    expect(screen.getByRole('alertdialog', { name: 'Start Over?' })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Are you sure you want to continue?');

    fireEvent.click(screen.getByRole('button', { name: 'Yes, Start Over' }));
    expect(onStartOver).toHaveBeenCalledTimes(1);
  });

  it('is translated, not hardcoded English', async () => {
    await i18n.changeLanguage('es');
    renderNavigation();

    fireEvent.click(screen.getByRole('button', { name: 'Empezar de nuevo' }));
    expect(screen.getByRole('alertdialog', { name: '¿Empezar de nuevo?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí, empezar de nuevo' })).toBeInTheDocument();
  });
});
