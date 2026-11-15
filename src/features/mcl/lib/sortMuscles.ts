import type { Muscle, ViewType } from '../types';

/** Side-view paint order: lower values render first (further back). */
export const SIDE_ORDER = { farLimb: 10, torso: 20, nearLeg: 30, nearArm: 40 } as const;

export interface RenderState {
  selected: ReadonlySet<string>;
  hovered: string | null;
  highlighted: ReadonlySet<string>;
  disabled: ReadonlySet<string>;
}

/**
 * Returns a new array ordered for painting (last item renders on top).
 * Disabled first, then (side view only) sideOrder, then plain < highlighted < selected < hovered.
 */
export function sortMusclesForRender(muscles: Muscle[], view: ViewType, state: RenderState): Muscle[] {
  const rank = (m: Muscle): number => {
    if (state.hovered === m.id) return 3;
    if (state.selected.has(m.id)) return 2;
    if (state.highlighted.has(m.id)) return 1;
    return 0;
  };
  return [...muscles].sort((a, b) => {
    const aDisabled = state.disabled.has(a.id);
    const bDisabled = state.disabled.has(b.id);
    if (aDisabled !== bDisabled) return aDisabled ? -1 : 1;

    if (view === 'side') {
      const diff = (a.sideOrder ?? SIDE_ORDER.torso) - (b.sideOrder ?? SIDE_ORDER.torso);
      if (diff !== 0) return diff;
    }

    return rank(a) - rank(b);
  });
}
