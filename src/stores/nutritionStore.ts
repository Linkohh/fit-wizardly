import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserNutritionProfile, MacroTargets, DailyNutritionLog, MealEntry } from '@/types/nutrition';

interface NutritionState {
    profile: UserNutritionProfile | null;
    targets: MacroTargets | null;

    // History Management
    history: Record<string, DailyNutritionLog>; // Key is YYYY-MM-DD
    selectedDate: string; // YYYY-MM-DD

    // Custom & Favorites
    customFoods: MealEntry[];
    favorites: MealEntry[];

    // Actions
    setProfile: (profile: UserNutritionProfile, targets: MacroTargets) => void;
    updateHydration: (amount: number) => void;
    logMeal: (meal: MealEntry) => void;
    removeMeal: (mealId: string) => void;
    changeDate: (date: string) => void;

    // Power Feature Actions
    addCustomFood: (food: MealEntry) => void;
    deleteCustomFood: (id: string) => void;
    toggleFavorite: (food: MealEntry) => void;

    // Computed helpers (though strict Zustand recommends selectors, we can expose a getter or just ensure data exists)
    getCurrentLog: () => DailyNutritionLog;
}

export const useNutritionStore = create<NutritionState>()(
    persist(
        (set, get) => ({
            profile: null,
            targets: null,
            history: {},
            selectedDate: new Date().toISOString().split('T')[0],
            customFoods: [],
            favorites: [],

            getCurrentLog: () => {
                const { history, selectedDate, targets } = get();
                if (history[selectedDate]) return history[selectedDate];

                // Return a fresh empty log if none exists for this date
                return {
                    id: selectedDate,
                    date: new Date(selectedDate).toISOString(),
                    meals: [],
                    water: 0,
                    targets: targets || { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    isWorkoutDay: false
                };
            },

            setProfile: (profile, targets) => set((state) => {
                // Update targets for the current day immediately if it exists, or it will be used for new days
                const today = new Date().toISOString().split('T')[0];
                const currentHistory = { ...state.history };

                // Update today's log targets if it exists
                if (currentHistory[today]) {
                    currentHistory[today] = { ...currentHistory[today], targets };
                }

                return {
                    profile,
                    targets,
                    history: currentHistory
                };
            }),

            changeDate: (date) => set({ selectedDate: date }),

            updateHydration: (amount) => set((state) => {
                const date = state.selectedDate;
                const currentLog = state.history[date] || {
                    id: date,
                    date: new Date(date).toISOString(),
                    meals: [],
                    water: 0,
                    targets: state.targets || { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    isWorkoutDay: false
                };

                return {
                    history: {
                        ...state.history,
                        [date]: { ...currentLog, water: Math.max(0, amount) }
                    }
                };
            }),

            logMeal: (meal) => set((state) => {
                const date = state.selectedDate;
                const currentLog = state.history[date] || {
                    id: date,
                    date: new Date(date).toISOString(),
                    meals: [],
                    water: 0,
                    targets: state.targets || { calories: 0, protein: 0, carbs: 0, fats: 0 },
                    isWorkoutDay: false
                };

                return {
                    history: {
                        ...state.history,
                        [date]: {
                            ...currentLog,
                            meals: [...currentLog.meals, meal]
                        }
                    }
                };
            }),

            removeMeal: (mealId) => set((state) => {
                const date = state.selectedDate;
                const currentLog = state.history[date];
                if (!currentLog) return state; // Should not happen if removing a meal from a rendered list

                return {
                    history: {
                        ...state.history,
                        [date]: {
                            ...currentLog,
                            meals: currentLog.meals.filter(m => m.id !== mealId)
                        }
                    }
                };
            }),

            addCustomFood: (food) => set((state) => ({
                customFoods: [...state.customFoods, food]
            })),

            deleteCustomFood: (id) => set((state) => ({
                customFoods: state.customFoods.filter(f => f.id !== id)
            })),

            toggleFavorite: (food) => set((state) => {
                const isFav = state.favorites.some(f => f.name === food.name); // Simple match by name for now, or ID if persistent
                if (isFav) {
                    return { favorites: state.favorites.filter(f => f.name !== food.name) };
                } else {
                    return { favorites: [...state.favorites, food] };
                }
            }),
        }),
        {
            name: 'fitwizard-nutrition-storage',
            partialize: (state) => ({
                profile: state.profile,
                targets: state.targets,
                history: state.history,
                customFoods: state.customFoods,
                favorites: state.favorites
            }), // Don't persist selectedDate, always start on Today
        }
    )
);

