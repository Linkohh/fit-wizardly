import { describe, it, expect } from 'vitest';
import { sortMusclesForRender, SIDE_ORDER, type RenderState } from './sortMuscles';
import type { Muscle } from '../types';

const make = (id: string, sideOrder?: number): Muscle => ({
  id,
  name: id,
  scientificName: id,
  group: 'chest',
  function: '',
  exercises: [],
  views: ['front', 'back', 'side'],
  relatedMuscles: [],
  paths: {},
  sideOrder,
});

const state = (over: Partial<{ selected: string[]; hovered: string | null; highlighted: string[]; disabled: string[] }> = {}): RenderState => ({
  selected: new Set(over.selected ?? []),
  hovered: over.hovered ?? null,
  highlighted: new Set(over.highlighted ?? []),
  disabled: new Set(over.disabled ?? []),
});

const ids = (ms: Muscle[]) => ms.map((m) => m.id);

describe('sortMusclesForRender', () => {
  it("keeps today's order in front view: disabled < plain < highlighted < selected < hovered", () => {
    const input = ['hov', 'sel', 'hi', 'plain', 'dis'].map((id) => make(id));
    const out = sortMusclesForRender(
      input,
      'front',
      state({ selected: ['sel'], hovered: 'hov', highlighted: ['hi'], disabled: ['dis'] })
    );
    expect(ids(out)).toEqual(['dis', 'plain', 'hi', 'sel', 'hov']);
  });

  it('in side view orders by sideOrder before state', () => {
    const arm = make('arm', SIDE_ORDER.nearArm);
    const torso = make('torso', SIDE_ORDER.torso);
    expect(ids(sortMusclesForRender([arm, torso], 'side', state({ hovered: 'torso' })))).toEqual(['torso', 'arm']);
  });

  it('still renders disabled first in side view', () => {
    const arm = make('arm', SIDE_ORDER.nearArm);
    const torso = make('torso', SIDE_ORDER.torso);
    expect(ids(sortMusclesForRender([torso, arm], 'side', state({ disabled: ['arm'] })))).toEqual(['arm', 'torso']);
  });

  it('uses state as tiebreak within equal sideOrder in side view', () => {
    const a = make('a', 20);
    const b = make('b', 20);
    expect(ids(sortMusclesForRender([b, a], 'side', state({ selected: ['a'] })))).toEqual(['b', 'a']);
  });

  it('treats missing sideOrder as SIDE_ORDER.torso', () => {
    const noOrder = make('none');
    const far = make('far', SIDE_ORDER.farLimb);
    const near = make('near', SIDE_ORDER.nearLeg);
    expect(ids(sortMusclesForRender([near, noOrder, far], 'side', state()))).toEqual(['far', 'none', 'near']);
  });

  it('ignores sideOrder in front and back views', () => {
    const arm = make('arm', SIDE_ORDER.nearArm);
    const far = make('far', SIDE_ORDER.farLimb);
    for (const view of ['front', 'back'] as const) {
      expect(ids(sortMusclesForRender([arm, far], view, state()))).toEqual(['arm', 'far']);
    }
  });

  it('does not mutate its input', () => {
    const input = [make('a', 40), make('b', 10)];
    const copy = [...input];
    sortMusclesForRender(input, 'side', state());
    expect(input).toEqual(copy);
  });
});
