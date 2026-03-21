import type { ExerciseSettings } from '@/types/supabase';

function isMissingBoolean(value: ExerciseSettings | null | undefined, key: keyof ExerciseSettings) {
  return value == null || value[key] === undefined;
}

export const DEFAULT_EXERCISE_SETTINGS: ExerciseSettings = {
  haptics: true,
  sounds: true,
  soundsExplicitlySet: true,
  reducedMotion: false,
  motionTilt: true,
};

export function normalizeSettings(rawSettings: ExerciseSettings | null | undefined) {
  const mergedSettings: ExerciseSettings = {
    ...DEFAULT_EXERCISE_SETTINGS,
    ...(rawSettings ?? {}),
  };

  const shouldForceEnableSounds =
    !rawSettings?.soundsExplicitlySet && rawSettings?.sounds !== true;

  if (shouldForceEnableSounds) {
    mergedSettings.sounds = true;
    mergedSettings.soundsExplicitlySet = true;
  }

  const shouldPersistNormalization =
    shouldForceEnableSounds ||
    isMissingBoolean(rawSettings, 'haptics') ||
    isMissingBoolean(rawSettings, 'sounds') ||
    isMissingBoolean(rawSettings, 'soundsExplicitlySet') ||
    isMissingBoolean(rawSettings, 'reducedMotion') ||
    isMissingBoolean(rawSettings, 'motionTilt');

  return {
    settings: mergedSettings,
    shouldPersistNormalization,
  };
}
