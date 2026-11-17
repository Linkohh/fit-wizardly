import { Utensils, Flame, Coffee, Moon, Sun, Star, Apple, type LucideIcon } from "lucide-react";
import { MealRecommendation, MacroGoal } from "@/types/nutrition";
import { useNutritionStore } from "@/stores/nutritionStore";
import { cn } from "@/lib/utils";

interface MealSuggestionsProps {
    goal: MacroGoal;
    isWorkoutDay: boolean;
}

// Sample meal ideas shown alongside the user's favourites
const SAMPLE_MEALS: MealRecommendation[] = [
    {
        id: '1', name: 'Power Quinoa Bowl', calories: 550, protein: 45, carbs: 50, fats: 15, category: 'maintain', tags: ['High Protein', 'Lunch'], isWorkoutMeal: true
    },
    {
        id: '2', name: 'Egg White Delight', calories: 350, protein: 30, carbs: 10, fats: 12, category: 'cut', tags: ['Low Carb', 'Breakfast'], isWorkoutMeal: false
    },
    {
        id: '3', name: 'Salmon Supreme', calories: 700, protein: 40, carbs: 60, fats: 25, category: 'bulk', tags: ['Omega-3', 'Dinner'], isWorkoutMeal: true
    },
    {
        id: '4', name: 'Berry Parfait', calories: 300, protein: 25, carbs: 35, fats: 5, category: 'maintain', tags: ['Snack', 'Quick'], isWorkoutMeal: false
    },
    {
        id: '5', name: 'Pro-Oats & Berries', calories: 450, protein: 30, carbs: 55, fats: 8, category: 'bulk', tags: ['Breakfast', 'Pre-Workout'], isWorkoutMeal: true
    },
    {
        id: '6', name: 'Keto Tuna Salad', calories: 400, protein: 40, carbs: 8, fats: 20, category: 'cut', tags: ['Keto Friendly', 'Lunch'], isWorkoutMeal: false
    },
];

// One icon per meal type, so cards need no external images (the production CSP blocks them).
const MEAL_TYPE_ICONS: ReadonlyArray<[tag: string, icon: LucideIcon]> = [
    ['Breakfast', Coffee],
    ['Lunch', Sun],
    ['Dinner', Moon],
    ['Snack', Apple],
];

function getMealTypeIcon(tags: readonly string[]): LucideIcon {
    const match = MEAL_TYPE_ICONS.find(([tag]) => tags.includes(tag));
    return match ? match[1] : Utensils;
}

export function MealSuggestions({ goal, isWorkoutDay }: MealSuggestionsProps) {
    const { favorites } = useNutritionStore();

    // Time of Day Logic
    const hour = new Date().getHours();
    let timeContext = 'General';
    let contextIcon = <Utensils className="w-4 h-4" />;

    if (hour < 10) { timeContext = 'Breakfast'; contextIcon = <Coffee className="w-4 h-4" />; }
    else if (hour < 14) { timeContext = 'Lunch'; contextIcon = <Sun className="w-4 h-4" />; }
    else if (hour < 17) { timeContext = 'Snack'; contextIcon = <Utensils className="w-4 h-4" />; }
    else { timeContext = 'Dinner'; contextIcon = <Moon className="w-4 h-4" />; }

    // 1. Process Favorites into Suggestions
    const favoriteSuggestions: MealRecommendation[] = favorites.map(fav => ({
        id: `fav-${fav.id}`,
        name: fav.name,
        calories: fav.calories,
        protein: fav.protein,
        carbs: fav.carbs,
        fats: fav.fats,
        category: 'maintain', // Generic
        tags: ['Favorite'],
        isWorkoutMeal: false
    }));

    const allMeals = [...favoriteSuggestions, ...SAMPLE_MEALS];

    const filteredMeals = allMeals.filter(meal => {
        // Show Favorites always, process others by goal
        if (meal.tags.includes('Favorite')) return true;
        return meal.category === goal || meal.category === 'maintain';
    }).sort((a, b) => {
        // Priority: Context -> Favorite -> Workout
        const aFav = a.tags.includes('Favorite');
        const bFav = b.tags.includes('Favorite');

        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        const aContext = a.tags.includes(timeContext);
        const bContext = b.tags.includes(timeContext);
        if (aContext && !bContext) return -1;
        if (!aContext && bContext) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-primary">{contextIcon}</span>
                    Suggested for {timeContext}
                </h3>
                {isWorkoutDay && <span className="text-xs font-medium px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1"><Flame className="w-3 h-3" /> Workout Day</span>}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x scrollbar-purple">
                {filteredMeals.map(meal => {
                    const MealIcon = getMealTypeIcon(meal.tags);
                    return (
                    <div key={meal.id} className="min-w-[280px] snap-center glass-card hover:translate-y-[-4px] transition-all rounded-3xl overflow-hidden group border border-white/5 cursor-pointer">
                        {/* Icon tile header (no network images) */}
                        <div className="h-32 w-full relative flex items-center justify-center bg-primary/10" data-testid="meal-icon-tile">
                            <MealIcon className="w-10 h-10 text-primary opacity-80 group-hover:scale-110 transition-transform duration-700" aria-hidden="true" />
                            <div className="absolute bottom-2 left-3">
                                <div className="font-bold text-foreground text-lg leading-tight">{meal.name}</div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400 opacity-70" /> {meal.calories} kcal</span>
                                <span className="flex items-center gap-1 text-blue-300"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> {meal.protein}g PRO</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {meal.tags.map(tag => (
                                    <span key={tag} className={cn("text-[10px] px-2 py-1 rounded-full border flex items-center gap-1", tag === 'Favorite' ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400" : tag === timeContext ? 'bg-primary/20 border-primary/30 text-primary-foreground' : 'bg-white/5 border-white/5 text-muted-foreground')}>
                                        {tag === 'Favorite' && <Star className="w-3 h-3 fill-current" />}
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
}
