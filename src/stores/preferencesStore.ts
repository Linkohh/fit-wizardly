import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
  ExerciseCollection,
  ExerciseSettings,
} from '@/types/supabase';
import { normalizeSettings, DEFAULT_EXERCISE_SETTINGS } from '@/lib/preferences/preferencesMigrations';
import { createQueuedAction, type QueuedAction } from '@/lib/preferences/preferencesSyncQueue';
import {
  loadPreferencesRecord,
  parseCollections,
  parseFilterPresets,
  type PreferencesCloudSnapshot,
  syncPreferencesRecord,
} from '@/lib/preferences/preferencesRepo';

export interface PreferencesState {
  favorites: string[];
  collections: Record<string, ExerciseCollection>;
  filterPresets: Record<string, unknown>;
  settings: ExerciseSettings;
  recentlyViewed: string[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  offlineQueue: QueuedAction[];
  motionTiltActivatedThisSession: boolean;
  setMotionTiltActivatedThisSession: (value: boolean) => void;
  addFavorite: (exerciseId: string) => void;
  removeFavorite: (exerciseId: string) => void;
  toggleFavorite: (exerciseId: string) => void;
  isFavorite: (exerciseId: string) => boolean;
  createCollection: (name: string, color?: string) => string;
  deleteCollection: (collectionId: string) => void;
  renameCollection: (collectionId: string, name: string) => void;
  addToCollection: (collectionId: string, exerciseId: string) => void;
  removeFromCollection: (collectionId: string, exerciseId: string) => void;
  getCollection: (collectionId: string) => ExerciseCollection | undefined;
  updateSettings: (updates: Partial<ExerciseSettings>) => void;
  addRecentlyViewed: (exerciseId: string) => void;
  getRecentlyViewed: () => string[];
  syncToCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  _queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
  _clearQueue: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createCloudSnapshot(state: PreferencesState): PreferencesCloudSnapshot {
  return {
    favorites: state.favorites,
    collections: state.collections,
    filterPresets: state.filterPresets,
    settings: state.settings,
    recentlyViewed: state.recentlyViewed,
  };
}

function createCollectionRecord(name: string, color?: string): ExerciseCollection {
  return {
    id: crypto.randomUUID(),
    name,
    color,
    exerciseIds: [],
    createdAt: new Date().toISOString(),
  };
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      collections: {},
      filterPresets: {},
      settings: DEFAULT_EXERCISE_SETTINGS,
      recentlyViewed: [],
      isSyncing: false,
      lastSyncedAt: null,
      offlineQueue: [],
      motionTiltActivatedThisSession: false,
      setMotionTiltActivatedThisSession: (value) => set({ motionTiltActivatedThisSession: value }),
      addFavorite: (exerciseId) => {
        set((state) => {
          if (state.favorites.includes(exerciseId)) {
            return state;
          }

          return { favorites: [...state.favorites, exerciseId] };
        });
        get()._queueAction({ type: 'favorite', payload: exerciseId });
      },
      removeFavorite: (exerciseId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== exerciseId),
        }));
        get()._queueAction({ type: 'unfavorite', payload: exerciseId });
      },
      toggleFavorite: (exerciseId) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.includes(exerciseId)) {
          removeFavorite(exerciseId);
          return;
        }

        addFavorite(exerciseId);
      },
      isFavorite: (exerciseId) => get().favorites.includes(exerciseId),
      createCollection: (name, color) => {
        const collection = createCollectionRecord(name, color);
        set((state) => ({
          collections: { ...state.collections, [collection.id]: collection },
        }));
        get()._queueAction({ type: 'collection', payload: { action: 'create', collection } });
        return collection.id;
      },
      deleteCollection: (collectionId) => {
        set((state) => {
          const { [collectionId]: _, ...rest } = state.collections;
          return { collections: rest };
        });
        get()._queueAction({ type: 'collection', payload: { action: 'delete', collectionId } });
      },
      renameCollection: (collectionId, name) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) {
            return state;
          }

          return {
            collections: {
              ...state.collections,
              [collectionId]: { ...collection, name },
            },
          };
        });
        get()._queueAction({ type: 'collection', payload: { action: 'rename', collectionId, name } });
      },
      addToCollection: (collectionId, exerciseId) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection || collection.exerciseIds.includes(exerciseId)) {
            return state;
          }

          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                exerciseIds: [...collection.exerciseIds, exerciseId],
              },
            },
          };
        });
        get()._queueAction({ type: 'collection', payload: { action: 'add', collectionId, exerciseId } });
      },
      removeFromCollection: (collectionId, exerciseId) => {
        set((state) => {
          const collection = state.collections[collectionId];
          if (!collection) {
            return state;
          }

          return {
            collections: {
              ...state.collections,
              [collectionId]: {
                ...collection,
                exerciseIds: collection.exerciseIds.filter((id) => id !== exerciseId),
              },
            },
          };
        });
        get()._queueAction({ type: 'collection', payload: { action: 'remove', collectionId, exerciseId } });
      },
      getCollection: (collectionId) => get().collections[collectionId],
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        get()._queueAction({ type: 'settings', payload: updates });
      },
      addRecentlyViewed: (exerciseId) => {
        set((state) => ({
          recentlyViewed: [exerciseId, ...state.recentlyViewed.filter((id) => id !== exerciseId)].slice(0, 20),
        }));
      },
      getRecentlyViewed: () => get().recentlyViewed,
      _queueAction: (action) => {
        set((state) => ({
          offlineQueue: [...state.offlineQueue, createQueuedAction(action)],
        }));
      },
      _clearQueue: () => set({ offlineQueue: [] }),
      syncToCloud: async () => {
        if (!isSupabaseConfigured()) {
          return;
        }

        const user = useAuthStore.getState().user;
        if (!user) {
          return;
        }

        set({ isSyncing: true });

        try {
          await syncPreferencesRecord(user.id, createCloudSnapshot(get()));
          set({
            lastSyncedAt: new Date().toISOString(),
            offlineQueue: [],
          });
        } catch (error) {
          console.error('Failed to sync preferences:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
      loadFromCloud: async () => {
        if (!isSupabaseConfigured()) {
          return;
        }

        const user = useAuthStore.getState().user;
        if (!user) {
          return;
        }

        set({ isSyncing: true });

        try {
          const data = await loadPreferencesRecord(user.id);
          if (!data) {
            return;
          }

          const cloudSettings = (data.settings as ExerciseSettings | null) ?? null;
          const {
            settings: normalizedSettings,
            shouldPersistNormalization,
          } = normalizeSettings(cloudSettings);

          set({
            favorites: data.favorites || [],
            collections: parseCollections(data.collections),
            filterPresets: parseFilterPresets(data.filter_presets),
            settings: normalizedSettings,
            recentlyViewed: data.recently_viewed || [],
            lastSyncedAt: data.updated_at,
          });

          if (shouldPersistNormalization) {
            get()._queueAction({ type: 'settings', payload: normalizedSettings });
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
      processOfflineQueue: async () => {
        if (get().offlineQueue.length === 0) {
          return;
        }

        await get().syncToCloud();
      },
    }),
    {
      name: 'fitwizard-preferences',
      version: 2,
      migrate: (persistedState) => {
        if (!isRecord(persistedState)) {
          return persistedState as PreferencesState;
        }

        const existingSettings = isRecord(persistedState.settings)
          ? (persistedState.settings as unknown as ExerciseSettings)
          : null;
        const { settings } = normalizeSettings(existingSettings);

        return {
          ...persistedState,
          settings,
        } as PreferencesState;
      },
      partialize: (state) => ({
        favorites: state.favorites,
        collections: state.collections,
        filterPresets: state.filterPresets,
        settings: state.settings,
        recentlyViewed: state.recentlyViewed,
        offlineQueue: state.offlineQueue,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
