export type ExerciseLibrarySource = 'cache' | 'snapshot' | 'legacy' | 'live';
export type ExerciseLibraryLocale = 'en' | 'es' | 'pt' | 'de';
export type ExerciseLibraryResolvedLocale = ExerciseLibraryLocale | 'default';

export type ExerciseLibrarySyncStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'refreshing'
  | 'error'
  | 'cooldown';

export type ExerciseRecordSource = 'wger' | 'legacy' | 'custom';
export type ExerciseLibraryMediaVariant = 'wger' | 'override' | 'anatomy' | 'brand';
export type ExerciseLibraryMediaView = 'front' | 'back';

export interface ExerciseLibraryCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ExerciseLicenseInfo {
  id: string;
  fullName: string;
  shortName: string;
  url: string;
  author: string | null;
  authorHistory: string[];
}

export interface ExerciseLibraryLocalizedEntry {
  name: string;
  description: string;
  aliases: string[];
}

export interface ExerciseLibraryDisplayContent {
  name: string;
  description: string;
  aliases: string[];
  resolvedLocale: ExerciseLibraryResolvedLocale;
}

export interface ExerciseLibraryRecord {
  id: string;
  source: ExerciseRecordSource;
  sourceId: number | null;
  sourceUuid: string | null;
  slug: string;
  name: string;
  description: string;
  category: ExerciseLibraryCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  imageUrl: string | null;
  imageUrls: string[];
  licenseInfo: ExerciseLicenseInfo | null;
  aliases: string[];
  localizedContent: Partial<
    Record<ExerciseLibraryLocale, ExerciseLibraryLocalizedEntry>
  >;
  searchText: string;
  lastSyncedAt: string | null;
}

export interface ExerciseLibraryResolvedMedia {
  variant: ExerciseLibraryMediaVariant;
  label: string;
  imageUrl: string | null;
  alt: string;
  anatomy:
    | {
        primaryKeys: string[];
        secondaryKeys: string[];
        defaultView: ExerciseLibraryMediaView;
        activeView: ExerciseLibraryMediaView;
        availableViews: ExerciseLibraryMediaView[];
      }
    | null;
}

export interface ExerciseLibraryState {
  records: ExerciseLibraryRecord[];
  source: ExerciseLibrarySource;
  isStale: boolean;
  lastSyncedAt: string | null;
  syncStatus: ExerciseLibrarySyncStatus;
  error: string | null;
}

export interface ExerciseLibrarySnapshotPayload {
  generatedAt: string;
  records: ExerciseLibraryRecord[];
}

export interface WgerExerciseInfoPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: WgerExerciseInfoRecord[];
}

export interface WgerExerciseCategory {
  id: number;
  name: string;
}

export interface WgerExerciseMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

export interface WgerExerciseEquipment {
  id: number;
  name: string;
}

export interface WgerExerciseLicense {
  id: number;
  full_name: string;
  short_name: string;
  url: string;
}

export interface WgerExerciseImage {
  id: number;
  uuid: string;
  exercise: number;
  exercise_uuid: string;
  image: string;
  is_main: boolean;
  style: string;
  license: number | null;
  license_title: string;
  license_object_url: string;
  license_author: string | null;
  license_author_url: string;
  license_derivative_source_url: string;
  author_history: string[];
}

export interface WgerExerciseTranslation {
  id: number;
  uuid: string;
  name: string;
  exercise: number;
  description: string;
  created: string;
  language: number;
  aliases: Array<{ id: number; uuid: string; alias: string }>;
  notes: unknown[];
  license: number | null;
  license_title: string;
  license_object_url: string;
  license_author: string | null;
  license_author_url: string;
  license_derivative_source_url: string;
  author_history: string[];
}

export interface WgerExerciseInfoRecord {
  id: number;
  uuid: string;
  created: string;
  last_update: string;
  last_update_global: string;
  category: WgerExerciseCategory | null;
  muscles: WgerExerciseMuscle[];
  muscles_secondary: WgerExerciseMuscle[];
  equipment: WgerExerciseEquipment[];
  license: WgerExerciseLicense | null;
  license_author: string | null;
  images: WgerExerciseImage[];
  translations: WgerExerciseTranslation[];
  variations: number | null;
  videos: unknown[];
  author_history: string[];
  total_authors_history: string[];
}

export interface ExerciseLibraryFilterState {
  search: string;
  category: string;
  muscle: string;
  equipment: string;
}

export interface ExerciseLibraryOption {
  value: string;
  label: string;
}
