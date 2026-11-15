import type { Muscle, MuscleLayer, ViewType } from '../types';

export type LayerRole = 'active' | 'ghost' | 'hidden';

/**
 * How a muscle takes part in the current view. Only side view has layers:
 * the chosen layer is interactive, surface muscles recede to a ghost behind
 * the deep layer, and deep muscles are hidden on the surface layer.
 */
export function getLayerRole(muscle: Muscle, view: ViewType, layer: MuscleLayer): LayerRole {
  if (view !== 'side') return 'active';
  const muscleLayer: MuscleLayer = muscle.layer ?? 'surface';
  if (muscleLayer === layer) return 'active';
  return layer === 'deep' ? 'ghost' : 'hidden';
}
