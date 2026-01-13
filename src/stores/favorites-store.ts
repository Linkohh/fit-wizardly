import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
    favoriteIds: string[];
    addFavorite: (id: string) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (id: string) => void;
    isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            favoriteIds: [],
            addFavorite: (id) => set((state) => ({
                favoriteIds: state.favoriteIds.includes(id) ? state.favoriteIds : [...state.favoriteIds, id]
            })),
            removeFavorite: (id) => set((state) => ({
                favoriteIds: state.favoriteIds.filter((fid) => fid !== id)
            })),
            toggleFavorite: (id) => {
                const { favoriteIds } = get();
                if (favoriteIds.includes(id)) {
                    set({ favoriteIds: favoriteIds.filter((fid) => fid !== id) });
                } else {
                    set({ favoriteIds: [...favoriteIds, id] });
                }
            },
            isFavorite: (id) => get().favoriteIds.includes(id),
        }),
        {
            name: 'fitwizard-favorites',
        }
    )
);
