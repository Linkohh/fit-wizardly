import { describe, it, expect } from 'vitest';
import { getAnchorPoints, flattenPath, isPointInPolygon, type Point } from './pathGeometry';

const square: Point[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe('getAnchorPoints', () => {
  it('returns segment endpoints, not control points', () => {
    expect(getAnchorPoints('M10,10 C20,0 30,0 40,10 L40,30 Z')).toEqual([
      { x: 10, y: 10 },
      { x: 40, y: 10 },
      { x: 40, y: 30 },
    ]);
  });

  it('tolerates whitespace and decimals', () => {
    expect(getAnchorPoints('  M 1.5 , 2  L3,-4\nZ ')).toEqual([
      { x: 1.5, y: 2 },
      { x: 3, y: -4 },
    ]);
  });

  it('throws on unsupported commands', () => {
    expect(() => getAnchorPoints('M0,0 Q5,5 10,0')).toThrow(/Unsupported path command "Q"/);
    expect(() => getAnchorPoints('m0,0 l5,5')).toThrow(/Unsupported path command "m"/);
  });

  it('throws when a command has the wrong number of coordinates', () => {
    expect(() => getAnchorPoints('M0,0 C1,1 2,2')).toThrow(/expects 6 numbers/);
  });
});

describe('flattenPath', () => {
  it('keeps one point per line endpoint', () => {
    expect(flattenPath('M0,0 L10,0 L10,10 Z')).toHaveLength(3);
  });

  it('samples each curve into stepsPerCurve points ending on the anchor', () => {
    const pts = flattenPath('M0,0 C0,10 10,10 10,0', 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual({ x: 0, y: 0 });
    expect(pts[4]).toEqual({ x: 10, y: 0 });
    expect(pts[2].x).toBeCloseTo(5);
    expect(pts[2].y).toBeCloseTo(7.5);
  });

  it('defaults to 8 steps per curve', () => {
    expect(flattenPath('M0,0 C0,10 10,10 10,0')).toHaveLength(9);
  });
});

describe('isPointInPolygon', () => {
  it('detects points inside and outside', () => {
    expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
    expect(isPointInPolygon({ x: 5, y: -1 }, square)).toBe(false);
  });

  it('handles concave polygons', () => {
    const ell: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(isPointInPolygon({ x: 2, y: 8 }, ell)).toBe(true);
    expect(isPointInPolygon({ x: 8, y: 8 }, ell)).toBe(false);
  });
});
