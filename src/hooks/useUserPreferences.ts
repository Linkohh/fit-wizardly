import { useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePreferencesStore } from '@/stores/preferencesStore';

export { usePreferencesStore } from '@/stores/preferencesStore';

/**
 * Hook for using user preferences with automatic cloud sync
 */
export function useUserPreferences() {
  const user = useAuthStore((state) => state.user);
  const favorites = usePreferencesStore((state) => state.favorites);
  const collections = usePreferencesStore((state) => state.collections);
  const settings = usePreferencesStore((state) => state.settings);
  const recentlyViewed = usePreferencesStore((state) => state.recentlyViewed);

  const isSyncing = usePreferencesStore((state) => state.isSyncing);
  const lastSyncedAt = usePreferencesStore((state) => state.lastSyncedAt);
  const offlineQueueLength = usePreferencesStore((state) => state.offlineQueue.length);

  const isFavorite = usePreferencesStore((state) => state.isFavorite);
  const addFavorite = usePreferencesStore((state) => state.addFavorite);
  const removeFavorite = usePreferencesStore((state) => state.removeFavorite);
  const toggleFavoriteStore = usePreferencesStore((state) => state.toggleFavorite);

  const createCollection = usePreferencesStore((state) => state.createCollection);
  const deleteCollection = usePreferencesStore((state) => state.deleteCollection);
  const renameCollection = usePreferencesStore((state) => state.renameCollection);
  const addToCollectionStore = usePreferencesStore((state) => state.addToCollection);
  const removeFromCollection = usePreferencesStore((state) => state.removeFromCollection);
  const getCollection = usePreferencesStore((state) => state.getCollection);

  const updateSettings = usePreferencesStore((state) => state.updateSettings);

  const addRecentlyViewed = usePreferencesStore((state) => state.addRecentlyViewed);
  const getRecentlyViewed = usePreferencesStore((state) => state.getRecentlyViewed);

  const syncToCloud = usePreferencesStore((state) => state.syncToCloud);
  const loadFromCloud = usePreferencesStore((state) => state.loadFromCloud);
  const processOfflineQueue = usePreferencesStore((state) => state.processOfflineQueue);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      void loadFromCloud();
    } else if (!user) {
      hasLoadedRef.current = false;
    }
  }, [user, loadFromCloud]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      if (offlineQueueLength > 0) {
        void syncToCloud();
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, offlineQueueLength, syncToCloud]);

  useEffect(() => {
    const handleOnline = () => {
      if (user && offlineQueueLength > 0) {
        void processOfflineQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user, offlineQueueLength, processOfflineQueue]);

  const toggleFavorite = useCallback(
    (exerciseId: string) => {
      toggleFavoriteStore(exerciseId);
    },
    [toggleFavoriteStore],
  );

  const addToCollection = useCallback(
    (collectionId: string, exerciseId: string) => {
      addToCollectionStore(collectionId, exerciseId);
    },
    [addToCollectionStore],
  );

  return {
    favorites,
    collections,
    settings,
    recentlyViewed,
    isSyncing,
    lastSyncedAt,
    isAuthenticated: !!user,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
    createCollection,
    deleteCollection,
    renameCollection,
    addToCollection,
    removeFromCollection,
    getCollection,
    updateSettings,
    addRecentlyViewed,
    getRecentlyViewed,
    syncToCloud,
    loadFromCloud,
  };
}

export default useUserPreferences;
