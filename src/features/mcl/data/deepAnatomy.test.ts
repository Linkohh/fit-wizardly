import { describe, expect, it } from 'vitest';
import { MCL_TO_LEGACY_MAP } from '@/lib/muscleMapping';
import { getAnchorPoints } from '../lib/pathGeometry';
import { getMuscleById } from './muscles';
import { taxonomyNodes } from './taxonomy';

type DeepView = 'front' | 'back';

interface DeepSpec {
  base: string;
  node: string;
  view: DeepView;
  paired: boolean;
  /** Surface or deep shapes the new muscle must sit within (base ids). */
  hosts: string[];
}

const HOST_MARGIN = 4;
const MIRROR_AXIS = 200;

const SPECS: DeepSpec[] = [
  { base: 'pectoralis-minor', node: 'pectoralis_minor', view: 'front', paired: true, hosts: ['pectoralis-major'] },
  { base: 'subscapularis', node: 'subscapularis', view: 'front', paired: true, hosts: ['pectoralis-major', 'anterior-deltoid'] },
  { base: 'transverse-abdominis', node: 'transverse_abdominis', view: 'front', paired: false, hosts: ['rectus-abdominis', 'external-oblique'] },
  { base: 'iliopsoas', node: 'iliopsoas', view: 'front', paired: true, hosts: ['abs-lower', 'external-oblique', 'adductor', 'rectus-femoris'] },
  { base: 'vastus-intermedius', node: 'vastus_intermedius', view: 'front', paired: true, hosts: ['rectus-femoris'] },
  { base: 'supraspinatus', node: 'supraspinatus', view: 'back', paired: true, hosts: ['trapezius-upper', 'trapezius-middle'] },
  { base: 'teres-minor', node: 'teres_minor', view: 'back', paired: true, hosts: ['posterior-deltoid', 'infraspinatus', 'teres-major'] },
  { base: 'gluteus-minimus', node: 'gluteus_minimus', view: 'back', paired: true, hosts: ['gluteus-maximus', 'gluteus-medius'] },
  { base: 'semimembranosus', node: 'semimembranosus', view: 'back', paired: true, hosts: ['semitendinosus', 'biceps-femoris'] },
  { base: 'plantaris', node: 'plantaris', view: 'back', paired: true, hosts: ['gastrocnemius'] },
];

function pathOf(id: string, view: DeepView): string {
  const path = getMuscleById(id)?.paths[view];
  if (!path) throw new Error(`${id} has no ${view} path`);
  return path;
}

function hostBox(hosts: string[], side: 'left' | 'right' | null, view: DeepView) {
  const points = hosts.flatMap((host) => {
    const candidates = side ? [`${host}-${side}`, host] : [`${host}-left`, `${host}-right`, host];
    return candidates
      .filter((id) => getMuscleById(id)?.paths[view])
      .flatMap((id) => getAnchorPoints(pathOf(id, view)));
  });
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs) - HOST_MARGIN,
    maxX: Math.max(...xs) + HOST_MARGIN,
    minY: Math.min(...ys) - HOST_MARGIN,
    maxY: Math.max(...ys) + HOST_MARGIN,
  };
}

const idsOf = (spec: DeepSpec) => (spec.paired ? [`${spec.base}-left`, `${spec.base}-right`] : [spec.base]);

describe.each(SPECS)('deep muscle $base', (spec) => {
  it('exists on the deep layer of its view', () => {
    for (const id of idsOf(spec)) {
      const muscle = getMuscleById(id);
      expect(muscle, id).toBeDefined();
      expect(muscle?.layer).toBe('deep');
      expect(muscle?.views).toEqual([spec.view]);
      expect(muscle?.exercises.length).toBeGreaterThan(0);
    }
  });

  it('is a closed curved path made of absolute M, C, L and Z commands', () => {
    for (const id of idsOf(spec)) {
      const path = pathOf(id, spec.view);
      expect(path).toMatch(/^M[-\d., CLZ]+Z$/);
      expect(path).toContain('C');
    }
  });

  it('sits inside the shapes it lies beneath', () => {
    for (const id of idsOf(spec)) {
      const side = id.endsWith('-left') ? 'left' : id.endsWith('-right') ? 'right' : null;
      const box = hostBox(spec.hosts, side, spec.view);
      const anchors = getAnchorPoints(pathOf(id, spec.view));
      const inside = anchors.filter(
        (point) => point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY
      );
      expect(inside.length / anchors.length, id).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('mirrors left to right, or is symmetric when unpaired', () => {
    const boxOf = (id: string) => {
      const anchors = getAnchorPoints(pathOf(id, spec.view));
      const xs = anchors.map((point) => point.x);
      return { minX: Math.min(...xs), maxX: Math.max(...xs) };
    };
    if (spec.paired) {
      const left = boxOf(`${spec.base}-left`);
      const right = boxOf(`${spec.base}-right`);
      expect(Math.abs(MIRROR_AXIS - left.minX - right.maxX)).toBeLessThanOrEqual(1);
      expect(Math.abs(MIRROR_AXIS - left.maxX - right.minX)).toBeLessThanOrEqual(1);
      expect(left.maxX).toBeLessThanOrEqual(100);
    } else {
      const box = boxOf(spec.base);
      expect(Math.abs(MIRROR_AXIS - box.minX - box.maxX)).toBeLessThanOrEqual(1);
    }
  });

  it('counts toward a workout group and is linked from the taxonomy', () => {
    for (const id of idsOf(spec)) expect(MCL_TO_LEGACY_MAP[id], id).toBeDefined();
    expect(taxonomyNodes.find((node) => node.id === spec.node)?.muscleIds).toEqual([spec.base]);
  });
});
