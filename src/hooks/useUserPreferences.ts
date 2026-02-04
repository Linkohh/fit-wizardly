/**
 * User Exercise Preferences Hook
 *
 * Manages user exercise preferences with Supabase cloud sync.
 * Features:
 * - Optimistic UI updates (instant local state changes)
 * - Background sync to Supabase
 * - Offline queue with sync on reconnect
 * - Falls back to localStorage when not authenticated
 */

import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type {
    ExerciseSettings,
    ExerciseCollection,
    UserExercisePreferences,
} from '@/types/supabase';

// Offline action queue item
interface QueuedAction {
    id: string;
    type: 'favorite' | 'unfavorite' | 'collection' | 'settings' | 'recently_viewed';
    payload: any;
    timestamp: number;
}

// Store state interface
interface PreferencesState {
    // Data
    favorites: string[];
    collections: Record<string, ExerciseCollection>;
    filterPresets: Record<string, any>;
    settings: ExerciseSettings;
    recentlyViewed: string[];

    // Sync state
    isSyncing: boolean;
    lastSyncedAt: string | null;
    offlineQueue: QueuedAction[];

    // Actions
    addFavorite: (exerciseId: string) => void;
    removeFavorite: (exerciseId: string) => void;
    toggleFavorite: (exerciseId: string) => void;
    isFavorite: (exerciseId: string) => boolean;

    // Collections
    createCollection: (name: string, color?: string) => string;
    deleteCollection: (collectionId: string) => void;
    renameCollection: (collectionId: string, name: string) => void;
    addToCollection: (collectionId: string, exerciseId: string) => void;
    removeFromCollection: (collectionId: string, exerciseId: string) => void;
    getCollection: (collectionId: string) => ExerciseCollection | undefined;

    // Settings
    updateSettings: (updates: Partial<ExerciseSettings>) => void;

    // Recently viewed
    addRecentlyViewed: (exerciseId: string) => void;
    getRecentlyViewed: () => string[];

    // Sync
    syncToCloud: () => Promise<void>;
    loadFromCloud: () => Promise<void>;
    processOfflineQueue: () => Promise<void>;

    // Internal
    _queueAction: (action: Omit<QueuedAction, 'id' | 'timestamp'>) => void;
    _clearQueue: () => void;
}

// Generate unique ID
const generateId = () => crypto.randomUUID();

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

// Create the store with persistence
export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set, get) => ({
            // Initial state
            favorites: [],
            collections: {},
            filterPresets: {},
            settings: {
                haptics: true,
                sounds: true,
                soundsExplicitlySet: true,
                reducedMotion: false,
            },
            recentlyViewed: [],
            isSyncing: false,
            lastSyncedAt: null,
            offlineQueue: [],

            // Favorites
            addFavorite: (exerciseId) => {
                set((state) => {
                    if (state.favorites.includes(exerciseId)) return state;
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
                } else {
                    addFavorite(exerciseId);
                }
            },

            isFavorite: (exerciseId) => get().favorites.includes(exerciseId),

            // Collections
            createCollection: (name, color) => {
                const id = generateId();
                const collection: ExerciseCollection = {
                    id,
                    name,
                    color,
                    exerciseIds: [],
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    collections: { ...state.collections, [id]: collection },
                }));
                get()._queueAction({ type: 'collection', payload: { action: 'create', collection } });
                return id;
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
                    if (!collection) return state;
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
                    if (!collection || collection.exerciseIds.includes(exerciseId)) return state;
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
                    if (!collection) return state;
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

            // Settings
            updateSettings: (updates) => {
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                }));
                get()._queueAction({ type: 'settings', payload: updates });
            },

            // Recently viewed
            addRecentlyViewed: (exerciseId) => {
                set((state) => {
                    // Remove if already in list, add to front, keep max 20
                    const filtered = state.recentlyViewed.filter((id) => id !== exerciseId);
                    return {
                        recentlyViewed: [exerciseId, ...filtered].slice(0, 20),
                    };
                });
                // Don't queue recently viewed - too frequent, sync periodically instead
            },

            getRecentlyViewed: () => get().recentlyViewed,

            // Queue action for sync
            _queueAction: (action) => {
                set((state) => ({
                    offlineQueue: [
                        ...state.offlineQueue,
                        {
                            ...action,
                            id: generateId(),
                            timestamp: Date.now(),
                        },
                    ],
                }));
            },

            _clearQueue: () => set({ offlineQueue: [] }),

            // Sync to cloud
            syncToCloud: async () => {
                if (!isSupabaseConfigured()) return;

                const user = useAuthStore.getState().user;
                if (!user) return;

                const { favorites, collections, filterPresets, settings, recentlyViewed } = get();

                set({ isSyncing: true });

                try {
                    const { error } = await supabase
                        .from('user_exercise_preferences')
                        .upsert({
                            user_id: user.id,
                            favorites,
                            collections,
                            filter_presets: filterPresets,
                            settings,
                            recently_viewed: recentlyViewed,
                            updated_at: new Date().toISOString(),
                        });

                    if (error) throw error;

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

            // Load from cloud
            loadFromCloud: async () => {
                if (!isSupabaseConfigured()) return;

                const user = useAuthStore.getState().user;
                if (!user) return;

                set({ isSyncing: true });

                try {
                    const { data, error } = await supabase
                        .from('user_exercise_preferences')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();

                    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

                    if (data) {
                        const cloudSettings = (data.settings as ExerciseSettings | null) ?? null;
                        const shouldForceEnableSounds =
                            !cloudSettings?.soundsExplicitlySet && cloudSettings?.sounds !== true;

                        const migratedSettings: ExerciseSettings = shouldForceEnableSounds
                            ? {
                                ...(cloudSettings ?? { haptics: true, sounds: true }),
                                sounds: true,
                                soundsExplicitlySet: true,
                            }
                            : (cloudSettings ?? {
                                haptics: true,
                                sounds: true,
                                soundsExplicitlySet: true,
                            });

                        set({
                            favorites: data.favorites || [],
                            collections: (data.collections as Record<string, ExerciseCollection>) || {},
                            filterPresets: data.filter_presets || {},
                            settings: migratedSettings,
                            recentlyViewed: data.recently_viewed || [],
                            lastSyncedAt: data.updated_at,
                        });

                        // Persist the migrated default back to cloud so the behavior is consistent across devices.
                        if (shouldForceEnableSounds) {
                            get()._queueAction({ type: 'settings', payload: migratedSettings });
                        }
                    }
                } catch (error) {
                    console.error('Failed to load preferences:', error);
                } finally {
                    set({ isSyncing: false });
                }
            },

            // Process offline queue
            processOfflineQueue: async () => {
                const { offlineQueue, syncToCloud } = get();
                if (offlineQueue.length === 0) return;

                // Simply sync the current state - the queue helped us track that changes were made
                await syncToCloud();
            },
        }),
        {
            name: 'fitwizard-preferences',
            version: 1,
            migrate: (persistedState, version) => {
                if (version !== 0) return persistedState as PreferencesState;
                if (!isRecord(persistedState)) return persistedState as PreferencesState;

                const existingSettings = isRecord(persistedState.settings)
                    ? persistedState.settings
                    : {};

                return {
                    ...persistedState,
                    settings: {
                        ...existingSettings,
                        sounds: true,
                        soundsExplicitlySet: true,
                    },
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
        }
    )
);

