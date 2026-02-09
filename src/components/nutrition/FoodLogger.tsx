
import { useState, useEffect } from "react";
import { Plus, Search, X, Loader2, Star, ChefHat, Heart } from "lucide-react";
import { MealEntry, MacroTargets } from "@/types/nutrition";
import { cn } from "@/lib/utils";
import { searchProducts, OFFFoodProduct } from "@/lib/openFoodFacts";
import { useNutritionStore } from "@/stores/nutritionStore";

interface FoodLoggerProps {
    onLogMeal: (meal: MealEntry) => void;
    dayTotal: MacroTargets;
}

export function FoodLogger({ onLogMeal, dayTotal: _dayTotal }: FoodLoggerProps) {
    const { addCustomFood, customFoods, favorites, toggleFavorite } = useNutritionStore();
    const [mode, setMode] = useState<'view' | 'logging'>('view');
    const [activeTab, setActiveTab] = useState<'search' | 'favorites' | 'custom'>('search');

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<OFFFoodProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Custom Food State
    const [customForm, setCustomForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '' });

    // Debounced Search
    useEffect(() => {
        if (activeTab !== 'search') return;

        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsLoading(true);
                const results = await searchProducts(searchQuery);
                setSearchResults(results);
                setIsLoading(false);
            } else {
                setSearchResults([]);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, activeTab]);


    const handleAddProduct = (product: OFFFoodProduct) => {
        const newMeal: MealEntry = {
            id: Math.random().toString(),
            name: product.product_name,
            calories: Math.round(product.nutriments["energy-kcal_100g"] || 0),
            protein: Math.round(product.nutriments["proteins_100g"] || 0),
            carbs: Math.round(product.nutriments["carbohydrates_100g"] || 0),
            fats: Math.round(product.nutriments["fat_100g"] || 0),
            mealType: 'snack',
            timestamp: new Date(),
            imageUrl: product.image_url
        };
        onLogMeal(newMeal);
        close();
    };

    const handleLogSavedItem = (item: MealEntry) => {
        onLogMeal({ ...item, id: Math.random().toString(), timestamp: new Date() });
        close();
    };

    const handleSaveCustom = () => {
        if (!customForm.name || !customForm.calories) return;

        const newFood: MealEntry = {
            id: Math.random().toString(),
            name: customForm.name,
            calories: Number(customForm.calories),
            protein: Number(customForm.protein) || 0,
            carbs: Number(customForm.carbs) || 0,
            fats: Number(customForm.fats) || 0,
            mealType: 'snack',
            timestamp: new Date(),
            tags: ['Custom']
        };

        addCustomFood(newFood);
        onLogMeal(newFood); // Also log it immediately
        setCustomForm({ name: '', calories: '', protein: '', carbs: '', fats: '' });
        close();
    };

    const close = () => {
        setMode('view');
        setSearchQuery("");
    };

    return (
        <div className={cn("glass-card p-6 rounded-3xl space-y-6 relative overflow-hidden transition-all duration-500", mode === 'logging' ? 'min-h-[500px]' : '')}>
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Log Food</h3>
                {mode !== 'view' && (
                    <button onClick={close} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {mode === 'view' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={() => { setMode('logging'); setActiveTab('search'); }}
                        className="w-full py-4 border border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
                    >
                        <div className="p-2 bg-muted/50 rounded-lg group-hover:scale-110 transition-transform"><Plus className="w-4 h-4 text-primary" /></div>
                        <span className="font-medium">Add Food</span>
                    </button>

                    {/* Quick Favorites Mini-List (Top 3) */}
                    {favorites.length > 0 && (
                        <div className="pt-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 ml-1">Quick Add Favorites</div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {favorites.slice(0, 5).map(fav => (
                                    <button key={fav.id} onClick={() => handleLogSavedItem(fav)} className="flex-shrink-0 bg-muted/50 hover:bg-primary/20 border border-border/50 hover:border-primary/30 rounded-xl p-3 flex flex-col items-center gap-1 min-w-[80px] transition-all">
                                        <span className="text-xl">⭐</span>
                                        <span className="text-[10px] font-medium truncate max-w-[70px]">{fav.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === 'logging' && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                    {/* TABS */}
                    <div className="flex p-1 bg-muted/30 rounded-xl mb-4">
                        {(['search', 'favorites', 'custom'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize flex items-center justify-center gap-2", activeTab === tab ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-foreground")}
                            >
                                {tab === 'search' && <Search className="w-4 h-4" />}
                                {tab === 'favorites' && <Heart className="w-4 h-4" />}
                                {tab === 'custom' && <ChefHat className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">

                        {/* SEARCH TAB */}
                        {activeTab === 'search' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search (e.g. 'Oats')..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 ring-primary/50 transition-all font-medium"
                                    />
                                    {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
                                </div>

                                <div className="space-y-2">
                                    {searchResults.map((product) => (
                                        <div key={product.code} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group">
                                            <button
                                                type="button"
                                                className="flex-1 min-w-0 cursor-pointer text-left"
                                                onClick={() => handleAddProduct(product)}
                                            >
                                                <div className="font-medium truncate text-sm text-foreground group-hover:text-primary">{product.product_name}</div>
                                                <div className="text-xs text-muted-foreground">{Math.round(product.nutriments["energy-kcal_100g"] || 0)} kcal / 100g</div>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    toggleFavorite({
                                                        id: product.code,
                                                        name: product.product_name,
                                                        calories: product.nutriments["energy-kcal_100g"] || 0,
                                                        protein: product.nutriments["proteins_100g"] || 0,
                                                        carbs: product.nutriments["carbohydrates_100g"] || 0,
                                                        fats: product.nutriments["fat_100g"] || 0,
                                                        mealType: 'snack', timestamp: new Date()
                                                    });
                                                }}
                                                className={cn("p-2 rounded-lg transition-colors", favorites.some(f => f.name === product.product_name) ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400")}
                                            >
                                                <Star className={cn("w-4 h-4", favorites.some(f => f.name === product.product_name) ? "fill-current" : "")} />
                                            </button>
                                            <button onClick={() => handleAddProduct(product)} className="p-2 bg-white/5 rounded-lg text-primary">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FAVORITES TAB */}
                        {activeTab === 'favorites' && (
                            <div className="space-y-2">
                                {favorites.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <Heart className="w-8 h-8 opacity-20" />
                                        <span>No favorites yet. Star items from Search!</span>
                                    </div>
                                )}
                                {favorites.map((food) => (
                                    <div key={food.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-all">
                                        <button
                                            type="button"
                                            className="cursor-pointer flex-1 text-left"
                                            onClick={() => handleLogSavedItem(food)}
                                        >
                                            <div className="font-medium text-sm">{food.name}</div>
                                            <div className="text-xs text-muted-foreground">{food.calories} kcal • {food.protein}P {food.carbs}C {food.fats}F</div>
                                        </button>
                                        <button onClick={() => toggleFavorite(food)} className="p-2 text-yellow-400 hover:text-muted-foreground">
                                            <Star className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CUSTOM TAB */}
                        {activeTab === 'custom' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Food Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grandma's Chicken Rice"
                                        value={customForm.name}
                                        onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                                        className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Calories</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={customForm.calories}
                                            onChange={e => setCustomForm({ ...customForm, calories: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-primary/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Protein (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={customForm.protein}
                                            onChange={e => setCustomForm({ ...customForm, protein: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-blue-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Carbs (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={customForm.carbs}
                                            onChange={e => setCustomForm({ ...customForm, carbs: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-green-500/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground">Fats (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={customForm.fats}
                                            onChange={e => setCustomForm({ ...customForm, fats: e.target.value })}
                                            className="w-full bg-muted/30 border border-border rounded-xl p-3 outline-none focus:ring-2 ring-yellow-500/50"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <button
                                        onClick={handleSaveCustom}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        Save & Log Food
                                    </button>

                                    {customFoods.length > 0 && (
                                        <div className="border-t border-border pt-3">
                                            <div className="text-xs text-muted-foreground uppercase mb-2">My Custom Foods</div>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                                {customFoods.map(food => (
                                                    <button
                                                        key={food.id}
                                                        type="button"
                                                        onClick={() => handleLogSavedItem(food)}
                                                        className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm text-left"
                                                    >
                                                        <span>{food.name}</span>
                                                        <span className="text-muted-foreground text-xs">{food.calories} kcal</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
