import { useCallback, useState } from 'react';
import { z } from 'zod';
import { SCULPT_DEFAULT } from '../lib/sculpt';
import type { MuscleLayer } from '../types';

const STORAGE_KEY = 'fitwizard.mcl.sculpt.v1';

const prefsSchema = z.object({
  sculptLevel: z.number().min(0).max(100),
  layer: z.enum(['surface', 'deep']),
});

type SculptPrefs = z.infer<typeof prefsSchema>;

const DEFAULT_PREFS: SculptPrefs = { sculptLevel: SCULPT_DEFAULT, layer: 'surface' };

function readPrefs(): SculptPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_PREFS;
    const parsed = prefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: SculptPrefs): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable or full: keep the in-memory value.
  }
}

const clampLevel = (level: number): number =>
  Number.isFinite(level) ? Math.min(100, Math.max(0, level)) : SCULPT_DEFAULT;

export function useSculptPrefs(): {
  sculptLevel: number;
  setSculptLevel: (level: number) => void;
  layer: MuscleLayer;
  setLayer: (layer: MuscleLayer) => void;
} {
  const [prefs, setPrefs] = useState<SculptPrefs>(readPrefs);

  const update = useCallback((patch: Partial<SculptPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  const setSculptLevel = useCallback(
    (level: number) => update({ sculptLevel: clampLevel(level) }),
    [update],
  );
  const setLayer = useCallback((layer: MuscleLayer) => update({ layer }), [update]);

  return { sculptLevel: prefs.sculptLevel, setSculptLevel, layer: prefs.layer, setLayer };
}
