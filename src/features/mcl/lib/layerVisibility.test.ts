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

  it('applies the same rule on front and back', () => {
    const rhomboid = muscles.find((m) => m.id === 'rhomboid-left');
    const lat = muscles.find((m) => m.id === 'latissimus-dorsi-left');
    if (!rhomboid || !lat) throw new Error('fixture muscles missing');
    expect(getLayerRole(rhomboid, 'back', 'surface')).toBe('hidden');
    expect(getLayerRole(rhomboid, 'back', 'deep')).toBe('active');
    expect(getLayerRole(lat, 'back', 'surface')).toBe('active');
    expect(getLayerRole(lat, 'back', 'deep')).toBe('ghost');
    expect(getLayerRole(surface, 'front', 'deep')).toBe('ghost');
    expect(getLayerRole(deep, 'front', 'surface')).toBe('hidden');
  });
});
