import { describe, expect, it } from 'vitest';
import { SCULPT_DEFAULT, getGhostOpacity, getSculptStyle } from './sculpt';

describe('getSculptStyle', () => {
  it('exposes a default of 60', () => {
    expect(SCULPT_DEFAULT).toBe(60);
  });

  it('returns the soft end at level 0', () => {
    const s = getSculptStyle(0);
    expect(s.fillOpacity).toBeCloseTo(0.12);
    expect(s.edgeOpacity).toBeCloseTo(0);
    expect(s.shadingOpacity).toBeCloseTo(0);
    expect(s.outlineOpacity).toBeCloseTo(1);
  });

  it('interpolates linearly at level 60', () => {
    const s = getSculptStyle(60);
    expect(s.fillOpacity).toBeCloseTo(0.12 + 0.48 * 0.6);
    expect(s.edgeOpacity).toBeCloseTo(0.48);
    expect(s.shadingOpacity).toBeCloseTo(0.6);
    expect(s.outlineOpacity).toBeCloseTo(1 - 0.45 * 0.6);
  });

  it('returns the defined end at level 100', () => {
    const s = getSculptStyle(100);
    expect(s.fillOpacity).toBeCloseTo(0.6);
    expect(s.edgeOpacity).toBeCloseTo(0.8);
    expect(s.shadingOpacity).toBeCloseTo(1);
    expect(s.outlineOpacity).toBeCloseTo(0.55);
  });

  it('clamps out-of-range levels', () => {
    expect(getSculptStyle(-5)).toEqual(getSculptStyle(0));
    expect(getSculptStyle(250)).toEqual(getSculptStyle(100));
  });
});

describe('getGhostOpacity', () => {
  it('follows the sculpt level so the receded layer never looks switched off', () => {
    expect(getGhostOpacity(false, getSculptStyle(0))).toBeCloseTo(0.12 * 0.35);
    expect(getGhostOpacity(false, getSculptStyle(100))).toBeCloseTo(0.6 * 0.35);
  });

  it('always stays clearly below the active layer', () => {
    for (const level of [0, 25, 50, 75, 100]) {
      const sculpt = getSculptStyle(level);
      expect(getGhostOpacity(false, sculpt)).toBeLessThan(sculpt.fillOpacity * 0.6);
    }
  });

  it('keeps a selected or highlighted ghost readable at any level', () => {
    expect(getGhostOpacity(true, getSculptStyle(0))).toBe(0.45);
    expect(getGhostOpacity(true, getSculptStyle(100))).toBe(0.45);
  });
});
