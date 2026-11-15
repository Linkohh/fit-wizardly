import { describe, expect, it } from 'vitest';
import { normalizeQuery, resolveRegion, resolveSearch, toFocusHighlights } from './anatomyEngine';

const memberNames = (query: string) => resolveSearch(query)[0]?.members.map((member) => member.node.name) ?? [];
const firstName = (query: string) => resolveSearch(query)[0]?.node.name;

describe('resolveSearch', () => {
  it('"chest" lists pectoralis major, both pec heads, pectoralis minor, serratus anterior', () => {
    expect(memberNames('chest')).toEqual(
      expect.arrayContaining([
        'Pectoralis Major',
        'Pec Major Clavicular Head',
        'Pec Major Sternal Head',
        'Pectoralis Minor',
        'Serratus Anterior',
      ])
    );
  });

  it('"triceps" lists the three heads, each shown as Triceps Brachii with both sides', () => {
    const result = resolveSearch('triceps')[0];
    const heads = result.members.filter((member) => member.node.id.startsWith('tri_'));
    expect(heads.map((member) => member.node.name).sort()).toEqual([
      'Triceps Lateral Head',
      'Triceps Long Head',
      'Triceps Medial Head',
    ]);
    for (const head of heads) {
      expect(head.shownAs?.name).toBe('Triceps Brachii');
      expect(head.muscleIds.sort()).toEqual(['triceps-left', 'triceps-right']);
    }
  });

  it('"calf" lists gastrocnemius, soleus, plantaris and not tibialis anterior', () => {
    const names = memberNames('calf');
    expect(names).toEqual(expect.arrayContaining(['Gastrocnemius', 'Soleus', 'Plantaris']));
    expect(names).not.toContain('Tibialis Anterior');
  });

  it('nicknames find the right muscle first', () => {
    expect(firstName('teardrop')).toBe('Vastus Medialis');
    expect(firstName('traps')).toBe('Trapezius');
    expect(memberNames('traps')).toEqual(
      expect.arrayContaining(['Upper Trapezius', 'Middle Trapezius', 'Lower Trapezius'])
    );
    expect(firstName('rotator cuff')).toBe('Rotator Cuff');
    expect(firstName('glutes')).toBe('Glutes');
  });

  it('ignores case, spacing and punctuation', () => {
    expect(resolveSearch('TRAPS')).toEqual(resolveSearch('traps'));
    expect(resolveSearch(' Calf ')).toEqual(resolveSearch('calf'));
    expect(firstName("bi's")).toBe('Biceps Brachii');
    expect(normalizeQuery("  Bi's   CURL ")).toBe('bis curl');
  });

  it('returns nothing for empty, blank or one-letter queries', () => {
    expect(resolveSearch('')).toEqual([]);
    expect(resolveSearch('   ')).toEqual([]);
    expect(resolveSearch('a')).toEqual([]);
  });

  it('does not join short unrelated words', () => {
    expect(resolveSearch('abs').map((result) => result.node.name)).not.toContain('Arms');
    expect(firstName('abs')).toBe('Rectus Abdominis');
    expect(firstName('lat')).toBe('Latissimus Dorsi');
  });

  it('tolerates a typo in a long word', () => {
    expect(firstName('gastrocnemus')).toBe('Gastrocnemius');
    expect(firstName('hamstrngs')).toBe('Hamstrings');
  });

  it('expands a node to both sides of the body', () => {
    expect(resolveSearch('biceps')[0].muscleIds.sort()).toEqual(['biceps-left', 'biceps-right']);
  });

  it('leaves out areas that cannot be selected', () => {
    expect(resolveSearch('skull')).toEqual([]);
  });
});

describe('resolveRegion', () => {
  it('"back" lists lats, rhomboids, erector spinae, teres major and the rotator cuff', () => {
    const names = resolveRegion('back')?.members.map((member) => member.node.name) ?? [];
    expect(names).toEqual(
      expect.arrayContaining([
        'Latissimus Dorsi',
        'Rhomboids',
        'Erector Spinae',
        'Teres Major',
        'Infraspinatus',
        'Supraspinatus',
        'Subscapularis',
        'Teres Minor',
      ])
    );
  });

  it('returns null for an unknown region', () => {
    expect(resolveRegion('nope')).toBeNull();
  });

  it('gives the same muscle ids as search for every shared member', () => {
    const fromRegion = resolveRegion('back');
    const fromSearch = resolveSearch('back')[0];
    expect(fromRegion).not.toBeNull();
    for (const member of fromSearch.members) {
      const twin = fromRegion?.members.find((other) => other.node.id === member.node.id);
      expect(twin, member.node.id).toBeDefined();
      expect(twin?.muscleIds).toEqual(member.muscleIds);
    }
  });
});

describe('toFocusHighlights', () => {
  it('maps ids to focus highlights at full intensity', () => {
    expect(toFocusHighlights(['biceps-left'])).toEqual([
      { muscleId: 'biceps-left', type: 'focus', intensity: 100 },
    ]);
  });
});
