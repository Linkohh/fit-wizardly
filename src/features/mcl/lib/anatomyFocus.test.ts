import { describe, expect, it } from 'vitest';
import { resolveRegion, resolveSearch } from './anatomyEngine';
import { getMemberVisibility, pickViewAndLayer } from './anatomyFocus';

describe('pickViewAndLayer', () => {
  it('stays on the current view when a match is drawn there', () => {
    expect(pickViewAndLayer(['biceps-left'], { view: 'front', layer: 'surface' }, true)).toEqual({
      view: 'front',
      layer: 'surface',
    });
  });

  it('moves to the view showing most of a region, even when a few matches are on the current view', () => {
    const backIds = resolveRegion('back')?.muscleIds ?? [];
    expect(pickViewAndLayer(backIds, { view: 'front', layer: 'surface' }, true).view).toBe('back');
    expect(pickViewAndLayer(backIds, { view: 'back', layer: 'surface' }, true).view).toBe('back');
  });

  it('moves to the view that shows the match', () => {
    expect(pickViewAndLayer(['latissimus-dorsi-left'], { view: 'front', layer: 'surface' }, true).view).toBe('back');
  });

  it('switches to the deep layer when every match on the view is deep', () => {
    expect(pickViewAndLayer(['rhomboid-left', 'rhomboid-right'], { view: 'front', layer: 'surface' }, true)).toEqual({
      view: 'back',
      layer: 'deep',
    });
  });

  it('switches back to surface when every match is surface', () => {
    expect(pickViewAndLayer(['biceps-left'], { view: 'front', layer: 'deep' }, true).layer).toBe('surface');
  });

  it('keeps the layer when matches are mixed', () => {
    const ids = ['latissimus-dorsi-left', 'rhomboid-left'];
    expect(pickViewAndLayer(ids, { view: 'back', layer: 'surface' }, true).layer).toBe('surface');
    expect(pickViewAndLayer(ids, { view: 'back', layer: 'deep' }, true).layer).toBe('deep');
  });

  it('never picks the side view when it is not offered', () => {
    expect(pickViewAndLayer([], { view: 'front', layer: 'surface' }, false)).toEqual({ view: 'front', layer: 'surface' });
  });
});

describe('getMemberVisibility', () => {
  const member = (query: string, id: string) => {
    const found = resolveSearch(query)[0].members.find((candidate) => candidate.node.id === id);
    if (!found) throw new Error(`${id} not in results for ${query}`);
    return found;
  };

  it('reports visible, other layer, other view and not drawn', () => {
    expect(getMemberVisibility(member('lats', 'latissimus_dorsi'), { view: 'back', layer: 'surface' })).toEqual({ kind: 'visible' });
    expect(getMemberVisibility(member('rhomboids', 'rhomboids'), { view: 'back', layer: 'surface' })).toEqual({ kind: 'other-layer', layer: 'deep' });
    expect(getMemberVisibility(member('lats', 'latissimus_dorsi'), { view: 'front', layer: 'surface' })).toEqual({ kind: 'other-view', view: 'back' });
  });
});
