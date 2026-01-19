import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserNutritionProfile, MacroTargets, DailyNutritionLog, MealEntry } from '@/types/nutrition';

interface NutritionState {
    profile: UserNutritionProfile | null;
    targets: MacroTargets | null;
    dailyLog: DailyNutritionLog;

    // Actions
    setProfile: (profile: UserNutritionProfile, targets: MacroTargets) => void;
    updateHydration: (amount: number) => void;
    logMeal: (meal: MealEntry) => void;
    checkNewDay: () => void;
}

export const useNutritionStore = create<NutritionState>()(
    persist(
        (set, get) => ({
            profile: null,
            targets: null,
            dailyLog: {
                id: new Date().toISOString().split('T')[0],
                date: new Date().toISOString(),
                meals: [],
                water: 0,
                targets: { calories: 0, protein: 0, carbs: 0, fats: 0 },
                isWorkoutDay: false,
            },

            setProfile: (profile, targets) => set((state) => ({
                profile,
                targets,
                // Update daily log targets synchronously
                dailyLog: { ...state.dailyLog, targets }
            })),

            updateHydration: (amount) => set((state) => ({
                dailyLog: { ...state.dailyLog, water: Math.max(0, amount) }
            })),

            logMeal: (meal) => set((state) => ({
                dailyLog: {
                    ...state.dailyLog,
                    meals: [...state.dailyLog.meals, meal]
                }
            })),

            checkNewDay: () => {
                const today = new Date().toISOString().split('T')[0];
                const state = get();
                if (state.dailyLog.id !== today) {
                    set({
                        dailyLog: {
                            id: today,
                            date: new Date().toISOString(),
                            meals: [],
                            water: 0,
                            targets: state.targets || { calories: 0, protein: 0, carbs: 0, fats: 0 },
                            isWorkoutDay: false // This ideally would come from a workout plan store
                        }
                    });
                }
            }
        }),
        {
            name: 'fitwizard-nutrition-storage',
        }
    )
);
