import { muscles } from '../data/muscles';

const knownIds = new Set(muscles.map((m) => m.id));

/** `x-left` or `x-right` -> `['x-left', 'x-right']` when both exist; otherwise `[id]`. */
export const getPairedIds = (id: string): string[] => {
  const match = /^(.+)-(left|right)$/.exec(id);
  if (!match) return [id];
  const left = `${match[1]}-left`;
  const right = `${match[1]}-right`;
  return knownIds.has(left) && knownIds.has(right) ? [left, right] : [id];
};

/** Strips a trailing " (Left)" / " (Right)" from a muscle name. */
export const getSideLabel = (name: string): string => name.replace(/ \((?:Left|Right)\)$/, '');
