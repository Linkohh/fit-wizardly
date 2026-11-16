import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SelectionSidebar from './SelectionSidebar';
import { getMuscleById } from '../../../data/muscles';

const selectedMuscles = [getMuscleById('biceps-left')!, getMuscleById('pectoralis-major-left')!];

function renderSidebar(props: Partial<React.ComponentProps<typeof SelectionSidebar>> = {}) {
  render(
    <SelectionSidebar
      selectedMuscles={selectedMuscles}
      onRemoveMuscle={vi.fn()}
      onClearAll={vi.fn()}
      onViewInfo={vi.fn()}
      reduceMotion
      {...props}
    />
  );
  return {
    root: screen.getByTestId('muscle-selector-inline-sidebar'),
    list: screen.getByTestId('muscle-selector-selected-list'),
    actions: screen.getByRole('button', { name: 'Remove Biceps (Left)' }).parentElement!,
  };
}

describe('SelectionSidebar', () => {
  it('scrolls inside a fixed height and reveals row buttons on hover by default', () => {
    const { root, list, actions } = renderSidebar();

    expect(root).toHaveClass('h-full');
    expect(list).toHaveClass('flex-1', 'overflow-y-auto');
    expect(actions).toHaveClass('opacity-0', 'group-hover:opacity-100');
  });

  it('grows to fit the list in the flow layout, capped for very large selections', () => {
    const { root, list } = renderSidebar({ flow: true });

    expect(root).toHaveClass('h-auto');
    expect(list).not.toHaveClass('flex-1');
    expect(list).toHaveClass('max-h-[min(70vh,560px)]', 'overflow-y-auto');
  });

  it('keeps the info and remove buttons visible for touch', () => {
    const { actions } = renderSidebar({ touchActions: true });

    expect(actions).toHaveClass('opacity-100');
    expect(screen.getByRole('button', { name: 'View info for Biceps (Left)' })).toBeInTheDocument();
  });

  it('has no dead "View Exercises" button', () => {
    renderSidebar();

    expect(screen.queryByRole('button', { name: /view exercises/i })).not.toBeInTheDocument();
  });
});
