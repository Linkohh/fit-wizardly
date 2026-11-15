import { getMuscleById } from '../data/muscles';
import type { MuscleLayer, ViewType } from '../types';
import type { AnatomyMember } from './anatomyEngine';

const VIEW_ORDER: readonly ViewType[] = ['front', 'back', 'side'];

export interface ViewAndLayer {
  view: ViewType;
  layer: MuscleLayer;
}

function layerOf(muscleId: string): MuscleLayer {
  return getMuscleById(muscleId)?.layer ?? 'surface';
}

function idsOnView(muscleIds: string[], view: ViewType): string[] {
  return muscleIds.filter((id) => getMuscleById(id)?.views.includes(view));
}

/**
 * Where the selector should look so a set of matched muscles is visible:
 * the view showing the most of them (the current view wins ties). The layer
 * follows only when every match on that view agrees.
 */
export function pickViewAndLayer(muscleIds: string[], current: ViewAndLayer, allowSide: boolean): ViewAndLayer {
  const candidates = VIEW_ORDER.filter((view) => allowSide || view !== 'side');
  // Go where most of the matches are; the current view wins ties so the body does not flip needlessly.
  let view = current.view;
  let bestCount = idsOnView(muscleIds, current.view).length;
  for (const candidate of candidates) {
    const count = idsOnView(muscleIds, candidate).length;
    if (count > bestCount) {
      bestCount = count;
      view = candidate;
    }
  }

  const layers = new Set(idsOnView(muscleIds, view).map(layerOf));
  const layer = layers.size === 1 ? Array.from(layers)[0] : current.layer;
  return { view, layer };
}

export type MemberVisibility =
  | { kind: 'visible' }
  | { kind: 'other-layer'; layer: MuscleLayer }
  | { kind: 'other-view'; view: ViewType }
  | { kind: 'not-drawn' };

/** Why a matched muscle is or is not lit up on the current view and layer. */
export function getMemberVisibility(member: AnatomyMember, current: ViewAndLayer): MemberVisibility {
  if (member.muscleIds.length === 0) return { kind: 'not-drawn' };
  const here = idsOnView(member.muscleIds, current.view);
  if (here.length === 0) {
    const elsewhere = VIEW_ORDER.find((view) => idsOnView(member.muscleIds, view).length > 0);
    return elsewhere ? { kind: 'other-view', view: elsewhere } : { kind: 'not-drawn' };
  }
  const memberLayer = layerOf(here[0]);
  return memberLayer === current.layer ? { kind: 'visible' } : { kind: 'other-layer', layer: memberLayer };
}
