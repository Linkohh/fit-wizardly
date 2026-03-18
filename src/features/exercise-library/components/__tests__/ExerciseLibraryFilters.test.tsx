import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExerciseLibraryFilters } from '../ExerciseLibraryFilters';

describe('ExerciseLibraryFilters', () => {
  it('uses the responsive filter-grid contract and exposes accessible filter controls', () => {
    render(
      <ExerciseLibraryFilters
        filters={{
          search: '',
          category: 'all',
          muscle: 'all',
          equipment: 'all',
        }}
        categories={[{ value: 'strength', label: 'Strength' }]}
        muscles={[{ value: 'chest', label: 'Chest' }]}
        equipment={[{ value: 'barbell', label: 'Barbell' }]}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByTestId('exercise-library-filters-grid')).toHaveClass(
      'sm:grid-cols-2',
      'xl:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]'
    );
    expect(screen.getByRole('textbox', { name: /search exercise library/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by category/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by muscle/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by equipment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear exercise library filters/i })).toHaveClass(
      'sm:col-span-2'
    );
  });
});
