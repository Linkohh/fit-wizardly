import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { useNutritionStore } from '@/stores/nutritionStore';
import type { ActiveWorkout } from '@/stores/planStore.types';
import type { MealEntry } from '@/types/nutrition';
import { ANALYTICS_CONSENT_STORAGE_KEY } from '@/lib/consent';
import { usePageViews } from './usePageViews';

const mocks = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock('@/lib/analytics/track', () => ({ track: mocks.track }));

describe('analytics event wiring', () => {
  beforeEach(() => {
    mocks.track.mockClear();
  });

  it('sends workout_completed with only counts and duration', () => {
    const activeWorkout: ActiveWorkout = {
      planId: 'plan-1',
      dayIndex: 0,
      dayName: 'Push',
      startedAt: new Date(Date.now() - 30 * 60000),
      exercises: [
        {
          exerciseId: 'bench',
          exerciseName: 'Bench press',
          sets: [{ setNumber: 1, weight: 100, weightUnit: 'kg', reps: 5, rir: 2, completed: true }],
          skipped: false,
        },
      ],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restTimerEndTime: null,
    };
    usePlanStore.setState({ activeWorkout });

    usePlanStore.getState().completeWorkout('just_right');

    expect(mocks.track).toHaveBeenCalledWith('workout_completed', { exercise_count: 1, duration_min: 30 });
  });

  it('sends meal_logged with no meal details', () => {
    const meal = { id: 'm1', name: 'Oats', calories: 300 } as unknown as MealEntry;

    useNutritionStore.getState().logMeal(meal);

    expect(mocks.track).toHaveBeenCalledWith('meal_logged');
  });

  it('sends one $pageview per route change once consented', () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'true');
    let go: ((path: string) => void) | null = null;
    function Probe() {
      usePageViews();
      const navigate = useNavigate();
      useEffect(() => {
        go = navigate;
      }, [navigate]);
      return null;
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    );
    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith('$pageview');

    act(() => go?.('/plan'));
    act(() => go?.('/plan?tab=week'));

    expect(mocks.track).toHaveBeenCalledTimes(2);
    localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  });
});
