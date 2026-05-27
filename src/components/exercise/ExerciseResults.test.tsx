import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExerciseResults } from './ExerciseResults';

describe('ExerciseResults', () => {
  it('labels API Ninjas fallback results consistently', () => {
    render(
      <ExerciseResults
        exercises={[
          {
            id: 'api-ninjas:dumbbell-press',
            name: 'Dumbbell Press',
            targetMuscles: ['shoulders'],
            equipment: ['dumbbell'],
            difficulty: 'intermediate',
            source: 'api-ninjas',
          },
        ]}
      />
    );

    expect(screen.getByText('API Ninjas')).toBeInTheDocument();
  });
});
