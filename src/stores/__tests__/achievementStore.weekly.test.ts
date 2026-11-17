import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeekStart, useAchievementStore } from '@/stores/achievementStore';

describe('getWeekStart', () => {
  it('returns the Monday of the week in local time', () => {
    expect(getWeekStart(new Date(2026, 10, 17))).toBe('2026-11-16'); // Tuesday
    expect(getWeekStart(new Date(2026, 10, 16))).toBe('2026-11-16'); // Monday
    expect(getWeekStart(new Date(2026, 10, 22))).toBe('2026-11-16'); // Sunday
    expect(getWeekStart(new Date(2026, 10, 23))).toBe('2026-11-23'); // next Monday
  });
});

describe('weekly goal counting', () => {
  beforeEach(() => {
    useAchievementStore.setState({
      totalPlansGenerated: 0,
      weeklyProgress: 0,
      weekStart: null,
      weeklyGoal: 5,
      unlockedBadges: [],
      newBadges: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts finished workouts', () => {
    useAchievementStore.getState().incrementWeeklyProgress();
    useAchievementStore.getState().incrementWeeklyProgress();

    expect(useAchievementStore.getState().weeklyProgress).toBe(2);
  });

  it('does not count generated plans toward the weekly goal', () => {
    const unlocked = useAchievementStore.getState().incrementPlansGenerated();

    expect(unlocked).toEqual(['first_plan']);
    expect(useAchievementStore.getState().totalPlansGenerated).toBe(1);
    expect(useAchievementStore.getState().weeklyProgress).toBe(0);
  });

  it('starts from zero when a new week begins', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 20, 12)); // Friday
    useAchievementStore.getState().incrementWeeklyProgress();
    useAchievementStore.getState().incrementWeeklyProgress();
    expect(useAchievementStore.getState().weeklyProgress).toBe(2);

    vi.setSystemTime(new Date(2026, 10, 24, 12)); // next Tuesday
    useAchievementStore.getState().rollWeekIfNeeded();
    expect(useAchievementStore.getState().weeklyProgress).toBe(0);

    useAchievementStore.getState().incrementWeeklyProgress();
    expect(useAchievementStore.getState().weeklyProgress).toBe(1);
    expect(useAchievementStore.getState().weekStart).toBe('2026-11-23');
  });

  it('keeps the count within the same week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 17, 9));
    useAchievementStore.getState().incrementWeeklyProgress();

    vi.setSystemTime(new Date(2026, 10, 22, 20)); // Sunday, same week
    useAchievementStore.getState().rollWeekIfNeeded();

    expect(useAchievementStore.getState().weeklyProgress).toBe(1);
  });
});
