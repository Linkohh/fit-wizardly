import { describe, it, expect } from 'vitest';
import { getMusclesByView, muscles } from './muscles';
import { SIDE_SILHOUETTE_PATH } from '../components/MuscleSelector/svg/sideOutline';
import { flattenPath, getAnchorPoints, isPointInPolygon, type Point } from '../lib/pathGeometry';
import { SIDE_ORDER } from '../lib/sortMuscles';

const silhouette = flattenPath(SIDE_SILHOUETTE_PATH);

/** Width of the silhouette polygon along the horizontal line at y. */
const widthAt = (polygon: Point[], y: number): number => {
  const xs: number[] = [];
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[j];
    const b = polygon[i];
    if ((a.y > y) !== (b.y > y)) {
      xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
  }
  return xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
};

describe('side silhouette', () => {
  it('silhouette is closed and spans the landmark box', () => {
    expect(SIDE_SILHOUETTE_PATH.trim().endsWith('Z')).toBe(true);
    const xs = silhouette.map((p) => p.x);
    const ys = silhouette.map((p) => p.y);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(60);
    expect(Math.max(...xs)).toBeLessThanOrEqual(140);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...ys)).toBeLessThanOrEqual(440);
    expect(widthAt(silhouette, 110)).toBeGreaterThanOrEqual(50);
  });
});

describe('side muscles sit inside the silhouette', () => {
  it.each(getMusclesByView('side'))('$id sits inside the silhouette', (muscle) => {
    const anchors = getAnchorPoints(muscle.paths.side ?? '');
    expect(anchors.length).toBeGreaterThan(0);
    const inside = anchors.filter((p) => isPointInPolygon(p, silhouette)).length;
    expect(inside / anchors.length).toBeGreaterThanOrEqual(0.9);
  });
});

describe('side muscle coverage and layers', () => {
  const sideMuscles = getMusclesByView('side');

  it('has 22 surface and 7 deep side muscles', () => {
    expect(sideMuscles.filter((m) => m.layer !== 'deep')).toHaveLength(22);
    expect(sideMuscles.filter((m) => m.layer === 'deep')).toHaveLength(7);
  });

  it('every side muscle declares a sideOrder from SIDE_ORDER', () => {
    const allowed: number[] = Object.values(SIDE_ORDER);
    for (const muscle of sideMuscles) {
      expect(allowed, muscle.id).toContain(muscle.sideOrder);
    }
  });

  it('no side path is made only of M/L/Z commands', () => {
    for (const muscle of sideMuscles) {
      expect(muscle.paths.side ?? '', muscle.id).toMatch(/C/);
      expect(muscle.paths.side ?? '', muscle.id).not.toMatch(/L/);
    }
  });

  it('deep layer is the 13 original ids plus the front and back deep muscles', () => {
    const paired = [
      'rhomboid', 'infraspinatus', 'teres-major', 'brachialis', 'soleus', 'gluteus-medius',
      // front and back deep layer (see deepAnatomy.test.ts)
      'pectoralis-minor', 'subscapularis', 'iliopsoas', 'vastus-intermedius',
      'supraspinatus', 'teres-minor', 'gluteus-minimus', 'semimembranosus', 'plantaris',
    ];
    const single = ['erector-spinae', 'transverse-abdominis'];
    const expected = [...paired.flatMap((id) => [`${id}-left`, `${id}-right`]), ...single].sort();
    const deep = muscles.filter((m) => m.layer === 'deep').map((m) => m.id).sort();
    expect(deep).toEqual(expected);
  });
});