/**
 * Hook for using user preferences with automatic cloud sync
 */
export function useUserPreferences() {
    const store = usePreferencesStore();
    const { user } = useAuthStore();
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasLoadedRef = useRef(false);

    // Load from cloud when user logs in
    useEffect(() => {
        if (user && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
            store.loadFromCloud();
        } else if (!user) {
            hasLoadedRef.current = false;
        }
    }, [user, store.loadFromCloud]);

    // Debounced sync when preferences change
    useEffect(() => {
        if (!user) return;

        // Clear existing timeout
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        // Sync after 2 seconds of no changes
        syncTimeoutRef.current = setTimeout(() => {
            if (store.offlineQueue.length > 0) {
                store.syncToCloud();
            }
        }, 2000);

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [user, store.offlineQueue.length, store.syncToCloud]);

    // Process offline queue when coming back online
    useEffect(() => {
        const handleOnline = () => {
            if (user && store.offlineQueue.length > 0) {
                store.processOfflineQueue();
            }
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [user, store.offlineQueue.length, store.processOfflineQueue]);

    // Wrapper functions with cloud awareness
    const toggleFavorite = useCallback(
        (exerciseId: string) => {
            store.toggleFavorite(exerciseId);
        },
        [store.toggleFavorite]
    );

    const addToCollection = useCallback(
        (collectionId: string, exerciseId: string) => {
            store.addToCollection(collectionId, exerciseId);
        },
        [store.addToCollection]
    );

    return {
        // Data
        favorites: store.favorites,
        collections: store.collections,
        settings: store.settings,
        recentlyViewed: store.recentlyViewed,

        // State
        isSyncing: store.isSyncing,
        lastSyncedAt: store.lastSyncedAt,
        isAuthenticated: !!user,

        // Favorites
        toggleFavorite,
        isFavorite: store.isFavorite,
        addFavorite: store.addFavorite,
        removeFavorite: store.removeFavorite,

        // Collections
        createCollection: store.createCollection,
        deleteCollection: store.deleteCollection,
        renameCollection: store.renameCollection,
        addToCollection,
        removeFromCollection: store.removeFromCollection,
        getCollection: store.getCollection,

        // Settings
        updateSettings: store.updateSettings,

        // Recently viewed
        addRecentlyViewed: store.addRecentlyViewed,
        getRecentlyViewed: store.getRecentlyViewed,

        // Manual sync
        syncToCloud: store.syncToCloud,
        loadFromCloud: store.loadFromCloud,
    };
}

export default useUserPreferences;
