import { describe, expect, it } from 'vitest';
import { taxonomyNodes } from '../data/taxonomy';
import { resolveRegion, resolveSearch } from './anatomyEngine';

/**
 * The acceptance test from BUILD-PLAN.md, asserted against drawn muscle ids:
 * search and region tap must light up the same, complete set of shapes.
 */
const idsFor = (query: string) => resolveSearch(query)[0]?.muscleIds ?? [];

// Muscle heads share their parent's shape; these areas have no drawn muscles.
const SHARES_PARENT_SHAPE = new Set([
  'pec_major_clavicular',
  'pec_major_sternal',
  'tri_long',
  'tri_lateral',
  'tri_medial',
  'biceps_femoris_short',
]);
const NOT_DRAWN = new Set(['head', 'feet', 'internal_oblique']);

describe('anatomy acceptance', () => {
  it('"chest" lights up pec major, pec minor and serratus on both sides', () => {
    expect(idsFor('chest').sort()).toEqual([
      'pectoralis-major-left',
      'pectoralis-major-right',
      'pectoralis-minor-left',
      'pectoralis-minor-right',
      'serratus-anterior-left',
      'serratus-anterior-right',
    ]);
  });

  it('"triceps" lights up the triceps for all three heads', () => {
    const result = resolveSearch('triceps')[0];
    expect(result.members.map((member) => member.node.id)).toEqual(
      expect.arrayContaining(['tri_long', 'tri_lateral', 'tri_medial'])
    );
    expect(result.muscleIds.sort()).toEqual(['triceps-left', 'triceps-right']);
  });

  it('the back region lights up lats, rhomboids, erector spinae, teres major and the whole rotator cuff', () => {
    const ids = resolveRegion('back')?.muscleIds ?? [];
    expect(ids).toEqual(
      expect.arrayContaining([
        'latissimus-dorsi-left',
        'rhomboid-right',
        'erector-spinae',
        'teres-major-left',
        'infraspinatus-left',
        'supraspinatus-left',
        'subscapularis-right',
        'teres-minor-right',
      ])
    );
  });

  it('"calf" lights up gastrocnemius, soleus and plantaris, and not the shin', () => {
    expect(idsFor('calf').sort()).toEqual([
      'gastrocnemius-left',
      'gastrocnemius-right',
      'plantaris-left',
      'plantaris-right',
      'soleus-left',
      'soleus-right',
    ]);
  });

  it('search and region give identical ids for every muscle they share', () => {
    for (const regionId of ['chest', 'back', 'arms', 'core', 'hips', 'legs', 'shoulders', 'neck']) {
      const region = resolveRegion(regionId);
      expect(region, regionId).not.toBeNull();
      for (const member of region?.members ?? []) {
        const viaSearch = resolveSearch(member.node.name)
          .flatMap((result) => result.members)
          .find((candidate) => candidate.node.id === member.node.id);
        expect(viaSearch?.muscleIds, member.node.id).toEqual(member.muscleIds);
      }
    }
  });

  it('every real muscle in the tree is drawn', () => {
    const parents = new Set(taxonomyNodes.map((node) => node.parent));
    const undrawn = taxonomyNodes
      .filter((node) => !parents.has(node.id))
      .filter((node) => !SHARES_PARENT_SHAPE.has(node.id) && !NOT_DRAWN.has(node.id))
      .filter((node) => node.muscleIds.length === 0)
      .map((node) => node.id);
    expect(undrawn).toEqual([]);
  });
});
