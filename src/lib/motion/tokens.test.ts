import { describe, expect, it } from 'vitest';
import {
  MOTION_DURATIONS,
  MOTION_SPRINGS,
  getDuration,
  getSpringTransition,
  getTimedTransition,
} from './tokens';

describe('motion tokens', () => {
  it('uses configured duration values when motion is enabled', () => {
    expect(getDuration('fast', false)).toBe(MOTION_DURATIONS.fast);
    expect(getDuration('base', false)).toBe(MOTION_DURATIONS.base);
    expect(getDuration('slow', false)).toBe(MOTION_DURATIONS.slow);
  });

  it('returns instant duration when reduced motion is enabled', () => {
    expect(getDuration('fast', true)).toBe(0);
    expect(getTimedTransition('slow', true)).toEqual({
      duration: 0,
      ease: [0.4, 0, 0.2, 1],
    });
  });

  it('returns snappy spring config when reduced motion is disabled', () => {
    expect(getSpringTransition('snappy', false)).toEqual(MOTION_SPRINGS.snappy);
  });
});
