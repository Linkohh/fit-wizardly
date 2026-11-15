export const SCULPT_DEFAULT = 60;

export interface SculptStyle {
  fillOpacity: number;
  edgeOpacity: number;
  shadingOpacity: number;
  outlineOpacity: number;
}

const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

/** Maps a 0-100 sculpt level (clamped) to the rendering values for unselected muscles. */
export function getSculptStyle(level: number): SculptStyle {
  const t = Math.min(100, Math.max(0, level)) / 100;
  return {
    fillOpacity: lerp(0.12, 0.6, t),
    edgeOpacity: lerp(0, 0.8, t),
    shadingOpacity: lerp(0, 1, t),
    outlineOpacity: lerp(0.9, 0.35, t),
  };
}

export interface MuscleOpacityState {
  isSelected: boolean;
  isHovered: boolean;
  isDisabled: boolean;
}

/** Opacity for a muscle with no highlight: only the resting state follows the sculpt level. */
export function getMuscleOpacity(
  { isSelected, isHovered, isDisabled }: MuscleOpacityState,
  sculpt: SculptStyle,
  hoverIntensity: 'default' | 'strong'
): number {
  if (isDisabled) return 0.15;
  if (isSelected) return 1;
  if (isHovered) return hoverIntensity === 'strong' ? 1 : 0.95;
  return sculpt.fillOpacity;
}
