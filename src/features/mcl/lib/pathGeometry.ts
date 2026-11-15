/**
 * Minimal SVG path geometry for the muscle map's own path data.
 *
 * Supports only the absolute commands used by `data/muscles.ts` and the side
 * silhouette: M (move), L (line), C (cubic Bézier) and Z (close). Anything else
 * throws, so a new command in the data fails loudly instead of being misread.
 */

export type Point = { x: number; y: number };

type Segment =
  | { cmd: 'M' | 'L'; to: Point }
  | { cmd: 'C'; c1: Point; c2: Point; to: Point }
  | { cmd: 'Z' };

const ARITY: Record<'M' | 'L' | 'C' | 'Z', number> = { M: 2, L: 2, C: 6, Z: 0 };

const parsePath = (d: string): Segment[] => {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const segments: Segment[] = [];
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i];
    if (!(cmd in ARITY)) {
      throw new Error(`Unsupported path command "${cmd}" in "${d}" (only M, L, C, Z)`);
    }
    const arity = ARITY[cmd as keyof typeof ARITY];
    const nums: number[] = [];
    i += 1;
    while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
      nums.push(Number(tokens[i]));
      i += 1;
    }
    if (nums.length !== arity) {
      throw new Error(`Path command "${cmd}" expects ${arity} numbers, got ${nums.length} in "${d}"`);
    }

    if (cmd === 'Z') segments.push({ cmd: 'Z' });
    else if (cmd === 'C') {
      segments.push({
        cmd: 'C',
        c1: { x: nums[0], y: nums[1] },
        c2: { x: nums[2], y: nums[3] },
        to: { x: nums[4], y: nums[5] },
      });
    } else segments.push({ cmd: cmd as 'M' | 'L', to: { x: nums[0], y: nums[1] } });
  }

  return segments;
};

/** Endpoint of every M, L and C segment, in order (control points excluded). */
export const getAnchorPoints = (d: string): Point[] =>
  parsePath(d).flatMap((s) => (s.cmd === 'Z' ? [] : [s.to]));

const cubicAt = (p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + e * p3.x,
    y: a * p0.y + b * c1.y + c * c2.y + e * p3.y,
  };
};

/**
 * Polyline approximation of the path: line endpoints as-is, each curve sampled
 * at `stepsPerCurve` evenly spaced t values (the last being its endpoint).
 */
export const flattenPath = (d: string, stepsPerCurve = 8): Point[] => {
  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };

  for (const s of parsePath(d)) {
    if (s.cmd === 'Z') continue;
    if (s.cmd === 'C') {
      for (let step = 1; step <= stepsPerCurve; step += 1) {
        points.push(
          step === stepsPerCurve ? s.to : cubicAt(current, s.c1, s.c2, s.to, step / stepsPerCurve),
        );
      }
    } else {
      points.push(s.to);
    }
    current = s.to;
  }

  return points;
};

/** Even-odd ray-casting test; the polygon is treated as closed. */
export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y)) {
      const xCross = a.x + ((point.y - a.y) / (b.y - a.y)) * (b.x - a.x);
      if (point.x < xCross) inside = !inside;
    }
  }
  return inside;
};
