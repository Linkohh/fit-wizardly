import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserNutritionProfile, MacroTargets, DailyNutritionLog, MealEntry, MealTemplate } from '@/types/nutrition';

interface NutritionState {
    profile: UserNutritionProfile | null;
    targets: MacroTargets | null;

    // History Management
    history: Record<string, DailyNutritionLog>; // Key is YYYY-MM-DD
    selectedDate: string; // YYYY-MM-DD

    // Custom & Favorites
    customFoods: MealEntry[];
    favorites: MealEntry[];
    savedMeals: MealTemplate[]; // Templates

    // Actions
    setProfile: (profile: UserNutritionProfile, targets: MacroTargets) => void;
    updateHydration: (amount: number) => void;
    logMeal: (meal: MealEntry | MealEntry[]) => void;
    removeMeal: (mealId: string) => void;
    changeDate: (date: string) => void;

    // Power Feature Actions
    addCustomFood: (food: MealEntry) => void;
    deleteCustomFood: (id: string) => void;
    toggleFavorite: (food: MealEntry) => void;

    // Template Actions
    saveMealTemplate: (template: Omit<MealTemplate, 'id' | 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFats'>) => void;
    deleteMealTemplate: (id: string) => void;

    // Computed helpers
    getCurrentLog: () => DailyNutritionLog;
    getRecentMeals: (type: string) => MealEntry[];
    getLastFullMeal: (type: string) => MealEntry[]; // New helper
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
            savedMeals: [],

            getRecentMeals: (type) => {
                const { history } = get();
                const allMeals = Object.values(history).flatMap(day => day.meals);

                // If type is provided, filter by it. If 'all', return all.
                const filtered = type === 'all'
                    ? allMeals
                    : allMeals.filter(m => m.mealType === type);

                // De-duplicate by name to show unique options
                const uniqueMap = new Map();
                filtered.forEach(meal => {
                    if (!uniqueMap.has(meal.name)) {
                        uniqueMap.set(meal.name, meal);
                    }
                });

                return Array.from(uniqueMap.values())
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5);
            },

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
                const log = get().getCurrentLog();
                const newLog = { ...log, water: Math.max(0, log.water + amount) };

                return {
                    history: {
                        ...state.history,
                        [log.date]: newLog
                    }
                };
            }),

            logMeal: (mealOrMeals) => set((state) => {
                const log = get().getCurrentLog();
                const mealsToAdd = Array.isArray(mealOrMeals) ? mealOrMeals : [mealOrMeals];

                const newLog = {
                    ...log,
                    meals: [...log.meals, ...mealsToAdd]
                };

                return {
                    history: {
                        ...state.history,
                        [log.date]: newLog
                    }
                };
            }),

            removeMeal: (mealId) => set((state) => {
                const log = get().getCurrentLog();
                const newLog = {
                    ...log,
                    meals: log.meals.filter(m => m.id !== mealId)
                };

                return {
                    history: {
                        ...state.history,
                        [log.date]: newLog
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
                const exists = state.favorites.some(f => f.name === food.name);
                if (exists) {
                    return { favorites: state.favorites.filter(f => f.name !== food.name) };
                } else {
                    return { favorites: [...state.favorites, food] };
                }
            }),

            saveMealTemplate: (input) => set((state) => {
                const totalCalories = input.items.reduce((sum, item) => sum + item.calories, 0);
                const totalProtein = input.items.reduce((sum, item) => sum + item.protein, 0);
                const totalCarbs = input.items.reduce((sum, item) => sum + item.carbs, 0);
                const totalFats = input.items.reduce((sum, item) => sum + item.fats, 0);

                const newTemplate: MealTemplate = {
                    ...input,
                    id: Math.random().toString(),
                    totalCalories,
                    totalProtein,
                    totalCarbs,
                    totalFats
                };

                return { savedMeals: [...state.savedMeals, newTemplate] };
            }),

            deleteMealTemplate: (id) => set((state) => ({
                savedMeals: state.savedMeals.filter(m => m.id !== id)
            })),

            getLastFullMeal: (type) => {
                const { history } = get();
                const dates = Object.keys(history).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                for (const date of dates) {
                    const dayLog = history[date];
                    const mealsOfType = dayLog.meals.filter(m => m.mealType === type);
                    if (mealsOfType.length > 0) {
                        return mealsOfType;
                    }
                }
                return [];
            },
        }),
        {
            name: 'fitwizard-nutrition-storage',
            partialize: (state) => ({
                profile: state.profile,
                targets: state.targets,
                history: state.history,
                customFoods: state.customFoods,
                favorites: state.favorites,
                savedMeals: state.savedMeals
            }),
        }
    )
);

