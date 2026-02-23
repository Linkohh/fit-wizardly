import { describe, expect, it } from 'vitest';
import { formatIdentifierLabel } from '@/lib/displayText';

describe('formatIdentifierLabel', () => {
  it('formats snake_case values to title case', () => {
    expect(formatIdentifierLabel('push_pull_legs')).toBe('Push Pull Legs');
    expect(formatIdentifierLabel('pre_workout')).toBe('Pre Workout');
  });

  it('normalizes repeated separators and whitespace', () => {
    expect(formatIdentifierLabel('front__deltoid---focus')).toBe('Front Deltoid Focus');
    expect(formatIdentifierLabel('  upper___lower  ')).toBe('Upper Lower');
  });

  it('keeps already-normal labels stable with title case output', () => {
    expect(formatIdentifierLabel('Strength Program')).toBe('Strength Program');
    expect(formatIdentifierLabel('FULL BODY')).toBe('Full Body');
  });
});
