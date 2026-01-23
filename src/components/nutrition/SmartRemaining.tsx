import { useMemo } from 'react';
import { Lightbulb, Zap } from 'lucide-react';

interface SmartFood {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  servingSize: string;
  primaryMacro: 'protein' | 'carbs' | 'fats';
}

const SMART_FOODS: SmartFood[] = [
  // High protein
  { name: 'Chicken Breast', protein: 31, carbs: 0, fats: 4, calories: 165, servingSize: '100g', primaryMacro: 'protein' },
  { name: 'Greek Yogurt', protein: 17, carbs: 6, fats: 1, calories: 100, servingSize: '170g', primaryMacro: 'protein' },
  { name: 'Eggs (2 large)', protein: 12, carbs: 1, fats: 10, calories: 140, servingSize: '2 eggs', primaryMacro: 'protein' },
  { name: 'Cottage Cheese', protein: 18, carbs: 5, fats: 2, calories: 120, servingSize: '150g', primaryMacro: 'protein' },
  { name: 'Tuna (canned)', protein: 25, carbs: 0, fats: 1, calories: 110, servingSize: '100g', primaryMacro: 'protein' },
  { name: 'Protein Shake', protein: 24, carbs: 3, fats: 2, calories: 120, servingSize: '1 scoop', primaryMacro: 'protein' },
  { name: 'Turkey Breast', protein: 29, carbs: 0, fats: 1, calories: 125, servingSize: '100g', primaryMacro: 'protein' },
  // High carbs
  { name: 'Brown Rice', protein: 5, carbs: 45, fats: 2, calories: 215, servingSize: '1 cup cooked', primaryMacro: 'carbs' },
  { name: 'Banana', protein: 1, carbs: 27, fats: 0, calories: 105, servingSize: '1 medium', primaryMacro: 'carbs' },
  { name: 'Oatmeal', protein: 6, carbs: 27, fats: 4, calories: 150, servingSize: '1 cup cooked', primaryMacro: 'carbs' },
  { name: 'Sweet Potato', protein: 2, carbs: 26, fats: 0, calories: 103, servingSize: '1 medium', primaryMacro: 'carbs' },
  { name: 'Whole Wheat Bread', protein: 4, carbs: 24, fats: 2, calories: 130, servingSize: '2 slices', primaryMacro: 'carbs' },
  { name: 'Apple', protein: 0, carbs: 25, fats: 0, calories: 95, servingSize: '1 medium', primaryMacro: 'carbs' },
  { name: 'Pasta', protein: 7, carbs: 43, fats: 1, calories: 200, servingSize: '1 cup cooked', primaryMacro: 'carbs' },
  // High fats
  { name: 'Avocado (half)', protein: 2, carbs: 6, fats: 15, calories: 160, servingSize: '1/2 avocado', primaryMacro: 'fats' },
  { name: 'Almonds', protein: 6, carbs: 6, fats: 14, calories: 164, servingSize: '28g', primaryMacro: 'fats' },
  { name: 'Peanut Butter', protein: 8, carbs: 6, fats: 16, calories: 190, servingSize: '2 tbsp', primaryMacro: 'fats' },
  { name: 'Olive Oil', protein: 0, carbs: 0, fats: 14, calories: 120, servingSize: '1 tbsp', primaryMacro: 'fats' },
  { name: 'Dark Chocolate (85%)', protein: 2, carbs: 8, fats: 15, calories: 170, servingSize: '30g', primaryMacro: 'fats' },
  { name: 'Walnuts', protein: 4, carbs: 4, fats: 18, calories: 185, servingSize: '28g', primaryMacro: 'fats' },
];

interface SmartRemainingProps {
  remaining: { calories: number; protein: number; carbs: number; fats: number };
  priorityMacro: 'protein' | 'carbs' | 'fats';
}

export function SmartRemaining({ remaining, priorityMacro }: SmartRemainingProps) {
  const suggestions = useMemo(() => {
    // Filter foods matching the priority macro that fit within remaining calories
    const filtered = SMART_FOODS
      .filter((f) => f.primaryMacro === priorityMacro && f.calories <= remaining.calories + 50)
      .sort((a, b) => b[priorityMacro] - a[priorityMacro]);

    // If not enough foods for priority, add from other macros
    if (filtered.length < 3) {
      const others = SMART_FOODS
        .filter((f) => f.primaryMacro !== priorityMacro && f.calories <= remaining.calories + 50)
        .sort((a, b) => b[priorityMacro] - a[priorityMacro]);
      return [...filtered, ...others].slice(0, 4);
    }

    return filtered.slice(0, 4);
  }, [remaining, priorityMacro]);

  const macroLabel = priorityMacro === 'protein' ? 'Protein' : priorityMacro === 'carbs' ? 'Carbs' : 'Fats';
  const macroColor = priorityMacro === 'protein' ? 'text-blue-400' : priorityMacro === 'carbs' ? 'text-green-400' : 'text-yellow-400';

  // Don't show if all macros are met
  if (remaining.calories <= 0) return null;

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Smart Suggestions</h3>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        You need more <span className={`font-medium ${macroColor}`}>{macroLabel.toLowerCase()}</span> to hit your targets. Try these:
      </p>

      <div className="space-y-2.5">
        {suggestions.map((food) => (
          <div
            key={food.name}
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{food.name}</p>
              <p className="text-xs text-muted-foreground">{food.servingSize}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium">{food.calories} cal</p>
              <div className="text-[10px] text-muted-foreground flex gap-1">
                <span className="text-blue-400">{food.protein}p</span>
                <span className="text-green-400">{food.carbs}c</span>
                <span className="text-yellow-400">{food.fats}f</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          <span>
            {remaining.calories} cal remaining ({remaining.protein}g P / {remaining.carbs}g C / {remaining.fats}g F)
          </span>
        </div>
      </div>
    </div>
  );
}
