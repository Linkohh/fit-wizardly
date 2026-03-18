interface ExerciseLibraryMediaOverride {
  sourceId?: number;
  slug?: string;
  imageUrl: string;
  alt?: string;
}

// Intentionally empty for phase one. The resolver supports this layer now so
// licensed local assets can be added later without reshaping the UI again.
export const EXERCISE_LIBRARY_MEDIA_OVERRIDES: ExerciseLibraryMediaOverride[] = [];

export function findExerciseLibraryMediaOverride(
  sourceId: number | null,
  slug: string
) {
  if (typeof sourceId === 'number') {
    const bySourceId = EXERCISE_LIBRARY_MEDIA_OVERRIDES.find(
      (override) => override.sourceId === sourceId
    );
    if (bySourceId) return bySourceId;
  }

  return EXERCISE_LIBRARY_MEDIA_OVERRIDES.find(
    (override) => override.slug === slug
  ) ?? null;
}
