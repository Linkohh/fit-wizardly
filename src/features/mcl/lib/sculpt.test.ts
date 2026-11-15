import { describe, expect, it } from 'vitest';
import { SCULPT_DEFAULT, getSculptStyle } from './sculpt';

describe('getSculptStyle', () => {
  it('exposes a default of 60', () => {
    expect(SCULPT_DEFAULT).toBe(60);
  });

  it('returns the soft end at level 0', () => {
    const s = getSculptStyle(0);
    expect(s.fillOpacity).toBeCloseTo(0.12);
    expect(s.edgeOpacity).toBeCloseTo(0);
    expect(s.shadingOpacity).toBeCloseTo(0);
    expect(s.outlineOpacity).toBeCloseTo(0.9);
  });

  it('interpolates linearly at level 60', () => {
    const s = getSculptStyle(60);
    expect(s.fillOpacity).toBeCloseTo(0.12 + 0.48 * 0.6);
    expect(s.edgeOpacity).toBeCloseTo(0.48);
    expect(s.shadingOpacity).toBeCloseTo(0.6);
    expect(s.outlineOpacity).toBeCloseTo(0.9 - 0.55 * 0.6);
  });

  it('returns the defined end at level 100', () => {
    const s = getSculptStyle(100);
    expect(s.fillOpacity).toBeCloseTo(0.6);
    expect(s.edgeOpacity).toBeCloseTo(0.8);
    expect(s.shadingOpacity).toBeCloseTo(1);
    expect(s.outlineOpacity).toBeCloseTo(0.35);
  });

  it('clamps out-of-range levels', () => {
    expect(getSculptStyle(-5)).toEqual(getSculptStyle(0));
    expect(getSculptStyle(250)).toEqual(getSculptStyle(100));
  });
});
