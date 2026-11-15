import { describe, expect, it } from 'vitest';
import { getLayerRole } from './layerVisibility';
import { muscles } from '../data/muscles';
import type { Muscle } from '../types';

const surface = { id: 's', layer: 'surface' } as Muscle;
const implicitSurface = { id: 'i' } as Muscle;
const deep = { id: 'd', layer: 'deep' } as Muscle;

describe('getLayerRole', () => {
  it('shows surface muscles and hides deep muscles in side view on the surface layer', () => {
    expect(getLayerRole(surface, 'side', 'surface')).toBe('active');
    expect(getLayerRole(implicitSurface, 'side', 'surface')).toBe('active');
    expect(getLayerRole(deep, 'side', 'surface')).toBe('hidden');
  });

  it('activates deep muscles and ghosts surface muscles in side view on the deep layer', () => {
    expect(getLayerRole(deep, 'side', 'deep')).toBe('active');
    expect(getLayerRole(surface, 'side', 'deep')).toBe('ghost');
    expect(getLayerRole(implicitSurface, 'side', 'deep')).toBe('ghost');
  });

  it('returns active for every muscle in front and back when layer is deep', () => {
    for (const view of ['front', 'back'] as const) {
      for (const layer of ['surface', 'deep'] as const) {
        for (const m of muscles) {
          expect(getLayerRole(m, view, layer)).toBe('active');
        }
      }
    }
  });
});
