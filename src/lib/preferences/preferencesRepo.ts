import { supabase } from '@/lib/supabase';
import type {
  ExerciseCollection,
  ExerciseSettings,
  Json,
  UserExercisePreferences,
} from '@/types/supabase';

export interface PreferencesCloudSnapshot {
  favorites: string[];
  collections: Record<string, ExerciseCollection>;
  filterPresets: Record<string, unknown>;
  settings: ExerciseSettings;
  recentlyViewed: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function loadPreferencesRecord(userId: string): Promise<UserExercisePreferences | null> {
  const { data, error } = await supabase
    .from('user_exercise_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ?? null;
}

export async function syncPreferencesRecord(userId: string, snapshot: PreferencesCloudSnapshot) {
  const collectionsJson = snapshot.collections as unknown as Json;
  const filterPresetsJson = snapshot.filterPresets as unknown as Json;
  const settingsJson = snapshot.settings as unknown as Json;

  const { error } = await supabase
    .from('user_exercise_preferences')
    .upsert({
      user_id: userId,
      favorites: snapshot.favorites,
      collections: collectionsJson,
      filter_presets: filterPresetsJson,
      settings: settingsJson,
      recently_viewed: snapshot.recentlyViewed,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}

export function parseCollections(rawCollections: unknown) {
  return isRecord(rawCollections)
    ? (rawCollections as Record<string, ExerciseCollection>)
    : {};
}

export function parseFilterPresets(rawFilterPresets: unknown) {
  return isRecord(rawFilterPresets)
    ? (rawFilterPresets as Record<string, unknown>)
    : {};
}
