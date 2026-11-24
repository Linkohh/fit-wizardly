import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@/lib/i18n';
import { EXERCISE_DATABASE } from '@/test/fixtures/exercises';
import type { WorkoutDay } from '@/types/fitness';
import { WorkoutDayCard } from './WorkoutDayCard';

const bench = EXERCISE_DATABASE.find((exercise) => exercise.id === 'barbell_bench_press');

function buildDay(): WorkoutDay {
  if (!bench) throw new Error('fixture exercise barbell_bench_press is missing');
  return {
    dayIndex: 0,
    name: 'Full Body A',
    focusTags: ['full_body'],
    estimatedDuration: 12,
    exercises: [
      { exercise: bench, sets: 4, reps: '6-12', rir: 2, tempo: '2-0-2', restSeconds: 90, rationale: 'Test' },
    ],
  };
}

describe('WorkoutDayCard', () => {
  it('shows real numbers for sets, reps, RIR and rest, never a {{placeholder}}', () => {
    const { container } = render(<WorkoutDayCard day={buildDay()} planId="plan_test" onSwap={vi.fn()} />, {
      wrapper: MemoryRouter,
    });

    expect(screen.getByText('4 sets')).toBeInTheDocument();
    expect(screen.getByText('6-12 reps')).toBeInTheDocument();
    expect(screen.getByText('RIR 2')).toBeInTheDocument();
    expect(screen.getByText('90s rest')).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/\{\{/);
  });
});
