import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getMuscleById } from '../../../data/muscles';
import { InfoPanel } from './InfoPanel';

function DetailsFixture() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div data-testid="clipped-selector" className="overflow-hidden">
      <InfoPanel
        muscle={getMuscleById('pectoralis-major-left') ?? null}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMuscleClick={vi.fn()}
        reduceMotion
      />
    </div>
  );
}

describe('InfoPanel', () => {
  it('portals the details outside the selector and keeps close outside the scroll area', () => {
    render(<DetailsFixture />);

    const dialog = screen.getByRole('dialog', { name: 'Pectoralis Major (Left)' });
    const close = within(dialog).getByRole('button', { name: 'Close panel' });
    const scrollArea = dialog.querySelector('.overflow-y-auto');

    expect(screen.getByTestId('clipped-selector')).not.toContainElement(dialog);
    expect(scrollArea).toContainElement(within(dialog).getByRole('heading', { name: 'Function' }));
    expect(scrollArea).not.toContainElement(close);
    expect(close).toHaveClass('min-h-[44px]', 'min-w-[44px]');

    fireEvent.click(close);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
