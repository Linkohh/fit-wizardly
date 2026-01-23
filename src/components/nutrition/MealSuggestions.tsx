import { Utensils, Flame, Coffee, Moon, Sun, Star } from "lucide-react";
import { MealRecommendation, MacroGoal } from "@/types/nutrition";
import { useNutritionStore } from "@/stores/nutritionStore";
import { cn } from "@/lib/utils";

interface MealSuggestionsProps {
    goal: MacroGoal;
    isWorkoutDay: boolean;
}

// PREMIUM MOCK DATA with Images (Fallback)
const SAMPLE_MEALS: MealRecommendation[] = [
    {
        id: '1', name: 'Power Quinoa Bowl', calories: 550, protein: 45, carbs: 50, fats: 15, category: 'maintain', tags: ['High Protein', 'Lunch'], isWorkoutMeal: true,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop"
    },
    {
        id: '2', name: 'Egg White Delight', calories: 350, protein: 30, carbs: 10, fats: 12, category: 'cut', tags: ['Low Carb', 'Breakfast'], isWorkoutMeal: false,
        imageUrl: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=2510&auto=format&fit=crop"
    },
    {
        id: '3', name: 'Salmon Supreme', calories: 700, protein: 40, carbs: 60, fats: 25, category: 'bulk', tags: ['Omega-3', 'Dinner'], isWorkoutMeal: true,
        imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?q=80&w=2574&auto=format&fit=crop"
    },
    {
        id: '4', name: 'Berry Parfait', calories: 300, protein: 25, carbs: 35, fats: 5, category: 'maintain', tags: ['Snack', 'Quick'], isWorkoutMeal: false,
        imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=2574&auto=format&fit=crop"
    },
    {
        id: '5', name: 'Pro-Oats & Berries', calories: 450, protein: 30, carbs: 55, fats: 8, category: 'bulk', tags: ['Breakfast', 'Pre-Workout'], isWorkoutMeal: true,
        imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=2676&auto=format&fit=crop"
    },
    {
        id: '6', name: 'Keto Tuna Salad', calories: 400, protein: 40, carbs: 8, fats: 20, category: 'cut', tags: ['Keto Friendly', 'Lunch'], isWorkoutMeal: false,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=2584&auto=format&fit=crop"
    },
];

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
        isWorkoutMeal: false,
        imageUrl: fav.imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2670&auto=format&fit=crop" // Generic food fallback
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

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x scrollbar-hide">
                {filteredMeals.map(meal => (
                    <div key={meal.id} className="min-w-[280px] snap-center glass-card hover:translate-y-[-4px] transition-all rounded-3xl overflow-hidden group border border-white/5 cursor-pointer">
                        {/* Image Header */}
                        <div className="h-32 w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                            <img src={meal.imageUrl} alt={meal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute bottom-2 left-3 z-20">
                                <div className="font-bold text-white text-lg leading-tight">{meal.name}</div>
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
                ))}
            </div>
        </div>
    );
}
