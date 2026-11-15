import { describe, expect, it } from 'vitest';
import { muscles } from '../muscles';
import { REGION_CHIPS, regions, taxonomyNodes } from './index';

const byId = new Map(taxonomyNodes.map((node) => [node.id, node]));
const muscleIdSet = new Set(muscles.map((muscle) => muscle.id));

function ancestorsOf(id: string): string[] {
  const chain: string[] = [];
  let current = byId.get(id)?.parent ?? null;
  while (current !== null) {
    if (chain.includes(current)) throw new Error(`parent loop at ${current}`);
    chain.push(current);
    current = byId.get(current)?.parent ?? null;
  }
  return chain;
}

const childrenOf = (id: string) =>
  taxonomyNodes.filter((node) => node.parent === id).map((node) => node.id).sort();

describe('muscle taxonomy structure', () => {
  it('has unique node ids', () => {
    expect(byId.size).toBe(taxonomyNodes.length);
  });

  it('every parent exists and no parent chain loops', () => {
    for (const node of taxonomyNodes) {
      if (node.parent !== null) expect(byId.has(node.parent), `${node.id} parent`).toBe(true);
      expect(() => ancestorsOf(node.id)).not.toThrow();
    }
  });

  it('every muscleIds entry points at a drawn muscle', () => {
    for (const node of taxonomyNodes) {
      for (const baseId of node.muscleIds) {
        const drawn =
          muscleIdSet.has(baseId) || muscleIdSet.has(`${baseId}-left`) || muscleIdSet.has(`${baseId}-right`);
        expect(drawn, `${node.id} -> ${baseId}`).toBe(true);
      }
    }
  });

  it('no alias belongs to two unrelated nodes', () => {
    const owners = new Map<string, string[]>();
    for (const node of taxonomyNodes) {
      for (const alias of node.aliases) {
        const key = alias.toLowerCase();
        owners.set(key, [...(owners.get(key) ?? []), node.id]);
      }
    }
    for (const [alias, ids] of owners) {
      for (const first of ids) {
        for (const second of ids) {
          if (first === second) continue;
          const related = ancestorsOf(first).includes(second) || ancestorsOf(second).includes(first);
          expect(related, `alias "${alias}" on ${first} and ${second}`).toBe(true);
        }
      }
    }
  });
});

describe('taxonomy corrections', () => {
  it('shin is not a calf muscle, and calves and traps sit under the right parents', () => {
    expect(byId.get('tibialis_anterior')?.parent).toBe('legs');
    expect(byId.get('calves')?.parent).toBe('legs');
    expect(byId.get('trapezius')?.parent).toBe('back');
  });

  it('rotator cuff and glutes are groups with the right members', () => {
    expect(childrenOf('rotator_cuff')).toEqual(['infraspinatus', 'subscapularis', 'supraspinatus', 'teres_minor']);
    expect(childrenOf('glutes')).toEqual(['gluteus_maximus', 'gluteus_medius', 'gluteus_minimus']);
  });

  it('head and feet are not selectable', () => {
    expect(byId.get('head')?.selectable).toBe(false);
    expect(byId.get('feet')?.selectable).toBe(false);
    expect(byId.get('chest')?.selectable).toBe(true);
  });
});

describe('regions', () => {
  it('every listed id exists in the tree', () => {
    for (const [regionId, ids] of Object.entries(regions)) {
      for (const id of ids) expect(byId.has(id), `${regionId} -> ${id}`).toBe(true);
    }
  });

  it('every chip is a known region', () => {
    for (const chip of REGION_CHIPS) expect(regions[chip.id], chip.id).toBeDefined();
  });
});
